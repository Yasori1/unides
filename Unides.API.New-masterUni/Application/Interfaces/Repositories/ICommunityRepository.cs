using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Unides.Application.Interfaces.Repositories
{
    public interface ICommunityRepository
    {
        Task<Community?> GetByIdAsync(int communityId);
        Task<Community?> GetByPresidentUserIdAsync(int presidentUserId);
        Task<bool> IsUserPresidentOfCommunityAsync(int userId, int communityId);
    }
}

