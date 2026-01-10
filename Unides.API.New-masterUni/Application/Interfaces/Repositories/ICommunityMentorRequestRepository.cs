using System.Collections.Generic;
using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Unides.Application.Interfaces.Repositories
{
    public interface ICommunityMentorRequestRepository
    {
        Task<CommunityMentorRequest> AddAsync(CommunityMentorRequest request);
        Task<CommunityMentorRequest?> GetByIdAsync(int requestId);
        Task<IEnumerable<CommunityMentorRequest>> GetByCommunityIdAsync(int communityId);
        Task<IEnumerable<CommunityMentorRequest>> GetByMentorIdAsync(int mentorId);
        Task<IEnumerable<CommunityMentorRequest>> GetPendingByMentorIdAsync(int mentorId);
        Task<CommunityMentorRequest?> GetPendingByCommunityAndMentorAsync(int communityId, int mentorId);
        Task UpdateAsync(CommunityMentorRequest request);
        Task<bool> HasPendingRequestAsync(int communityId, int mentorId);
    }
}

