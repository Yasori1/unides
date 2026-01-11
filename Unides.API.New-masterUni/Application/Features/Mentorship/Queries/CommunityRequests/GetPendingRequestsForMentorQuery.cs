using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Queries.CommunityRequests
{
    /// <summary>
    /// Mentörün kendisine gelen bekleyen başvuruları listeler
    /// </summary>
    public class GetPendingRequestsForMentorQuery : IRequest<GetPendingRequestsForMentorResult>
    {
        public int UserId { get; set; } // JWT'den gelecek
    }

    public class GetPendingRequestsForMentorResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public IEnumerable<PendingMentorRequestDto> Requests { get; set; } = Enumerable.Empty<PendingMentorRequestDto>();
    }

    public class GetPendingRequestsForMentorQueryHandler : IRequestHandler<GetPendingRequestsForMentorQuery, GetPendingRequestsForMentorResult>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly ICommunityMentorRequestRepository _requestRepo;
        private readonly ICommunityRepository _communityRepo;
        private readonly IUserRepository _userRepo;

        public GetPendingRequestsForMentorQueryHandler(
            IMentorRepository mentorRepo,
            ICommunityMentorRequestRepository requestRepo,
            ICommunityRepository communityRepo,
            IUserRepository userRepo)
        {
            _mentorRepo = mentorRepo;
            _requestRepo = requestRepo;
            _communityRepo = communityRepo;
            _userRepo = userRepo;
        }

        public async Task<GetPendingRequestsForMentorResult> Handle(GetPendingRequestsForMentorQuery request, CancellationToken cancellationToken)
        {
            // Kullanıcının mentör kaydını bul
            var mentor = await _mentorRepo.GetByUserIdAsync(request.UserId);

            if (mentor == null || mentor.Status != "approved")
            {
                return new GetPendingRequestsForMentorResult
                {
                    Success = false,
                    ErrorMessage = "Onaylı mentör kaydınız bulunamadı."
                };
            }

            var pendingRequests = await _requestRepo.GetPendingByMentorIdAsync(mentor.MentorId);
            var result = new List<PendingMentorRequestDto>();

            foreach (var req in pendingRequests)
            {
                var community = await _communityRepo.GetByIdAsync(req.CommunityId);
                var president = await _userRepo.GetByIdAsync(req.PresidentUserId);

                result.Add(new PendingMentorRequestDto
                {
                    RequestId = req.RequestId,
                    CommunityId = req.CommunityId,
                    CommunityName = community?.Name ?? "",
                    CommunityCity = community?.City,
                    CommunityUniversity = community?.University,
                    PresidentUserId = req.PresidentUserId,
                    PresidentName = president?.Name ?? "",
                    Status = req.Status,
                    CreatedAt = req.CreatedAt
                });
            }

            return new GetPendingRequestsForMentorResult
            {
                Success = true,
                Requests = result.OrderByDescending(r => r.CreatedAt)
            };
        }
    }
}

