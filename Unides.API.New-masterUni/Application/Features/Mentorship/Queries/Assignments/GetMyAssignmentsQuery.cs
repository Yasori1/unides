using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Queries.Assignments
{
    /// <summary>
    /// Mentörün kendi atamalarını listeler (aktif ve geçmiş)
    /// </summary>
    public class GetMyAssignmentsQuery : IRequest<GetMyAssignmentsResult>
    {
        public int UserId { get; set; } // JWT'den gelecek
        public bool OnlyActive { get; set; } = false; // Sadece aktif atamaları mı getir
    }

    public class GetMyAssignmentsResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public IEnumerable<MentorAssignmentDto> Assignments { get; set; } = Enumerable.Empty<MentorAssignmentDto>();
    }

    public class GetMyAssignmentsQueryHandler : IRequestHandler<GetMyAssignmentsQuery, GetMyAssignmentsResult>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly ICommunityMentorAssignmentRepository _assignmentRepo;
        private readonly ICommunityRepository _communityRepo;

        public GetMyAssignmentsQueryHandler(
            IMentorRepository mentorRepo,
            ICommunityMentorAssignmentRepository assignmentRepo,
            ICommunityRepository communityRepo)
        {
            _mentorRepo = mentorRepo;
            _assignmentRepo = assignmentRepo;
            _communityRepo = communityRepo;
        }

        public async Task<GetMyAssignmentsResult> Handle(GetMyAssignmentsQuery request, CancellationToken cancellationToken)
        {
            var mentor = await _mentorRepo.GetByUserIdAsync(request.UserId);

            if (mentor == null)
            {
                return new GetMyAssignmentsResult
                {
                    Success = false,
                    ErrorMessage = "Mentör kaydınız bulunamadı."
                };
            }

            var assignments = request.OnlyActive
                ? await _assignmentRepo.GetActiveByMentorIdAsync(mentor.MentorId)
                : await _assignmentRepo.GetByMentorIdAsync(mentor.MentorId);

            var result = new List<MentorAssignmentDto>();

            foreach (var assignment in assignments)
            {
                var community = await _communityRepo.GetByIdAsync(assignment.CommunityId);

                result.Add(new MentorAssignmentDto
                {
                    AssignmentId = assignment.AssignmentId,
                    CommunityId = assignment.CommunityId,
                    CommunityName = community?.Name ?? "",
                    CommunityCity = community?.City,
                    CommunityUniversity = community?.University,
                    CommunityContactEmail = community?.ContactEmail,
                    StartDate = assignment.StartDate,
                    EndDate = assignment.EndDate
                });
            }

            return new GetMyAssignmentsResult
            {
                Success = true,
                Assignments = result.OrderByDescending(a => a.StartDate)
            };
        }
    }
}

