using ListForge.Contracts.Auth;
using ListForge.Domain.Identity;
using ListForge.Infrastructure.Configuration;
using ListForge.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ListForge.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ListForgeDbContext _db;
    private readonly IJwtTokenIssuer _tokenIssuer;
    private readonly AuthOptions _authOptions;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        ListForgeDbContext db,
        IJwtTokenIssuer tokenIssuer,
        IOptions<AuthOptions> authOptions)
    {
        _userManager = userManager;
        _db = db;
        _tokenIssuer = tokenIssuer;
        _authOptions = authOptions.Value;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return UnprocessableEntity();
        }

        var user = new ApplicationUser { Email = request.Email, UserName = request.Email };
        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Code is "DuplicateUserName" or "DuplicateEmail"))
            {
                return Conflict();
            }
            return UnprocessableEntity(new { errors = result.Errors.Select(e => e.Description) });
        }

        var tokens = await IssueTokensAsync(user, cancellationToken);
        return Created((string?)null, tokens);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Unauthorized();
        }

        var ok = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!ok)
        {
            return Unauthorized();
        }

        var tokens = await IssueTokensAsync(user, cancellationToken);
        return Ok(tokens);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return Unauthorized();
        }

        var hash = RefreshToken.Hash(request.RefreshToken);
        var stored = await _db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash, cancellationToken);
        if (stored is null || !stored.IsActive(DateTimeOffset.UtcNow))
        {
            return Unauthorized();
        }

        stored.RevokedAt = DateTimeOffset.UtcNow;

        var user = await _userManager.FindByIdAsync(stored.UserId.ToString());
        if (user is null)
        {
            await _db.SaveChangesAsync(cancellationToken);
            return Unauthorized();
        }

        var tokens = await IssueTokensAsync(user, cancellationToken);
        return Ok(tokens);
    }

    private async Task<AuthTokensResponse> IssueTokensAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var (accessToken, accessExpiresAt) = _tokenIssuer.IssueAccessToken(user.Id, user.Email!);
        var (rawRefresh, refreshEntity) = RefreshToken.Issue(
            user.Id,
            TimeSpan.FromDays(_authOptions.RefreshTokenDays));
        _db.RefreshTokens.Add(refreshEntity);
        await _db.SaveChangesAsync(cancellationToken);
        return new AuthTokensResponse(
            accessToken,
            accessExpiresAt,
            rawRefresh,
            refreshEntity.ExpiresAt);
    }
}
