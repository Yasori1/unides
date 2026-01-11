using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Features.Mentorship.Commands.CommunityRequests;
using Unides.Application.Features.Mentorship.Queries.Assignments;
using Unides.Application.Features.Mentorship.Queries.CommunityRequests;

namespace Unides.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MentorRequestsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public MentorRequestsController(IMediator mediator)
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

        #region Topluluk Başkanı Endpoints

        /// <summary>
        /// Topluluk başkanı (role_id = 3) bir mentöre başvuru yapar
        /// </summary>
        [HttpPost("create")]
        [Authorize]
        public async Task<ActionResult> CreateMentorRequest([FromBody] CreateCommunityMentorRequestDto dto)
        {
            var command = new CreateCommunityMentorRequestCommand
            {
                UserId = GetUserId(),
                UserRoleId = GetUserRoleId(),
                MentorId = dto.MentorId
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { requestId = result.RequestId, message = "Mentör talebiniz başarıyla gönderildi." });
        }

        /// <summary>
        /// Topluluk başkanı kendi başvurularını listeler
        /// </summary>
        [HttpGet("my-requests")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<CommunityMentorRequestListItemDto>>> GetMyRequests()
        {
            var query = new GetMyCommunityMentorRequestsQuery
            {
                UserId = GetUserId(),
                UserRoleId = GetUserRoleId()
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        /// <summary>
        /// Topluluk başkanı bekleyen başvurusunu iptal eder
        /// </summary>
        [HttpDelete("cancel/{requestId}")]
        [Authorize]
        public async Task<ActionResult> CancelRequest(int requestId)
        {
            var command = new CancelCommunityMentorRequestCommand
            {
                RequestId = requestId,
                UserId = GetUserId()
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(new { message = "Başvurunuz başarıyla iptal edildi." });
        }

        /// <summary>
        /// Topluluk başkanı kendi topluluğunun aktif mentörünü görüntüler (iletişim bilgileri dahil)
        /// </summary>
        [HttpGet("my-active-mentor")]
        [Authorize]
        public async Task<ActionResult<ActiveMentorForCommunityDto>> GetMyActiveMentor()
        {
            var query = new GetActiveMentorForCommunityQuery
            {
                UserId = GetUserId(),
                UserRoleId = GetUserRoleId()
            };

            var result = await _mediator.Send(query);

            if (result == null)
                return NotFound(new { message = "Aktif bir mentörünüz bulunmamaktadır." });

            return Ok(result);
        }

        #endregion

        #region Mentör Endpoints

        /// <summary>
        /// Mentör kendisine gelen bekleyen başvuruları listeler
        /// </summary>
        [HttpGet("pending-for-me")]
        [Authorize]
        public async Task<ActionResult> GetPendingRequestsForMe()
        {
            var query = new GetPendingRequestsForMentorQuery
            {
                UserId = GetUserId()
            };

            var result = await _mediator.Send(query);

            if (!result.Success)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Requests);
        }

        /// <summary>
        /// Mentör kendisine gelen tüm başvuruları listeler (geçmiş dahil)
        /// </summary>
        [HttpGet("all-for-me")]
        [Authorize]
        public async Task<ActionResult> GetAllRequestsForMe()
        {
            var query = new GetAllRequestsForMentorQuery
            {
                UserId = GetUserId()
            };

            var result = await _mediator.Send(query);

            if (!result.Success)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Requests);
        }

        /// <summary>
        /// Mentör başvuruyu kabul veya reddeder
        /// </summary>
        [HttpPost("decide/{requestId}")]
        [Authorize]
        public async Task<ActionResult> DecideRequest(int requestId, [FromBody] MentorRequestDecisionDto dto)
        {
            var command = new MentorDecideRequestCommand
            {
                RequestId = requestId,
                UserId = GetUserId(),
                Decision = dto.Decision
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
                return BadRequest(new { message = result.ErrorMessage });

            if (result.AssignmentId.HasValue)
            {
                return Ok(new
                {
                    assignmentId = result.AssignmentId,
                    message = "Başvuru kabul edildi ve mentörlük ataması oluşturuldu."
                });
            }

            return Ok(new { message = "Başvuru reddedildi." });
        }

        /// <summary>
        /// Mentör kendi atamalarını listeler
        /// </summary>
        [HttpGet("my-assignments")]
        [Authorize]
        public async Task<ActionResult> GetMyAssignments([FromQuery] bool onlyActive = false)
        {
            var query = new GetMyAssignmentsQuery
            {
                UserId = GetUserId(),
                OnlyActive = onlyActive
            };

            var result = await _mediator.Send(query);

            if (!result.Success)
                return BadRequest(new { message = result.ErrorMessage });

            return Ok(result.Assignments);
        }

        #endregion
    }
}

