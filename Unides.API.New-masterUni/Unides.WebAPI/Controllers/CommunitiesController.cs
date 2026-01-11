using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Unides.Domain.Entities;
using Unides.Application.DTOs;
using Unides.Persistence;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Unides.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommunitiesController : ControllerBase
    {
        private readonly UnidesDbContext _context;

        public CommunitiesController(UnidesDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // YARDIMCI METOTLAR
        // ============================================================
        
        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : 0;
        }

        private string GetCurrentUserRoleName()
        {
            // Token içindeki rol ismini okur.
            // Veritabanında: "GSB Görevlisi", "Topluluk Başkanı" şeklinde gelir.
            var claim = User.FindFirst(ClaimTypes.Role);
            return claim != null ? claim.Value : "";
        }

        // ============================================================
        // 1. LİSTELEME & FİLTRELEME
        // ============================================================

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? city, [FromQuery] string? university)
        {
            var query = _context.Communities.AsQueryable();

            if (!string.IsNullOrEmpty(city))
                query = query.Where(c => c.City != null && c.City.ToLower().Contains(city.ToLower()));

            if (!string.IsNullOrEmpty(university))
                query = query.Where(c => c.University != null && c.University.ToLower().Contains(university.ToLower()));

            var list = await query.ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var community = await _context.Communities
                .Include(c => c.Projects)
                .Include(c => c.Events)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (community == null) return NotFound("Topluluk bulunamadı");
            return Ok(community);
        }

        // ============================================================
        // 2. YÖNETİM İŞLEMLERİ
        // ============================================================

        // SADECE GSB TOPLULUK OLUŞTURABİLİR
        [HttpPost]
        [Authorize] 
        public async Task<IActionResult> Create([FromBody] CreateCommunityDto dto)
        {
            string roleName = GetCurrentUserRoleName();

            // DÜZELTME: Veritabanındaki tam isim kullanıldı
            if (roleName != "GSB Görevlisi") 
            {
                return StatusCode(403, $"Bu işlem için GSB yetkilisi olmalısınız. Sizin rolünüz: {roleName}");
            }

            var community = new Community
            {
                Name = dto.Name,
                About = dto.About,
                City = dto.City,
                University = dto.University,
                ContactEmail = dto.ContactEmail,
                CreatedAt = DateTime.UtcNow
            };

            _context.Communities.Add(community);
            await _context.SaveChangesAsync();
            return Ok(community);
        }

        // SADECE GSB SİLEBİLİR
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            string roleName = GetCurrentUserRoleName();

            // DÜZELTME: Veritabanındaki tam isim kullanıldı
            if (roleName != "GSB Görevlisi") 
            {
                return StatusCode(403, "Sadece GSB yetkilileri topluluk silebilir.");
            }

            var community = await _context.Communities.FindAsync(id);
            if (community == null) return NotFound("Topluluk bulunamadı.");

            _context.Communities.Remove(community);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Topluluk başarıyla silindi." });
        }

        // GÜNCELLEME: GSB (Her şey), BAŞKAN (Kısıtlı)
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateCommunity(int id, [FromBody] UpdateCommunityDto dto)
        {
            int userId = GetCurrentUserId();
            string roleName = GetCurrentUserRoleName();

            var community = await _context.Communities.FindAsync(id);
            if (community == null) return NotFound("Topluluk bulunamadı.");

            // SENARYO 1: GSB Görevlisi -> Her şeyi değiştirebilir
            // DÜZELTME: İsim güncellendi
            if (roleName == "GSB Görevlisi")
            {
                if(dto.Name != null) community.Name = dto.Name;
                if(dto.City != null) community.City = dto.City;
                if(dto.University != null) community.University = dto.University;
                
                if(dto.About != null) community.About = dto.About;
                if(dto.LogoUrl != null) community.LogoUrl = dto.LogoUrl;
                if(dto.ContactEmail != null) community.ContactEmail = dto.ContactEmail;
                if(dto.WebsiteUrl != null) community.WebsiteUrl = dto.WebsiteUrl;
                if(dto.SocialLinks != null) community.SocialLinks = dto.SocialLinks;
            }
            // SENARYO 2: Topluluk Başkanı -> Kısıtlı Yetki
            // DÜZELTME: İsim veritabanındaki "Topluluk Başkanı" ile değiştirildi
            else if (roleName == "Topluluk Başkanı" && community.ToplulukBaskani == userId)
            {
                if ((dto.Name != null && dto.Name != community.Name) || 
                    (dto.City != null && dto.City != community.City) ||
                    (dto.University != null && dto.University != community.University))
                {
                    return BadRequest("Başkan olarak Topluluk Adı, Şehir veya Üniversiteyi değiştiremezsiniz.");
                }

                if(dto.About != null) community.About = dto.About;
                if(dto.LogoUrl != null) community.LogoUrl = dto.LogoUrl;
                if(dto.ContactEmail != null) community.ContactEmail = dto.ContactEmail;
                if(dto.WebsiteUrl != null) community.WebsiteUrl = dto.WebsiteUrl;
                if(dto.SocialLinks != null) community.SocialLinks = dto.SocialLinks;
            }
            else
            {
                return StatusCode(403, "Bu işlem için yetkiniz yok.");
            }

            await _context.SaveChangesAsync();
            return Ok(community);
        }

        // PROJE EKLEME (SADECE BAŞKAN)
        [HttpPost("{id}/projects")]
        [Authorize]
        public async Task<IActionResult> AddProject(int id, [FromBody] CreateProjectDto dto)
        {
            int userId = GetCurrentUserId();
            string roleName = GetCurrentUserRoleName();

            var community = await _context.Communities.FindAsync(id);
            if (community == null) return NotFound("Topluluk bulunamadı.");

            // DÜZELTME: İsim güncellendi ("Topluluk Başkanı")
            if (roleName != "Topluluk Başkanı" || community.ToplulukBaskani != userId)
            {
                return StatusCode(403, "Sadece topluluk başkanı proje ekleyebilir.");
            }

            var project = new CommunityProject
            {
                CommunityId = id,
                Title = dto.Title,
                Description = dto.Description,
                Status = dto.Status,
                StartDate = dto.StartDate,
                CreatedAt = DateTime.UtcNow
            };

            _context.CommunityProjects.Add(project);
            await _context.SaveChangesAsync();
            return Ok(project);
        }

        // ============================================================
        // 3. ETKİNLİK KATILIM
        // ============================================================

        [HttpPost("events/{eventId}/join")]
        [Authorize]
        public async Task<IActionResult> JoinEvent(int eventId)
        {
            int userId = GetCurrentUserId();

            var evt = await _context.CommunityEvents.FindAsync(eventId);
            if (evt == null) return NotFound("Etkinlik bulunamadı.");

            var existing = await _context.EventParticipants
                .FirstOrDefaultAsync(ep => ep.EventId == eventId && ep.UserId == userId);

            if (existing != null) return BadRequest("Zaten bu etkinliğe katıldınız.");

            var participant = new EventParticipant
            {
                EventId = eventId,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            };

            _context.EventParticipants.Add(participant);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Etkinliğe başarıyla katıldınız!" });
        }

        [HttpGet("events/{eventId}/participants")]
        [Authorize]
        public async Task<IActionResult> GetParticipants(int eventId)
        {
            int userId = GetCurrentUserId();
            string roleName = GetCurrentUserRoleName();

            var evt = await _context.CommunityEvents
                .Include(e => e.Community)
                .FirstOrDefaultAsync(e => e.Id == eventId);

            if (evt == null) return NotFound("Etkinlik bulunamadı.");

            // DÜZELTME: İsimler güncellendi
            bool isGsb = roleName == "GSB Görevlisi";
            bool isPresident = roleName == "Topluluk Başkanı" && evt.Community?.ToplulukBaskani == userId;

            if (!isGsb && !isPresident)
            {
                return StatusCode(403, "Katılımcı listesini sadece Topluluk Başkanı veya GSB görebilir.");
            }

            var participants = await _context.EventParticipants
                .Where(ep => ep.EventId == eventId)
                .Select(ep => new { ep.UserId, ep.JoinedAt })
                .ToListAsync();

            return Ok(participants);
        }
    }
}