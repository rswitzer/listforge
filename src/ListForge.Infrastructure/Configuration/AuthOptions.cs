using System.ComponentModel.DataAnnotations;

namespace ListForge.Infrastructure.Configuration;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    [Required]
    public string Issuer { get; set; } = "ListForge";

    [Required]
    public string Audience { get; set; } = "listforge-api";

    [Required]
    [MinLength(32, ErrorMessage = "Auth:JwtSecret must be at least 32 characters (HMAC-SHA256 key length).")]
    public string JwtSecret { get; set; } = string.Empty;

    /// <summary>Access-token lifetime in minutes. Defaults to 15.</summary>
    [Range(1, 1440)]
    public int AccessTokenMinutes { get; set; } = 15;

    /// <summary>Refresh-token lifetime in days. Defaults to 14.</summary>
    [Range(1, 365)]
    public int RefreshTokenDays { get; set; } = 14;
}
