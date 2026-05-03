using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ListForge.Contracts.Auth;
using ListForge.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ListForge.API.Tests.Controllers;

public sealed class AuthControllerTests : IClassFixture<PostgresFixture>
{
    private readonly PostgresFixture _postgres;

    public AuthControllerTests(PostgresFixture postgres)
    {
        _postgres = postgres;
    }

    [SkippableFact]
    public async Task Register_ValidPayload_Returns201WithTokenPair()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available — Postgres container could not start.");

        // Arrange
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: "alice@example.com", Password: "password123"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<AuthTokensResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.RefreshToken.Should().NotBeNullOrWhiteSpace();
        body.AccessTokenExpiresAt.Should().BeAfter(DateTimeOffset.UtcNow);
        body.RefreshTokenExpiresAt.Should().BeAfter(DateTimeOffset.UtcNow);
    }

    [SkippableFact]
    public async Task Register_DuplicateEmail_Returns409()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available.");

        // Arrange
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();
        var first = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: "dup@example.com", Password: "password123"));
        first.EnsureSuccessStatusCode();

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: "dup@example.com", Password: "password123"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [SkippableFact]
    public async Task Register_ShortPassword_Returns422()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available.");

        // Arrange
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: "weak@example.com", Password: "short"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [SkippableFact]
    public async Task Login_ValidCredentials_Returns200WithTokenPair()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available.");

        // Arrange
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: "bob@example.com", Password: "password123"));

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            Email: "bob@example.com", Password: "password123"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<AuthTokensResponse>();
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.RefreshToken.Should().NotBeNullOrWhiteSpace();
    }

    [SkippableFact]
    public async Task Login_WrongPassword_Returns401()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available.");

        // Arrange
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: "carol@example.com", Password: "password123"));

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            Email: "carol@example.com", Password: "wrong-password"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Login_UnknownEmail_Returns401()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available.");

        // Arrange
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            Email: "ghost@example.com", Password: "password123"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Refresh_ValidToken_Returns200WithNewPair_AndOldTokenIsRevoked()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available.");

        // Arrange
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: "dave@example.com", Password: "password123"));
        var initial = (await register.Content.ReadFromJsonAsync<AuthTokensResponse>())!;

        // Act
        var rotated = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshRequest(initial.RefreshToken));
        var second = (await rotated.Content.ReadFromJsonAsync<AuthTokensResponse>())!;

        // Assert — new pair issued, old refresh token rejected on reuse.
        rotated.StatusCode.Should().Be(HttpStatusCode.OK);
        second.RefreshToken.Should().NotBe(initial.RefreshToken);
        second.AccessToken.Should().NotBeNullOrWhiteSpace();

        var reused = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshRequest(initial.RefreshToken));
        reused.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Refresh_UnknownToken_Returns401()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available.");

        // Arrange
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        // Act
        var response = await client.PostAsJsonAsync("/api/auth/refresh",
            new RefreshRequest("not-a-real-refresh-token"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private async Task<WebApplicationFactory<Program>> CreateFactoryAsync()
    {
        var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.Sources.Clear();
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Auth:Issuer"] = "ListForge",
                    ["Auth:Audience"] = "listforge-api",
                    ["Auth:JwtSecret"] = "test-jwt-secret-32-chars-minimum-x",
                    ["Database:ConnectionString"] = _postgres.ConnectionString,
                    ["Storage:RootPath"] = Path.Combine(Path.GetTempPath(), "listforge-test-storage"),
                    ["Frontend:AllowedOrigins:0"] = "http://localhost:5173",
                });
            });
        });

        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ListForgeDbContext>();
        await db.Database.EnsureDeletedAsync();
        await db.Database.MigrateAsync();

        return factory;
    }

    [SkippableFact]
    public async Task Refresh_ExpiredToken_Returns401()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available.");

        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: "expired@example.com", Password: "password123"));
        var initial = (await register.Content.ReadFromJsonAsync<AuthTokensResponse>())!;

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ListForgeDbContext>();
            var hash = RefreshToken.Hash(initial.RefreshToken);
            var stored = await db.RefreshTokens.SingleAsync(t => t.TokenHash == hash);
            db.Entry(stored).Property(e => e.ExpiresAt).CurrentValue = DateTimeOffset.UtcNow.AddSeconds(-5);
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshRequest(initial.RefreshToken));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Refresh_RevokedToken_Returns401()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available.");

        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: "revoked@example.com", Password: "password123"));
        var initial = (await register.Content.ReadFromJsonAsync<AuthTokensResponse>())!;

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ListForgeDbContext>();
            var hash = RefreshToken.Hash(initial.RefreshToken);
            var stored = await db.RefreshTokens.SingleAsync(t => t.TokenHash == hash);
            stored.RevokedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshRequest(initial.RefreshToken));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [SkippableFact]
    public async Task Refresh_TokenForDeletedUser_Returns401()
    {
        Skip.IfNot(_postgres.IsAvailable, "Docker not available.");

        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();
        var register = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Email: "deleted@example.com", Password: "password123"));
        var initial = (await register.Content.ReadFromJsonAsync<AuthTokensResponse>())!;

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ListForgeDbContext>();
            var user = await db.Users.SingleAsync(u => u.Email == "deleted@example.com");
            db.Users.Remove(user);
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshRequest(initial.RefreshToken));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
