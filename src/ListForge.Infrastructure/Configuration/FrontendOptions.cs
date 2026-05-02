using System.ComponentModel.DataAnnotations;

namespace ListForge.Infrastructure.Configuration;

public sealed class FrontendOptions
{
    public const string SectionName = "Frontend";

    [Required]
    [MinLength(1, ErrorMessage = "Frontend:AllowedOrigins must contain at least one origin.")]
    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}
