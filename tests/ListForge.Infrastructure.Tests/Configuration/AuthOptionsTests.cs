using FluentAssertions;
using ListForge.Infrastructure.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ListForge.Infrastructure.Tests.Configuration;

public sealed class AuthOptionsTests
{
    [Fact]
    public void Bind_AllRequiredFieldsProvided_ReturnsPopulatedOptions()
    {
        // Arrange
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:SupabaseUrl"] = "https://example.supabase.co",
            ["Auth:JwtSecret"] = "test-jwt-secret-32-chars-minimum-x",
            ["Auth:Audience"] = "authenticated",
        });

        // Act
        var options = provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        options.SupabaseUrl.Should().Be("https://example.supabase.co");
        options.JwtSecret.Should().Be("test-jwt-secret-32-chars-minimum-x");
        options.Audience.Should().Be("authenticated");
    }

    [Fact]
    public void Bind_AudienceOmitted_DefaultsToAuthenticated()
    {
        // Arrange
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:SupabaseUrl"] = "https://example.supabase.co",
            ["Auth:JwtSecret"] = "test-jwt-secret-32-chars-minimum-x",
        });

        // Act
        var options = provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        options.Audience.Should().Be("authenticated");
    }

    [Fact]
    public void Bind_MissingJwtSecret_ThrowsOptionsValidationException()
    {
        // Arrange
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:SupabaseUrl"] = "https://example.supabase.co",
        });

        // Act
        var act = () => provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*JwtSecret*");
    }

    [Fact]
    public void Bind_MissingSupabaseUrl_ThrowsOptionsValidationException()
    {
        // Arrange
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:JwtSecret"] = "test-jwt-secret-32-chars-minimum-x",
        });

        // Act
        var act = () => provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*SupabaseUrl*");
    }

    [Fact]
    public void Bind_EmptyJwtSecret_ThrowsOptionsValidationException()
    {
        // Arrange
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:SupabaseUrl"] = "https://example.supabase.co",
            ["Auth:JwtSecret"] = string.Empty,
        });

        // Act
        var act = () => provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*JwtSecret*");
    }

    private static ServiceProvider BuildProviderWith(IDictionary<string, string?> values)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();

        var services = new ServiceCollection();
        services.AddOptions<AuthOptions>()
            .Bind(configuration.GetSection(AuthOptions.SectionName))
            .ValidateDataAnnotations();

        return services.BuildServiceProvider();
    }
}
