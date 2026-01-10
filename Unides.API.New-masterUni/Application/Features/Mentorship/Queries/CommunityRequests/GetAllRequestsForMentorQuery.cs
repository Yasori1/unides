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
    /// Mentörün kendisine gelen tüm başvuruları listeler (geçmiş dahil)
    /// </summary>
    public class GetAllRequestsForMentorQuery : IRequest<GetAllRequestsForMentorResult>
    {
        public int UserId { get; set; } // JWT'den gelecek
    }

    public class GetAllRequestsForMentorResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public IEnumerable<PendingMentorRequestDto> Requests { get; set; } = Enumerable.Empty<PendingMentorRequestDto>();
    }

    public class GetAllRequestsForMentorQueryHandler : IRequestHandler<GetAllRequestsForMentorQuery, GetAllRequestsForMentorResult>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly ICommunityMentorRequestRepository _requestRepo;
        private readonly ICommunityRepository _communityRepo;
        private readonly IUserRepository _userRepo;

        public GetAllRequestsForMentorQueryHandler(
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

        public async Task<GetAllRequestsForMentorResult> Handle(GetAllRequestsForMentorQuery request, CancellationToken cancellationToken)
        {
            // Kullanıcının mentör kaydını bul
            var mentor = await _mentorRepo.GetByUserIdAsync(request.UserId);

            if (mentor == null)
            {
                return new GetAllRequestsForMentorResult
                {
                    Success = false,
                    ErrorMessage = "Mentör kaydınız bulunamadı."
                };
            }

            var allRequests = await _requestRepo.GetByMentorIdAsync(mentor.MentorId);
            var result = new List<PendingMentorRequestDto>();

            foreach (var req in allRequests)
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

            return new GetAllRequestsForMentorResult
            {
                Success = true,
                Requests = result.OrderByDescending(r => r.CreatedAt)
            };
        }
    }
}

