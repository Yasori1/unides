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
    /// Topluluk başkanının yaptığı tüm mentör başvurularını listeler
    /// </summary>
    public class GetMyCommunityMentorRequestsQuery : IRequest<IEnumerable<CommunityMentorRequestListItemDto>>
    {
        public int UserId { get; set; } // JWT'den gelecek
        public int UserRoleId { get; set; } // JWT'den gelecek
    }

    public class GetMyCommunityMentorRequestsQueryHandler : IRequestHandler<GetMyCommunityMentorRequestsQuery, IEnumerable<CommunityMentorRequestListItemDto>>
    {
        private readonly ICommunityMentorRequestRepository _requestRepo;
        private readonly ICommunityRepository _communityRepo;
        private readonly IMentorRepository _mentorRepo;

        public GetMyCommunityMentorRequestsQueryHandler(
            ICommunityMentorRequestRepository requestRepo,
            ICommunityRepository communityRepo,
            IMentorRepository mentorRepo)
        {
            _requestRepo = requestRepo;
            _communityRepo = communityRepo;
            _mentorRepo = mentorRepo;
        }

        public async Task<IEnumerable<CommunityMentorRequestListItemDto>> Handle(GetMyCommunityMentorRequestsQuery request, CancellationToken cancellationToken)
        {
            // Sadece topluluk başkanları (role_id = 3) görebilir
            if (request.UserRoleId != 3)
            {
                return Enumerable.Empty<CommunityMentorRequestListItemDto>();
            }

            var community = await _communityRepo.GetByPresidentUserIdAsync(request.UserId);
            if (community == null)
            {
                return Enumerable.Empty<CommunityMentorRequestListItemDto>();
            }

            var requests = await _requestRepo.GetByCommunityIdAsync(community.Id);
            var result = new List<CommunityMentorRequestListItemDto>();

            foreach (var req in requests)
            {
                var mentor = await _mentorRepo.GetByIdAsync(req.MentorId);
                result.Add(new CommunityMentorRequestListItemDto
                {
                    RequestId = req.RequestId,
                    CommunityId = req.CommunityId,
                    CommunityName = community.Name ?? "",
                    MentorId = req.MentorId,
                    MentorFullName = mentor?.FullName ?? "",
                    Status = req.Status,
                    CreatedAt = req.CreatedAt,
                    DecidedAt = req.DecidedAt
                });
            }

            return result.OrderByDescending(r => r.CreatedAt);
        }
    }
}

