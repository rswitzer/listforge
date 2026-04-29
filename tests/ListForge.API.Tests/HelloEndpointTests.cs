using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ListForge.Contracts.Hello;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ListForge.API.Tests;

public sealed class HelloEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public HelloEndpointTests(WebApplicationFactory<Program> factory)
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
