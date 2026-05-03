using FluentAssertions;
using ListForge.Infrastructure.Persistence;

namespace ListForge.Infrastructure.Tests.Persistence;

public sealed class RefreshTokenTests
{
    [Fact]
    public void Hash_SameInput_ReturnsSameHash()
    {
        // Arrange + Act
        var a = RefreshToken.Hash("token-value");
        var b = RefreshToken.Hash("token-value");

        // Assert
        a.Should().Be(b);
    }

    [Fact]
    public void Hash_DifferentInput_ReturnsDifferentHash()
    {
        RefreshToken.Hash("token-a").Should().NotBe(RefreshToken.Hash("token-b"));
    }

    [Fact]
    public void Hash_DoesNotEqualPlainText()
    {
        // Stored hash must not be the raw token; this is the whole point.
        RefreshToken.Hash("token-value").Should().NotBe("token-value");
    }

    [Fact]
    public void Issue_ReturnsRawTokenAndMatchingHashedEntity()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var (raw, entity) = RefreshToken.Issue(userId, TimeSpan.FromDays(14));

        // Assert
        raw.Should().NotBeNullOrWhiteSpace();
        entity.UserId.Should().Be(userId);
        entity.TokenHash.Should().Be(RefreshToken.Hash(raw));
        entity.RevokedAt.Should().BeNull();
        entity.ExpiresAt.Should().BeCloseTo(DateTimeOffset.UtcNow.AddDays(14), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Issue_ProducesUniqueRawTokensAcrossCalls()
    {
        // Arrange + Act
        var (rawA, _) = RefreshToken.Issue(Guid.NewGuid(), TimeSpan.FromDays(14));
        var (rawB, _) = RefreshToken.Issue(Guid.NewGuid(), TimeSpan.FromDays(14));

        // Assert
        rawA.Should().NotBe(rawB);
    }

    [Fact]
    public void IsActive_NotRevokedAndNotExpired_ReturnsTrue()
    {
        var entity = new RefreshToken
        {
            UserId = Guid.NewGuid(),
            TokenHash = "h",
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5),
        };

        entity.IsActive(DateTimeOffset.UtcNow).Should().BeTrue();
    }

    [Fact]
    public void IsActive_Revoked_ReturnsFalse()
    {
        var entity = new RefreshToken
        {
            UserId = Guid.NewGuid(),
            TokenHash = "h",
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5),
            RevokedAt = DateTimeOffset.UtcNow,
        };

        entity.IsActive(DateTimeOffset.UtcNow).Should().BeFalse();
    }

    [Fact]
    public void IsActive_Expired_ReturnsFalse()
    {
        var entity = new RefreshToken
        {
            UserId = Guid.NewGuid(),
            TokenHash = "h",
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1),
        };

        entity.IsActive(DateTimeOffset.UtcNow).Should().BeFalse();
    }
}
