namespace ListForge.Domain.Identity;

/// <summary>
/// Issues signed access tokens for authenticated users. Implementations
/// are responsible for signing key management and claim shape.
/// </summary>
public interface IJwtTokenIssuer
{
    /// <summary>Issue a signed access token for the given user.</summary>
    /// <returns>The serialized JWT and its expiration timestamp.</returns>
    (string Token, DateTimeOffset ExpiresAt) IssueAccessToken(Guid userId, string email);
}
