namespace ListForge.Domain.Storage;

/// <summary>
/// Storage abstraction used by application services for draft images and other
/// user uploads. Implementations live in Infrastructure (local filesystem in
/// dev; cloud object storage in prod).
/// </summary>
public interface IFileStorage
{
    /// <summary>Persist <paramref name="content"/> at <paramref name="key"/>.</summary>
    /// <returns>The opaque storage handle (typically the same key).</returns>
    Task<string> SaveAsync(string key, Stream content, string contentType, CancellationToken cancellationToken);

    /// <summary>Open a read stream for the given key. Caller disposes.</summary>
    Task<Stream> OpenReadAsync(string key, CancellationToken cancellationToken);

    /// <summary>Delete the object at the given key. No-op when absent.</summary>
    Task DeleteAsync(string key, CancellationToken cancellationToken);
}
