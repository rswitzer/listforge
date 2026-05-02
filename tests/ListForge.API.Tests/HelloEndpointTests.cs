using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ListForge.API.Tests.Fixtures;
using ListForge.Contracts.Hello;

namespace ListForge.API.Tests;

public sealed class HelloEndpointTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public HelloEndpointTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_Hello_Returns200WithExpectedMessage()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/hello");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<HelloResponse>();
        body.Should().NotBeNull();
        body!.Message.Should().Be("Hello, ListForge!");
    }

    [Fact]
    public async Task Get_Health_Returns200()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
