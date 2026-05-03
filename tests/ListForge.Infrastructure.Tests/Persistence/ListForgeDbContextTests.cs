using FluentAssertions;
using ListForge.Infrastructure.Configuration;
using ListForge.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Testcontainers.PostgreSql;

namespace ListForge.Infrastructure.Tests.Persistence;

public sealed class ListForgeDbContextTests : IAsyncLifetime
{
    private PostgreSqlContainer? _container;
    private string? _connectionString;

    public bool IsAvailable => _connectionString is not null;

    public async Task InitializeAsync()
    {
        try
        {
            _container = new PostgreSqlBuilder()
                .WithImage("postgres:16-alpine")
                .WithDatabase("listforge_dbcontext_test")
                .WithUsername("listforge")
                .WithPassword("listforge")
                .Build();
            await _container.StartAsync();
            _connectionString = _container.GetConnectionString();
        }
        catch
        {
            _connectionString = null;
        }
    }

    public async Task DisposeAsync()
    {
        if (_container is not null)
        {
            await _container.DisposeAsync();
        }
    }

    [SkippableFact]
    public async Task RefreshToken_DuplicateTokenHash_ViolatesUniqueIndex()
    {
        Skip.IfNot(IsAvailable, "Docker not available.");

        // Arrange — the unique index on TokenHash is the invariant that prevents
        // two refresh tokens colliding (and is also what makes the lookup-by-hash
        // path in AuthController.Refresh safe).
        using var scope = BuildScope();
        var db = scope.ServiceProvider.GetRequiredService<ListForgeDbContext>();
        await db.Database.MigrateAsync();

        var userId = Guid.NewGuid();
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            TokenHash = "duplicate-hash",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(14),
        });
        await db.SaveChangesAsync();

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            TokenHash = "duplicate-hash",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(14),
        });

        // Act
        var act = async () => await db.SaveChangesAsync();

        // Assert
        await act.Should().ThrowAsync<DbUpdateException>();
    }

    [SkippableFact]
    public async Task RefreshToken_RoundTripsRevokedAtMutation()
    {
        Skip.IfNot(IsAvailable, "Docker not available.");

        using var scope = BuildScope();
        var db = scope.ServiceProvider.GetRequiredService<ListForgeDbContext>();
        await db.Database.MigrateAsync();

        var entity = new RefreshToken
        {
            UserId = Guid.NewGuid(),
            TokenHash = "round-trip-hash",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(14),
        };
        db.RefreshTokens.Add(entity);
        await db.SaveChangesAsync();

        var revokedAt = DateTimeOffset.UtcNow;
        entity.RevokedAt = revokedAt;
        await db.SaveChangesAsync();

        using var verifyScope = BuildScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<ListForgeDbContext>();
        var reloaded = await verifyDb.RefreshTokens.AsNoTracking().SingleAsync(t => t.Id == entity.Id);

        reloaded.RevokedAt.Should().NotBeNull();
        reloaded.RevokedAt!.Value.Should().BeCloseTo(revokedAt, TimeSpan.FromSeconds(1));
    }

    private IServiceScope BuildScope()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IOptions<DatabaseOptions>>(
            Options.Create(new DatabaseOptions { ConnectionString = _connectionString! }));
        services.AddDbContext<ListForgeDbContext>((sp, options) =>
        {
            var connectionString = sp.GetRequiredService<IOptions<DatabaseOptions>>().Value.ConnectionString;
            options.UseNpgsql(connectionString);
        });
        services.AddIdentityCore<ApplicationUser>()
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<ListForgeDbContext>();
        return services.BuildServiceProvider().CreateScope();
    }
}
