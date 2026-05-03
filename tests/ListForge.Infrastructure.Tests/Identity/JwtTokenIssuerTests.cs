using System.Security.Claims;
using System.Text;
using FluentAssertions;
using ListForge.Infrastructure.Configuration;
using ListForge.Infrastructure.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace ListForge.Infrastructure.Tests.Identity;

public sealed class JwtTokenIssuerTests
{
    private const string Secret = "test-jwt-secret-32-chars-minimum-x";

    [Fact]
    public void IssueAccessToken_ReturnsTokenWithExpectedClaims()
    {
        // Arrange
        var sut = new JwtTokenIssuer(BuildOptions());
        var userId = Guid.NewGuid();

        // Act
        var (token, expiresAt) = sut.IssueAccessToken(userId, "user@example.com");

        // Assert
        token.Should().NotBeNullOrWhiteSpace();
        expiresAt.Should().BeAfter(DateTimeOffset.UtcNow);

        var parsed = new JsonWebTokenHandler().ReadJsonWebToken(token);
        parsed.Subject.Should().Be(userId.ToString());
        // HttpContextCurrentUserAccessor reads NameIdentifier — pin the contract
        // so the issuer can't drop the claim without a test failing.
        parsed.GetClaim(ClaimTypes.NameIdentifier).Value.Should().Be(userId.ToString());
        parsed.GetClaim("email").Value.Should().Be("user@example.com");
        parsed.GetClaim(JwtRegisteredClaimNames.Jti).Value.Should().NotBeNullOrWhiteSpace();
        parsed.Issuer.Should().Be("ListForge");
        parsed.Audiences.Should().ContainSingle().Which.Should().Be("listforge-api");
    }

    [Fact]
    public async Task IssueAccessToken_TokenSignedWithDifferentKey_FailsValidation()
    {
        // Arrange — sign with one secret, validate with another. Forgery resistance
        // is the load-bearing property of this issuer.
        var sut = new JwtTokenIssuer(BuildOptions());

        // Act
        var (token, _) = sut.IssueAccessToken(Guid.NewGuid(), "user@example.com");

        // Assert
        var handler = new JsonWebTokenHandler();
        var result = await handler.ValidateTokenAsync(token, new TokenValidationParameters
        {
            ValidIssuer = "ListForge",
            ValidAudience = "listforge-api",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes("a-completely-different-32-char-key")),
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
        });
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task IssueAccessToken_TokenValidatesAgainstConfiguredKey()
    {
        // Arrange
        var sut = new JwtTokenIssuer(BuildOptions());
        var userId = Guid.NewGuid();

        // Act
        var (token, _) = sut.IssueAccessToken(userId, "user@example.com");

        // Assert — re-validate using the same parameters the API will use.
        var handler = new JsonWebTokenHandler();
        var result = await handler.ValidateTokenAsync(token, new TokenValidationParameters
        {
            ValidIssuer = "ListForge",
            ValidAudience = "listforge-api",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret)),
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
        });
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void IssueAccessToken_ExpiresAtMatchesAccessTokenMinutes()
    {
        // Arrange — set lifetime to 60 minutes and check the exp claim.
        var options = new AuthOptions
        {
            Issuer = "ListForge",
            Audience = "listforge-api",
            JwtSecret = Secret,
            AccessTokenMinutes = 60,
        };
        var sut = new JwtTokenIssuer(Options.Create(options));

        // Act
        var (_, expiresAt) = sut.IssueAccessToken(Guid.NewGuid(), "user@example.com");

        // Assert — allow a small skew so this test isn't sensitive to clock jitter.
        var expected = DateTimeOffset.UtcNow.AddMinutes(60);
        expiresAt.Should().BeCloseTo(expected, TimeSpan.FromSeconds(5));
    }

    private static IOptions<AuthOptions> BuildOptions() => Options.Create(new AuthOptions
    {
        Issuer = "ListForge",
        Audience = "listforge-api",
        JwtSecret = Secret,
        AccessTokenMinutes = 15,
    });
}
