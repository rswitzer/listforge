using System.ComponentModel.DataAnnotations;

namespace ListForge.Infrastructure.Configuration;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>
    /// Filesystem root for <c>LocalFileStorage</c>. Relative paths resolve
    /// against the current working directory. Cloud-backed implementations
    /// will replace this with bucket-aware configuration.
    /// </summary>
    [Required]
    public string RootPath { get; set; } = string.Empty;
}
