using System.Collections.Generic;
using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Unides.Application.Interfaces.Repositories
{
    public interface ICommunityMentorAssignmentRepository
    {
        Task<CommunityMentorAssignment> AddAsync(CommunityMentorAssignment assignment);
        Task<CommunityMentorAssignment?> GetByIdAsync(int assignmentId);
        Task<CommunityMentorAssignment?> GetActiveAssignmentByCommunityIdAsync(int communityId);
        Task<IEnumerable<CommunityMentorAssignment>> GetByMentorIdAsync(int mentorId);
        Task<IEnumerable<CommunityMentorAssignment>> GetActiveByMentorIdAsync(int mentorId);
        Task<IEnumerable<CommunityMentorAssignment>> GetByCommunityIdAsync(int communityId);
        Task UpdateAsync(CommunityMentorAssignment assignment);
        Task CloseActiveAssignmentAsync(int communityId);
        Task CloseAllAssignmentsByMentorIdAsync(int mentorId);
        Task<bool> HasActiveAssignmentWithMentorAsync(int communityId, int mentorId);
    }
}

