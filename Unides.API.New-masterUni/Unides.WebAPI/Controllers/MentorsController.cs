using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Features.Mentorship.Commands.Admin;
using Unides.Application.Features.Mentorship.Commands.Mentors;
using Unides.Application.Features.Mentorship.Queries.Admin;
using Unides.Application.Features.Mentorship.Queries.Mentors;

namespace Unides.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MentorsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public MentorsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        #region Helper Methods

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

        #endregion

        #region Öğrenci Endpoints (Mentör Başvurusu)

        /// <summary>
        /// Öğrenci (role_id = 1) mentör olmak için başvuru yapar
        /// </summary>
        [HttpPost("apply")]
        [Authorize]
        public async Task<ActionResult> ApplyAsMentor([FromBody] CreateMentorApplicationDto dto)
        {
            var command = new CreateMentorCommand
            {
                UserId = GetUserId(),
                UserRoleId = GetUserRoleId(),
                FullName = dto.FullName,
                PreferredCity = dto.PreferredCity,
                ExpertiseAreas = dto.ExpertiseAreas,
                Experience = dto.Experience,
                ContactEmail = dto.ContactEmail,
                ContactPhone = dto.ContactPhone
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { mentorId = result.MentorId, message = "Mentör başvurunuz başarıyla alındı." });
        }

        /// <summary>
        /// Kullanıcı kendi mentör başvurusunu görüntüler
        /// </summary>
        [HttpGet("my-application")]
        [Authorize]
        public async Task<ActionResult<MyMentorApplicationDto>> GetMyApplication()
        {
            var query = new GetMyMentorApplicationQuery
            {
                UserId = GetUserId()
            };

            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound(new { message = "Mentör başvurunuz bulunamadı." });

            return Ok(result);
        }

        /// <summary>
        /// Kullanıcı kendi mentör başvurusunu günceller (sadece pending durumunda)
        /// </summary>
        [HttpPut("my-application")]
        [Authorize]
        public async Task<ActionResult> UpdateMyApplication([FromBody] UpdateMentorApplicationDto dto)
        {
            // Önce mevcut başvuruyu al
            var myApplication = await _mediator.Send(new GetMyMentorApplicationQuery { UserId = GetUserId() });
            if (myApplication == null)
                return NotFound(new { message = "Mentör başvurunuz bulunamadı." });

            var command = new UpdateMentorCommand
            {
                MentorId = myApplication.MentorId,
                UserId = GetUserId(),
                FullName = dto.FullName,
                PreferredCity = dto.PreferredCity,
                ExpertiseAreas = dto.ExpertiseAreas,
                Experience = dto.Experience,
                ContactEmail = dto.ContactEmail,
                ContactPhone = dto.ContactPhone
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Başvurunuz başarıyla güncellendi." });
        }

        /// <summary>
        /// Kullanıcı kendi mentör başvurusunu siler (soft delete)
        /// </summary>
        [HttpDelete("my-application")]
        [Authorize]
        public async Task<ActionResult> DeleteMyApplication()
        {
            // Önce mevcut başvuruyu al
            var myApplication = await _mediator.Send(new GetMyMentorApplicationQuery { UserId = GetUserId() });
            if (myApplication == null)
                return NotFound(new { message = "Mentör başvurunuz bulunamadı." });

            var command = new DeleteMentorCommand
            {
                MentorId = myApplication.MentorId,
                UserId = GetUserId()
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Başvurunuz başarıyla silindi." });
        }

        #endregion

        #region Admin (GSB) Endpoints

        /// <summary>
        /// Admin tüm mentör başvurularını listeler
        /// </summary>
        [HttpGet("admin/list")]
        [Authorize(Roles = "gsb,GSB Görevlisi")]
        public async Task<ActionResult<IEnumerable<MentorListItemDto>>> GetAllMentors([FromQuery] string? status)
        {
            var query = new GetAllMentorsQuery
            {
                AdminRoleId = GetUserRoleId(),
                StatusFilter = status
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        /// <summary>
        /// Admin mentör başvurusunu onaylar veya reddeder
        /// </summary>
        [HttpPost("admin/decide/{mentorId}")]
        [Authorize(Roles = "gsb,GSB Görevlisi")]
        public async Task<ActionResult> DecideMentorApplication(int mentorId, [FromBody] AdminDecisionDto dto)
        {
            var command = new AdminDecideMentorCommand
            {
                MentorId = mentorId,
                AdminId = GetUserId(),
                AdminRoleId = GetUserRoleId(),
                Decision = dto.Decision,
                DecisionNote = dto.DecisionNote
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = $"Başvuru başarıyla {dto.Decision} olarak işaretlendi." });
        }

        /// <summary>
        /// Admin karar geçmişini listeler
        /// </summary>
        [HttpGet("admin/decisions")]
        [Authorize(Roles = "gsb,GSB Görevlisi")]
        public async Task<ActionResult<IEnumerable<MentorApplicationDecisionDto>>> GetDecisionHistory([FromQuery] int? mentorId)
        {
            var query = new GetMentorDecisionHistoryQuery
            {
                AdminRoleId = GetUserRoleId(),
                MentorIdFilter = mentorId
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        #endregion

        #region Topluluk Başkanı Endpoints

        /// <summary>
        /// Topluluk başkanı onaylı mentörleri listeler (iletişim bilgileri gizli)
        /// </summary>
        [HttpGet("approved")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<ApprovedMentorListItemDto>>> GetApprovedMentors([FromQuery] int? cityId)
        {
            var query = new GetApprovedMentorsQuery
            {
                UserRoleId = GetUserRoleId(),
                CityFilter = cityId
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        /// <summary>
        /// Mentör detayını getirir (eşleşme varsa iletişim bilgileri dahil)
        /// </summary>
        [HttpGet("{mentorId}")]
        [Authorize]
        public async Task<ActionResult<MentorDetailDto>> GetMentorById(int mentorId)
        {
            var query = new GetMentorByIdQuery
            {
                MentorId = mentorId,
                UserId = GetUserId(),
                UserRoleId = GetUserRoleId()
            };

            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound(new { message = "Mentör bulunamadı." });

            return Ok(result);
        }

        #endregion
    }
}

