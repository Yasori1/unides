using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Unides.Application.DTOs.Announcements;
using Unides.Application.Features.Announcements.Commands;
using Unides.Application.Features.Announcements.Queries;
using Unides.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace Unides.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnnouncementsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IErrorLogRepository _errorLogRepository;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        
        public AnnouncementsController(
            IMediator mediator, 
            IErrorLogRepository errorLogRepository,
            IConfiguration configuration,
            IWebHostEnvironment environment)
        {
            _mediator = mediator;
            _errorLogRepository = errorLogRepository;
            _configuration = configuration;
            _environment = environment;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst("id")?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value;
            return int.TryParse(userIdClaim, out var userId) ? userId : 0;
        }

        private int GetUserRoleId()
        {
            var roleIdClaim = User.FindFirst("roleId")?.Value;
            if (string.IsNullOrEmpty(roleIdClaim))
            {
                // Debug: Tüm claim'leri logla
                var allClaims = User.Claims.Select(c => $"{c.Type}={c.Value}").ToList();
                System.Diagnostics.Debug.WriteLine($"⚠️ roleId claim bulunamadı! Tüm claim'ler: {string.Join(", ", allClaims)}");
            }
            return int.TryParse(roleIdClaim, out var roleId) ? roleId : 0;
        }

        private bool IsAdmin()
        {
            // roleId = 2 (Corporate/GSB Personeli) admin yetkisine sahiptir
            var roleId = GetUserRoleId();
            System.Diagnostics.Debug.WriteLine($"🔍 IsAdmin kontrolü: roleId={roleId}, IsAdmin={roleId == 2}");
            return roleId == 2;
        }

        private string? GetClientIp()
        {
            var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim();
            if (!string.IsNullOrWhiteSpace(forwarded)) return forwarded;
            return HttpContext.Connection.RemoteIpAddress?.MapToIPv4()?.ToString();
        }

        // Public - list
        [HttpGet("list")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<AnnouncementListItemDto>>> GetAll()
        {
            var res = await _mediator.Send(new GetAnnouncementsQuery());
            return Ok(res);
        }

        // Public - detail
        [HttpGet("detail/{id:int}")]
        [AllowAnonymous]
        public async Task<ActionResult<AnnouncementDetailDto>> GetDetail(int id)
        {
            try
            {
                var res = await _mediator.Send(new GetAnnouncementDetailQuery(id));
                return Ok(res);
            }
            catch (Exception ex)
            {
                int? userId = null;
                var claimVal = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("id")?.Value;
                if (int.TryParse(claimVal, out var uid)) userId = uid;

                await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                {
                    Action = "Announcement.Detail",
                    UserId = userId,
                    EntityType = "Announcement",
                    EntityId = id,
                    ErrorMessage = ex.Message,
                    IpAddress = GetClientIp(),
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    CorrelationId = Guid.NewGuid()
                });
                return NotFound(new { message = ex.Message });
            }
        }

        // Admin (role=gsb) - create
        [HttpPost("create")]
        [Authorize] // JWT token validation için
        public async Task<ActionResult<int>> Create([FromBody] CreateAnnouncementCommand cmd)
        {
            
            // Önce kullanıcının giriş yapıp yapmadığını kontrol et
            var userId = GetUserId();
            if (userId == 0)
            {
                return Unauthorized(new { message = "Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın." });
            }
            
            // Admin kontrolü
            if (!IsAdmin())
            {
                var roleId = GetUserRoleId();
                return Unauthorized(new { message = "Bu işlem için yetkiniz bulunmamaktadır.", roleId = roleId, userId = userId });
            }
            
            if (string.IsNullOrWhiteSpace(cmd.Title)) return BadRequest("Title gereklidir.");
            cmd.AnnCreatedAtUserId = userId;
            cmd.AnnUpdatedAtUserId = userId;
            try
            {
                var id = await _mediator.Send(cmd);
                return Ok(id);
            }
            catch (Exception ex)
            {
                await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                {
                    Action = "Announcement.Create",
                    UserId = userId,
                    EntityType = "Announcement",
                    EntityId = null,
                    ErrorMessage = ex.Message,
                    IpAddress = GetClientIp(),
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    CorrelationId = Guid.NewGuid()
                });
                return BadRequest(new { message = ex.Message });
            }
        }

        // Admin (role=gsb) - update
        [HttpPut("update/{id:int}")]
        [Authorize] // JWT token validation için - Bu attribute token'ı validate eder ve User.Claims'i doldurur
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAnnouncementCommand cmd)
        {
            // Önce kullanıcının giriş yapıp yapmadığını kontrol et
            var userId = GetUserId();
            var roleId = GetUserRoleId();
            
            // Debug: Tüm claim'leri logla
            var allClaims = User.Claims.Select(c => $"{c.Type}={c.Value}").ToList();
            System.Diagnostics.Debug.WriteLine($"🔍 Update çağrıldı: userId={userId}, roleId={roleId}, Claims: {string.Join(", ", allClaims)}");
            
            if (userId == 0)
            {
                return Unauthorized(new { message = "Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.", claims = allClaims });
            }
            
            // Admin kontrolü
            if (!IsAdmin())
            {
                return Unauthorized(new { message = "Bu işlem için yetkiniz bulunmamaktadır.", roleId = roleId, userId = userId, claims = allClaims });
            }
            if (string.IsNullOrWhiteSpace(cmd.Title)) return BadRequest("Title gereklidir.");
            
            // URL'deki id'yi kullan, body'deki annId'yi ignore et (güvenlik için)
            // URL'deki id her zaman önceliklidir
            cmd.AnnId = id;
            cmd.AnnUpdatedAtUserId = GetUserId();
            try
            {
                await _mediator.Send(cmd);
                return NoContent();
            }
            catch (Exception ex)
            {
                await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                {
                    Action = "Announcement.Update",
                    UserId = cmd.AnnUpdatedAtUserId,
                    EntityType = "Announcement",
                    EntityId = id,
                    ErrorMessage = ex.Message,
                    IpAddress = GetClientIp(),
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    CorrelationId = Guid.NewGuid()
                });
                return BadRequest(new { message = ex.Message });
            }
        }

        // Admin (role=gsb) - delete
        [HttpDelete("delete/{id:int}")]
        [Authorize] // JWT token validation için
        public async Task<IActionResult> Delete(int id)
        {
            
            // Önce kullanıcının giriş yapıp yapmadığını kontrol et
            var userId = GetUserId();
            if (userId == 0)
            {
                return Unauthorized(new { message = "Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın." });
            }
            
            // Admin kontrolü
            if (!IsAdmin())
            {
                var roleId = GetUserRoleId();
                return Unauthorized(new { message = "Bu işlem için yetkiniz bulunmamaktadır.", roleId = roleId, userId = userId });
            }
            try
            {
                await _mediator.Send(new DeleteAnnouncementCommand(id));
                return NoContent();
            }
            catch (Exception ex)
            {
                await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                {
                    Action = "Announcement.Delete",
                    UserId = GetUserId(),
                    EntityType = "Announcement",
                    EntityId = id,
                    ErrorMessage = ex.Message,
                    IpAddress = GetClientIp(),
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    CorrelationId = Guid.NewGuid()
                });
                return BadRequest(new { message = ex.Message });
            }
        }

        // Admin (role=gsb) - upload image
        [HttpPost("upload-image")]
        [Authorize] // JWT token validation için
        public async Task<ActionResult<string>> UploadImage(IFormFile file)
        {
            // Önce kullanıcının giriş yapıp yapmadığını kontrol et
            var userId = GetUserId();
            if (userId == 0)
            {
                return Unauthorized(new { message = "Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın." });
            }
            
            // Admin kontrolü
            if (!IsAdmin())
            {
                var roleId = GetUserRoleId();
                return Unauthorized(new { message = "Bu işlem için yetkiniz bulunmamaktadır.", roleId = roleId, userId = userId });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Dosya seçilmedi veya dosya boş." });
            }

            // İzin verilen dosya tipleri
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return BadRequest(new { message = "Geçersiz dosya formatı. Sadece JPG, PNG, GIF ve WEBP formatları desteklenir." });
            }

            // Dosya boyutu kontrolü (5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "Dosya boyutu 5MB'dan büyük olamaz." });
            }

            try
            {
                // Image path yapılandırması
                var basePath = _configuration["ImageSettings:BasePath"] ?? "images";
                var announcementsFolder = _configuration["ImageSettings:AnnouncementsFolder"] ?? "Duyurular";
                var baseUrl = _configuration["ImageSettings:BaseUrl"] ?? "https://localhost:7069/images";

                // Klasör yolu oluştur - relative path ise ContentRootPath'e göre ayarla
                string folderPath;
                if (Path.IsPathRooted(basePath))
                {
                    // Absolute path (production: /root/images)
                    folderPath = Path.Combine(basePath, announcementsFolder);
                }
                else
                {
                    // Relative path (development: images)
                    folderPath = Path.Combine(_environment.ContentRootPath, basePath, announcementsFolder);
                }
                
                // Eğer klasör yoksa oluştur
                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                // Benzersiz dosya adı oluştur
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(folderPath, fileName);

                // Dosyayı kaydet
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // URL döndür (klasör adı ile birlikte)
                var imageUrl = $"{baseUrl}/{announcementsFolder}/{fileName}";
                return Ok(new { imageUrl = imageUrl });
            }
            catch (Exception ex)
            {
                await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                {
                    Action = "Announcement.UploadImage",
                    UserId = userId,
                    EntityType = "Announcement",
                    EntityId = null,
                    ErrorMessage = ex.Message,
                    IpAddress = GetClientIp(),
                    UserAgent = Request.Headers["User-Agent"].ToString(),
                    CorrelationId = Guid.NewGuid()
                });
                return StatusCode(500, new { message = "Dosya yüklenirken bir hata oluştu.", error = ex.Message });
            }
        }
    }
}


