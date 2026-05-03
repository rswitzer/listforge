using Testcontainers.PostgreSql;

namespace ListForge.API.Tests.Controllers;

/// <summary>
/// Spins up a real Postgres via Testcontainers for endpoint integration tests.
/// If the Docker daemon is unavailable (e.g., a devcontainer without Docker
/// access), tests gate themselves on <see cref="IsAvailable"/> via Skip.IfNot.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private PostgreSqlContainer? _container;

    public string? ConnectionString { get; private set; }

    public bool IsAvailable => ConnectionString is not null;

    public async Task InitializeAsync()
    {
        try
        {
            _container = new PostgreSqlBuilder()
                .WithImage("postgres:16-alpine")
                .WithDatabase("listforge_test")
                .WithUsername("listforge")
                .WithPassword("listforge")
                .Build();

            await _container.StartAsync();
            ConnectionString = _container.GetConnectionString();
        }
        catch
        {
            ConnectionString = null;
        }
    }

    public async Task DisposeAsync()
    {
        if (_container is not null)
        {
            await _container.DisposeAsync();
        }
    }
}
