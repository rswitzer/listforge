using System.Security.Cryptography;
using System.Text;

namespace ListForge.Infrastructure.Persistence;

/// <summary>
/// Persisted refresh-token record. The raw token never lives in the database —
/// only its SHA-256 hash, so a database leak does not give live tokens.
/// </summary>
public sealed class RefreshToken
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public Guid UserId { get; init; }

    public string TokenHash { get; init; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; init; }

    public DateTimeOffset? RevokedAt { get; set; }

    public bool IsActive(DateTimeOffset now) => RevokedAt is null && ExpiresAt > now;

    public static string Hash(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes);
    }

    public static (string Raw, RefreshToken Entity) Issue(Guid userId, TimeSpan lifetime)
    {
        var raw = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var entity = new RefreshToken
        {
            UserId = userId,
            TokenHash = Hash(raw),
            ExpiresAt = DateTimeOffset.UtcNow.Add(lifetime),
        };
        return (raw, entity);
    }
}
