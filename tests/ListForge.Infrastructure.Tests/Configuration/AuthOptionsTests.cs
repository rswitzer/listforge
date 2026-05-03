using FluentAssertions;
using ListForge.Infrastructure.Configuration;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ListForge.Infrastructure.Tests.Configuration;

public sealed class AuthOptionsTests
{
    private const string ValidSecret = "test-jwt-secret-32-chars-minimum-x";

    [Fact]
    public void Bind_AllRequiredFieldsProvided_ReturnsPopulatedOptions()
    {
        // Arrange
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:Issuer"] = "ListForge",
            ["Auth:Audience"] = "listforge-api",
            ["Auth:JwtSecret"] = ValidSecret,
        });

        // Act
        var options = provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        options.Issuer.Should().Be("ListForge");
        options.Audience.Should().Be("listforge-api");
        options.JwtSecret.Should().Be(ValidSecret);
    }

    [Fact]
    public void Bind_OptionalFieldsOmitted_DefaultsApplied()
    {
        // Arrange
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:JwtSecret"] = ValidSecret,
        });

        // Act
        var options = provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        options.Issuer.Should().Be("ListForge");
        options.Audience.Should().Be("listforge-api");
    }

    [Fact]
    public void Bind_MissingJwtSecret_ThrowsOptionsValidationException()
    {
        // Arrange
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:Issuer"] = "ListForge",
        });

        // Act
        var act = () => provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*JwtSecret*");
    }

    [Fact]
    public void Bind_EmptyJwtSecret_ThrowsOptionsValidationException()
    {
        // Arrange
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:JwtSecret"] = string.Empty,
        });

        // Act
        var act = () => provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*JwtSecret*");
    }

    [Fact]
    public void Bind_JwtSecretShorterThan32Chars_ThrowsOptionsValidationException()
    {
        // Arrange — HMAC-SHA256 keys must be at least 32 bytes; we enforce that as a min length.
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:JwtSecret"] = "too-short",
        });

        // Act
        var act = () => provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*JwtSecret*");
    }

    [Fact]
    public void Bind_EmptyIssuer_ThrowsOptionsValidationException()
    {
        // Arrange
        var provider = BuildProviderWith(new Dictionary<string, string?>
        {
            ["Auth:Issuer"] = string.Empty,
            ["Auth:JwtSecret"] = ValidSecret,
        });

        // Act
        var act = () => provider.GetRequiredService<IOptions<AuthOptions>>().Value;

        // Assert
        act.Should().Throw<OptionsValidationException>()
            .WithMessage("*Issuer*");
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
