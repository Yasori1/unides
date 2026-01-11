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

namespace Unides.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnnouncementsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IErrorLogRepository _errorLogRepository;
        public AnnouncementsController(IMediator mediator, IErrorLogRepository errorLogRepository)
        {
            _mediator = mediator;
            _errorLogRepository = errorLogRepository;
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
            return int.TryParse(roleIdClaim, out var roleId) ? roleId : 0;
        }

        private bool IsAdmin()
        {
            // roleId = 2 (Corporate/GSB Personeli) admin yetkisine sahiptir
            return GetUserRoleId() == 2;
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
        [Authorize]
        public async Task<ActionResult<int>> Create([FromBody] CreateAnnouncementCommand cmd)
        {
            if (!IsAdmin()) return Unauthorized(new { message = "Bu işlem için yetkiniz bulunmamaktadır." });
            if (string.IsNullOrWhiteSpace(cmd.Title)) return BadRequest("Title gereklidir.");
            var userId = GetUserId();
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
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateAnnouncementCommand cmd)
        {
            if (!IsAdmin()) return Unauthorized(new { message = "Bu işlem için yetkiniz bulunmamaktadır." });
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
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            if (!IsAdmin()) return Unauthorized(new { message = "Bu işlem için yetkiniz bulunmamaktadır." });
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
    }
}


