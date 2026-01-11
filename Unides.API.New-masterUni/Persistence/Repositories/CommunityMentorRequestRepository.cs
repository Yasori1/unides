using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class CommunityMentorRequestRepository : ICommunityMentorRequestRepository
    {
        private readonly UnidesDbContext _db;

        public CommunityMentorRequestRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task<CommunityMentorRequest> AddAsync(CommunityMentorRequest request)
        {
            _db.CommunityMentorRequests.Add(request);
            await _db.SaveChangesAsync();
            return request;
        }

        public async Task<CommunityMentorRequest?> GetByIdAsync(int requestId)
        {
            return await _db.CommunityMentorRequests
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.RequestId == requestId);
        }

        public async Task<IEnumerable<CommunityMentorRequest>> GetByCommunityIdAsync(int communityId)
        {
            return await _db.CommunityMentorRequests
                .AsNoTracking()
                .Where(r => r.CommunityId == communityId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<CommunityMentorRequest>> GetByMentorIdAsync(int mentorId)
        {
            return await _db.CommunityMentorRequests
                .AsNoTracking()
                .Where(r => r.MentorId == mentorId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<CommunityMentorRequest>> GetPendingByMentorIdAsync(int mentorId)
        {
            return await _db.CommunityMentorRequests
                .AsNoTracking()
                .Where(r => r.MentorId == mentorId && r.Status == "pending")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<CommunityMentorRequest?> GetPendingByCommunityAndMentorAsync(int communityId, int mentorId)
        {
            return await _db.CommunityMentorRequests
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.CommunityId == communityId && r.MentorId == mentorId && r.Status == "pending");
        }

        public async Task UpdateAsync(CommunityMentorRequest request)
        {
            _db.CommunityMentorRequests.Update(request);
            await _db.SaveChangesAsync();
        }

        public async Task<bool> HasPendingRequestAsync(int communityId, int mentorId)
        {
            return await _db.CommunityMentorRequests
                .AnyAsync(r => r.CommunityId == communityId && r.MentorId == mentorId && r.Status == "pending");
        }
    }
}

