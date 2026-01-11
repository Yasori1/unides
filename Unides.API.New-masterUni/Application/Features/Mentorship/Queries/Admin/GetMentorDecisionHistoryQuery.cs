using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Queries.Admin
{
    /// <summary>
    /// Admin için mentör başvuru karar geçmişini listeler
    /// </summary>
    public class GetMentorDecisionHistoryQuery : IRequest<IEnumerable<MentorApplicationDecisionDto>>
    {
        public int AdminRoleId { get; set; } // JWT'den gelecek
        public int? MentorIdFilter { get; set; } // Opsiyonel filtre
    }

    public class GetMentorDecisionHistoryQueryHandler : IRequestHandler<GetMentorDecisionHistoryQuery, IEnumerable<MentorApplicationDecisionDto>>
    {
        private readonly IMentorApplicationRepository _applicationRepo;
        private readonly IMentorRepository _mentorRepo;
        private readonly IUserRepository _userRepo;

        public GetMentorDecisionHistoryQueryHandler(
            IMentorApplicationRepository applicationRepo,
            IMentorRepository mentorRepo,
            IUserRepository userRepo)
        {
            _applicationRepo = applicationRepo;
            _mentorRepo = mentorRepo;
            _userRepo = userRepo;
        }

        public async Task<IEnumerable<MentorApplicationDecisionDto>> Handle(GetMentorDecisionHistoryQuery request, CancellationToken cancellationToken)
        {
            // Sadece Admin (role_id = 2) görebilir
            if (request.AdminRoleId != 2)
            {
                return Enumerable.Empty<MentorApplicationDecisionDto>();
            }

            var applications = request.MentorIdFilter.HasValue
                ? await _applicationRepo.GetByMentorIdAsync(request.MentorIdFilter.Value)
                : await _applicationRepo.GetAllAsync();

            var result = new List<MentorApplicationDecisionDto>();

            foreach (var app in applications)
            {
                var mentor = await _mentorRepo.GetByIdAsync(app.MentorId);
                var admin = app.AdminId.HasValue ? await _userRepo.GetByIdAsync(app.AdminId.Value) : null;

                result.Add(new MentorApplicationDecisionDto
                {
                    ApplicationId = app.ApplicationId,
                    MentorId = app.MentorId,
                    MentorFullName = mentor?.FullName ?? "",
                    AdminId = app.AdminId,
                    AdminName = admin?.Name,
                    Decision = app.Decision,
                    DecisionNote = app.DecisionNote,
                    DecidedAt = app.DecidedAt
                });
            }

            return result.OrderByDescending(a => a.DecidedAt);
        }
    }
}

