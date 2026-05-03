using System.Net;
using FluentAssertions;
using ListForge.API.Tests.Fixtures;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ListForge.API.Tests.Health;

public sealed class HealthCheckEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public HealthCheckEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_HealthDb_WhenPostgresUnreachable_Returns503()
    {
        // Arrange: point at a port that won't accept TCP connections so the
        // connection attempt fails fast without depending on DNS.
        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Database:ConnectionString"] =
                        "Host=127.0.0.1;Port=1;Database=nope;Username=nope;Password=nope;Timeout=2",
                });
            });
        });
        using var client = factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/health/db");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Be("Unhealthy");
    }

    [Fact]
    public async Task Get_Health_AlwaysReturns200_RegardlessOfDbState()
    {
        // The shallow liveness endpoint must not depend on Postgres — it answers
        // "is the process alive?", not "are dependencies ready?".
        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Database:ConnectionString"] =
                        "Host=127.0.0.1;Port=1;Database=nope;Username=nope;Password=nope;Timeout=2",
                });
            });
        });
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
