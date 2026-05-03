using Microsoft.AspNetCore.Identity;

namespace ListForge.Infrastructure.Persistence;

/// <summary>Identity user for ListForge. Extended later as the user profile grows.</summary>
public sealed class ApplicationUser : IdentityUser<Guid>
{
}
