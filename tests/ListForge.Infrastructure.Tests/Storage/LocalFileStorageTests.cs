using System.Text;
using FluentAssertions;
using ListForge.Infrastructure.Configuration;
using ListForge.Infrastructure.Storage;
using Microsoft.Extensions.Options;

namespace ListForge.Infrastructure.Tests.Storage;

public sealed class LocalFileStorageTests : IDisposable
{
    private readonly string _root = Path.Combine(
        Path.GetTempPath(),
        "listforge-test-" + Guid.NewGuid().ToString("N"));

    public void Dispose()
    {
        if (Directory.Exists(_root))
        {
            Directory.Delete(_root, recursive: true);
        }
    }

    [Fact]
    public async Task SaveAsync_WritesContentUnderRootPath()
    {
        // Arrange
        var sut = BuildSut();
        var key = "drafts/abc/photo-1.jpg";
        await using var content = new MemoryStream(Encoding.UTF8.GetBytes("hello"));

        // Act
        var handle = await sut.SaveAsync(key, content, "image/jpeg", CancellationToken.None);

        // Assert
        handle.Should().Be(key);
        var path = Path.Combine(_root, key);
        File.Exists(path).Should().BeTrue();
        (await File.ReadAllTextAsync(path)).Should().Be("hello");
    }

    [Fact]
    public async Task OpenReadAsync_ReturnsContentWritten()
    {
        // Arrange
        var sut = BuildSut();
        var key = "drafts/xyz/note.txt";
        await using (var write = new MemoryStream(Encoding.UTF8.GetBytes("payload")))
        {
            await sut.SaveAsync(key, write, "text/plain", CancellationToken.None);
        }

        // Act
        await using var read = await sut.OpenReadAsync(key, CancellationToken.None);
        using var reader = new StreamReader(read);
        var roundTripped = await reader.ReadToEndAsync();

        // Assert
        roundTripped.Should().Be("payload");
    }

    [Fact]
    public async Task DeleteAsync_RemovesExistingFile()
    {
        // Arrange
        var sut = BuildSut();
        var key = "drafts/delete-me.bin";
        await using (var write = new MemoryStream(new byte[] { 1, 2, 3 }))
        {
            await sut.SaveAsync(key, write, "application/octet-stream", CancellationToken.None);
        }
        File.Exists(Path.Combine(_root, key)).Should().BeTrue();

        // Act
        await sut.DeleteAsync(key, CancellationToken.None);

        // Assert
        File.Exists(Path.Combine(_root, key)).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_MissingFile_DoesNotThrow()
    {
        // Arrange
        var sut = BuildSut();

        // Act
        var act = async () => await sut.DeleteAsync("not-here.bin", CancellationToken.None);

        // Assert
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task OpenReadAsync_MissingKey_ThrowsFileNotFound()
    {
        // Arrange
        var sut = BuildSut();

        // Act
        var act = async () => await sut.OpenReadAsync("never-written.bin", CancellationToken.None);

        // Assert — pin the contract; future implementations that swallow this
        // would silently break draft-image retrieval flows.
        await act.Should().ThrowAsync<FileNotFoundException>();
    }

    [Fact]
    public async Task SaveAsync_OverwriteExisting_StoresLatestContent()
    {
        // Arrange — same key written twice; second write must win.
        var sut = BuildSut();
        var key = "drafts/overwrite/photo.jpg";

        await using (var first = new MemoryStream(Encoding.UTF8.GetBytes("v1")))
        {
            await sut.SaveAsync(key, first, "image/jpeg", CancellationToken.None);
        }

        // Act
        await using (var second = new MemoryStream(Encoding.UTF8.GetBytes("v2")))
        {
            await sut.SaveAsync(key, second, "image/jpeg", CancellationToken.None);
        }

        // Assert
        await using var read = await sut.OpenReadAsync(key, CancellationToken.None);
        using var reader = new StreamReader(read);
        (await reader.ReadToEndAsync()).Should().Be("v2");
    }

    [Fact]
    public async Task SaveAsync_RejectsKeysThatEscapeRoot()
    {
        // Arrange
        var sut = BuildSut();
        await using var content = new MemoryStream(Encoding.UTF8.GetBytes("nope"));

        // Act
        var act = async () => await sut.SaveAsync("../../etc/passwd", content, "text/plain", CancellationToken.None);

        // Assert — guard against path traversal so user-supplied keys can't write outside root.
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    private LocalFileStorage BuildSut()
    {
        var options = Options.Create(new StorageOptions { RootPath = _root });
        return new LocalFileStorage(options);
    }
}
