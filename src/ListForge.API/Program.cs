using ListForge.Infrastructure.Configuration;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOptions<DatabaseOptions>()
    .Bind(builder.Configuration.GetSection(DatabaseOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

string[] dbHealthTags = ["db"];
builder.Services.AddHealthChecks()
    .AddNpgSql(
        sp => sp.GetRequiredService<IOptions<DatabaseOptions>>().Value.ConnectionString,
        name: "postgres",
        tags: dbHealthTags);

const string FrontendCors = "Frontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCors, policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors(FrontendCors);

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapHealthChecks("/api/health/db", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("db"),
});

app.Run();

public partial class Program;
