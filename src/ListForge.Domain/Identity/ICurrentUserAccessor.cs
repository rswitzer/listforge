namespace ListForge.Domain.Identity;

/// <summary>
/// Resolves the authenticated user for the current request without leaking
/// provider-specific token shapes into Application/Domain code.
/// </summary>
public interface ICurrentUserAccessor
{
    /// <summary>The authenticated user's ID, or <c>null</c> for anonymous requests.</summary>
    Guid? UserId { get; }
}
