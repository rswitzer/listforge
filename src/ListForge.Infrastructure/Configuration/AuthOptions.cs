using System.ComponentModel.DataAnnotations;

namespace ListForge.Infrastructure.Configuration;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    [Required]
    [Url]
    public string SupabaseUrl { get; set; } = string.Empty;

    [Required]
    public string JwtSecret { get; set; } = string.Empty;

    [Required]
    public string Audience { get; set; } = "authenticated";
}
