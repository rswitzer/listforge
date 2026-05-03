using ListForge.Domain.Storage;
using ListForge.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace ListForge.Infrastructure.Storage;

public sealed class LocalFileStorage : IFileStorage
{
    private readonly string _rootFullPath;

    public LocalFileStorage(IOptions<StorageOptions> options)
    {
        _rootFullPath = Path.GetFullPath(options.Value.RootPath);
        Directory.CreateDirectory(_rootFullPath);
    }

    public async Task<string> SaveAsync(string key, Stream content, string contentType, CancellationToken cancellationToken)
    {
        _ = contentType;
        var path = ResolveSafe(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var output = File.Create(path);
        await content.CopyToAsync(output, cancellationToken);
        return key;
    }

    public Task<Stream> OpenReadAsync(string key, CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        var path = ResolveSafe(key);
        Stream stream = File.OpenRead(path);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        var path = ResolveSafe(key);
        if (File.Exists(path))
        {
            File.Delete(path);
        }
        return Task.CompletedTask;
    }

    private string ResolveSafe(string key)
    {
        var combined = Path.GetFullPath(Path.Combine(_rootFullPath, key));
        if (!combined.StartsWith(_rootFullPath + Path.DirectorySeparatorChar, StringComparison.Ordinal)
            && !string.Equals(combined, _rootFullPath, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Storage key resolves outside the configured root.");
        }
        return combined;
    }
}
