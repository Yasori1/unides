using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class CommunityRepository : ICommunityRepository
    {
        private readonly UnidesDbContext _db;

        public CommunityRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task<Community?> GetByIdAsync(int communityId)
        {
            return await _db.Communities
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == communityId);
        }

        public async Task<Community?> GetByPresidentUserIdAsync(int presidentUserId)
        {
            return await _db.Communities
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.ToplulukBaskani == presidentUserId);
        }

        public async Task<bool> IsUserPresidentOfCommunityAsync(int userId, int communityId)
        {
            return await _db.Communities
                .AnyAsync(c => c.Id == communityId && c.ToplulukBaskani == userId);
        }
    }
}

