using ListForge.Contracts.Hello;
using ListForge.Infrastructure.Configuration;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOptions<AuthOptions>()
    .Bind(builder.Configuration.GetSection(AuthOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<DatabaseOptions>()
    .Bind(builder.Configuration.GetSection(DatabaseOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<FrontendOptions>()
    .Bind(builder.Configuration.GetSection(FrontendOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<ObservabilityOptions>()
    .Bind(builder.Configuration.GetSection(ObservabilityOptions.SectionName));

var frontendOptions = builder.Configuration
    .GetSection(FrontendOptions.SectionName)
    .Get<FrontendOptions>() ?? new FrontendOptions();

const string FrontendCors = "Frontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy => policy
        .WithOrigins(frontendOptions.AllowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors(FrontendCors);

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/hello", () => Results.Ok(new HelloResponse("Hello, ListForge!")));

app.Run();

public partial class Program;
