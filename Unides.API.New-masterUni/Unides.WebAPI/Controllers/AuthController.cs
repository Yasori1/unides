using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Unides.Application.DTOs.Auth;
using Unides.Application.Features.Auth.Commands;
using Microsoft.AspNetCore.Authorization;
using Unides.Application.Interfaces.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using System.Linq;
using Unides.Application.Interfaces.Repositories;

namespace Unides.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ITokenService _tokenService;
        private readonly IErrorLogRepository _errorLogRepository;
        public AuthController(IMediator mediator, ITokenService tokenService, IErrorLogRepository errorLogRepository)
        {
            _mediator = mediator;
            _tokenService = tokenService;
            _errorLogRepository = errorLogRepository;
        }

        private string? GetClientIp()
        {
            var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim();
            if (!string.IsNullOrWhiteSpace(forwarded)) return forwarded;
            return HttpContext.Connection.RemoteIpAddress?.MapToIPv4()?.ToString();
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req)
        {
            try
            {
                // Profesyonel akış: register otomatik giriş yapmaz; sadece hesap oluşturur.
                // İstemci ardından login çağrısı yapar ve tokenları alır.
                var res = await _mediator.Send(new RegisterCommand(req));
                return Ok(res);
            }
            catch (System.Exception ex)
            {
                try
                {
                    await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                    {
                        Action = "Auth.Register",
                        UserId = null,
                        EntityType = "User",
                        EntityId = null,
                        ErrorMessage = ex.Message,
                        IpAddress = GetClientIp(),
                        UserAgent = Request.Headers["User-Agent"].ToString(),
                        CorrelationId = Guid.NewGuid()
                    });
                }
                catch { /* log failure ignored */ }
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                var res = await _mediator.Send(new LoginCommand(req));

                // Set cookies for browser clients
                Response.Cookies.Append("access_token", res.AccessToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = _tokenService.GetAccessTokenExpiry()
                });
                Response.Cookies.Append("refresh_token", res.RefreshToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = _tokenService.GetRefreshTokenExpiry()
                });

                // CSRF token (double submit cookie) - header ile eşleştirilecek
                var csrf = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
                Response.Cookies.Append("XSRF-TOKEN", csrf, new CookieOptions
                {
                    HttpOnly = false,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTime.UtcNow.AddHours(12)
                });

                return Ok(res);
            }
            catch (System.Exception ex)
            {
                try
                {
                    await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                    {
                        Action = "Auth.Login",
                        UserId = null,
                        EntityType = "User",
                        EntityId = null,
                        ErrorMessage = ex.Message,
                        IpAddress = GetClientIp(),
                        UserAgent = Request.Headers["User-Agent"].ToString(),
                        CorrelationId = Guid.NewGuid()
                    });
                }
                catch { /* log failure ignored */ }
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
        {
            try
            {
                // Body boş ise cookie'den refresh token oku
                var tokenFromCookie = Request.Cookies["refresh_token"];
                if (string.IsNullOrWhiteSpace(req?.RefreshToken) && !string.IsNullOrWhiteSpace(tokenFromCookie))
                {
                    req = new RefreshRequest { RefreshToken = tokenFromCookie };
                }
                if (req == null || string.IsNullOrWhiteSpace(req.RefreshToken))
                    return BadRequest(new { message = "Refresh token bulunamadı." });

                var res = await _mediator.Send(new RefreshTokenCommand(req));

                // Yeni access ve refresh token'ları cookie olarak set et (rotasyon)
                Response.Cookies.Append("access_token", res.AccessToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = _tokenService.GetAccessTokenExpiry()
                });
                Response.Cookies.Append("refresh_token", res.RefreshToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = _tokenService.GetRefreshTokenExpiry()
                });

                // CSRF token'ı da yenile
                var csrf = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
                Response.Cookies.Append("XSRF-TOKEN", csrf, new CookieOptions
                {
                    HttpOnly = false,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTime.UtcNow.AddHours(12)
                });

                return Ok(res);
            }
            catch (System.Exception ex)
            {
                try
                {
                    await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                    {
                        Action = "Auth.Refresh",
                        UserId = null,
                        EntityType = "User",
                        EntityId = null,
                        ErrorMessage = ex.Message,
                        IpAddress = GetClientIp(),
                        UserAgent = Request.Headers["User-Agent"].ToString(),
                        CorrelationId = Guid.NewGuid()
                    });
                }
                catch { /* log failure ignored */ }
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            int? userId = null;
            string refreshToken = string.Empty;
            try
            {
                // Cookie'den refresh token oku
                refreshToken = Request.Cookies["refresh_token"] ?? string.Empty;
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                userId = int.TryParse(userIdClaim, out var id) ? id : null;

                // Logout command gönder
                await _mediator.Send(new LogoutCommand(refreshToken, userId));

                // Cookie'leri temizle
                Response.Cookies.Delete("access_token");
                Response.Cookies.Delete("refresh_token");
                Response.Cookies.Delete("XSRF-TOKEN");

                return Ok(new { message = "Başarıyla çıkış yapıldı." });
            }
            catch (System.Exception ex)
            {
                try
                {
                    await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                    {
                        Action = "Auth.Logout",
                        UserId = userId,
                        EntityType = "User",
                        EntityId = userId,
                        ErrorMessage = ex.Message,
                        IpAddress = GetClientIp(),
                        UserAgent = Request.Headers["User-Agent"].ToString(),
                        CorrelationId = Guid.NewGuid()
                    });
                }
                catch { /* log failure ignored */ }
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpPost("change-password")]
        [Authorize] // Sadece giriş yapmış kişiler şifre değiştirebilir
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            try
            {
                // MediatR üzerinden komutu gönderiyoruz
                var result = await _mediator.Send(new ChangePasswordCommand(req));
                return Ok(new { message = "Şifreniz başarıyla değiştirildi." });
            }
            catch (System.Exception ex)
            {
                try
                {
                    await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                    {
                        Action = "Auth.ChangePassword",
                        UserId = null,
                        EntityType = "User",
                        EntityId = null,
                        ErrorMessage = ex.Message,
                        IpAddress = GetClientIp(),
                        UserAgent = Request.Headers["User-Agent"].ToString(),
                        CorrelationId = Guid.NewGuid()
                    });
                }
                catch { /* log failure ignored */ }
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}