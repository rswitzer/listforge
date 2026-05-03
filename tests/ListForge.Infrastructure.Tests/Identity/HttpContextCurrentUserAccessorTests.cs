using System.Security.Claims;
using FluentAssertions;
using ListForge.Infrastructure.Identity;
using Microsoft.AspNetCore.Http;
using NSubstitute;

namespace ListForge.Infrastructure.Tests.Identity;

public sealed class HttpContextCurrentUserAccessorTests
{
    [Fact]
    public void UserId_NoHttpContext_ReturnsNull()
    {
        // Arrange
        var accessor = Substitute.For<IHttpContextAccessor>();
        accessor.HttpContext.Returns((HttpContext?)null);
        var sut = new HttpContextCurrentUserAccessor(accessor);

        // Act + Assert
        sut.UserId.Should().BeNull();
    }

    [Fact]
    public void UserId_UnauthenticatedUser_ReturnsNull()
    {
        // Arrange
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) };
        var sut = BuildSut(context);

        // Act + Assert
        sut.UserId.Should().BeNull();
    }

    [Fact]
    public void UserId_NameIdentifierMissing_ReturnsNull()
    {
        // Arrange — authenticated but no NameIdentifier claim.
        var identity = new ClaimsIdentity(authenticationType: "Test");
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        var sut = BuildSut(context);

        // Act + Assert
        sut.UserId.Should().BeNull();
    }

    [Fact]
    public void UserId_NameIdentifierIsNotGuid_ReturnsNull()
    {
        // Arrange — guard against malformed tokens.
        var identity = new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, "not-a-guid") },
            authenticationType: "Test");
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        var sut = BuildSut(context);

        // Act + Assert
        sut.UserId.Should().BeNull();
    }

    [Fact]
    public void UserId_AuthenticatedWithGuidClaim_ReturnsGuid()
    {
        // Arrange
        var expected = Guid.NewGuid();
        var identity = new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, expected.ToString()) },
            authenticationType: "Test");
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        var sut = BuildSut(context);

        // Act + Assert
        sut.UserId.Should().Be(expected);
    }

    private static HttpContextCurrentUserAccessor BuildSut(HttpContext context)
    {
        var accessor = Substitute.For<IHttpContextAccessor>();
        accessor.HttpContext.Returns(context);
        return new HttpContextCurrentUserAccessor(accessor);
    }
}
