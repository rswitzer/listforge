namespace ListForge.Infrastructure.Configuration;

public sealed class ObservabilityOptions
{
    public const string SectionName = "Observability";

    public string ApplicationName { get; set; } = "ListForge.API";

    public string MinimumLogLevel { get; set; } = "Information";
}
