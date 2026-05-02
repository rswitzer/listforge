using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace ListForge.API.Tests.Configuration;

public sealed class StartupValidationTests
{
    [Fact]
    public async Task Boot_AllRequiredFieldsProvided_StartsAndServesHealth()
    {
        // Arrange
        using var factory = CreateFactory(_validConfiguration);

        // Act
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public void Boot_MissingAuthJwtSecret_ThrowsOptionsValidationException()
    {
        // Arrange
        var configuration = new Dictionary<string, string?>(_validConfiguration);
        configuration.Remove("Auth:JwtSecret");
        using var factory = CreateFactory(configuration);

        // Act
        var act = () => factory.CreateClient();

        // Assert
        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*JwtSecret*");
    }

    [Fact]
    public void Boot_MissingDatabaseConnectionString_ThrowsOptionsValidationException()
    {
        // Arrange
        var configuration = new Dictionary<string, string?>(_validConfiguration);
        configuration.Remove("Database:ConnectionString");
        using var factory = CreateFactory(configuration);

        // Act
        var act = () => factory.CreateClient();

        // Assert
        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*ConnectionString*");
    }

    [Fact]
    public void Boot_MissingFrontendAllowedOrigins_ThrowsOptionsValidationException()
    {
        // Arrange
        var configuration = new Dictionary<string, string?>(_validConfiguration);
        configuration.Remove("Frontend:AllowedOrigins:0");
        using var factory = CreateFactory(configuration);

        // Act
        var act = () => factory.CreateClient();

        // Assert
        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*AllowedOrigins*");
    }

    private static readonly Dictionary<string, string?> _validConfiguration = new()
    {
        ["Auth:SupabaseUrl"] = "https://example.supabase.co",
        ["Auth:JwtSecret"] = "test-jwt-secret-32-chars-minimum-x",
        ["Database:ConnectionString"] = "Host=localhost;Database=listforge_test;Username=test;Password=test",
        ["Frontend:AllowedOrigins:0"] = "http://localhost:5173",
    };

    private static WebApplicationFactory<Program> CreateFactory(IDictionary<string, string?> configuration)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.Sources.Clear();
                config.AddInMemoryCollection(configuration);
            });
        });
    }
}
