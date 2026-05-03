using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ListForge.API.Tests.Fixtures;

public sealed class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Production");
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(TestConfiguration.Defaults);
        });
    }
}

internal static class TestConfiguration
{
    public static readonly Dictionary<string, string?> Defaults = new()
    {
        ["Auth:Issuer"] = "ListForge",
        ["Auth:Audience"] = "listforge-api",
        ["Auth:JwtSecret"] = "test-jwt-secret-32-chars-minimum-x",
        ["Database:ConnectionString"] = "Host=localhost;Database=listforge_test;Username=test;Password=test",
        ["Storage:RootPath"] = "./.local-storage-test",
        ["Frontend:AllowedOrigins:0"] = "http://localhost:5173",
    };
}
