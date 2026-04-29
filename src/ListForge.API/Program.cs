using ListForge.Contracts.Hello;

var builder = WebApplication.CreateBuilder(args);

const string DevFrontendCors = "DevFrontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(DevFrontendCors, policy => policy
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors(DevFrontendCors);

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/hello", () => Results.Ok(new HelloResponse("Hello, ListForge!")));

app.Run();

public partial class Program;
