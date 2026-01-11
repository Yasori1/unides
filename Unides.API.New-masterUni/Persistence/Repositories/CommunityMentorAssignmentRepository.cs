using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class CommunityMentorAssignmentRepository : ICommunityMentorAssignmentRepository
    {
        private readonly UnidesDbContext _db;

        public CommunityMentorAssignmentRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task<CommunityMentorAssignment> AddAsync(CommunityMentorAssignment assignment)
        {
            _db.CommunityMentorAssignments.Add(assignment);
            await _db.SaveChangesAsync();
            return assignment;
        }

        public async Task<CommunityMentorAssignment?> GetByIdAsync(int assignmentId)
        {
            return await _db.CommunityMentorAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId);
        }

        public async Task<CommunityMentorAssignment?> GetActiveAssignmentByCommunityIdAsync(int communityId)
        {
            return await _db.CommunityMentorAssignments
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.CommunityId == communityId && a.EndDate == null);
        }

        public async Task<IEnumerable<CommunityMentorAssignment>> GetByMentorIdAsync(int mentorId)
        {
            return await _db.CommunityMentorAssignments
                .AsNoTracking()
                .Where(a => a.MentorId == mentorId)
                .OrderByDescending(a => a.StartDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<CommunityMentorAssignment>> GetActiveByMentorIdAsync(int mentorId)
        {
            return await _db.CommunityMentorAssignments
                .AsNoTracking()
                .Where(a => a.MentorId == mentorId && a.EndDate == null)
                .OrderByDescending(a => a.StartDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<CommunityMentorAssignment>> GetByCommunityIdAsync(int communityId)
        {
            return await _db.CommunityMentorAssignments
                .AsNoTracking()
                .Where(a => a.CommunityId == communityId)
                .OrderByDescending(a => a.StartDate)
                .ToListAsync();
        }

        public async Task UpdateAsync(CommunityMentorAssignment assignment)
        {
            _db.CommunityMentorAssignments.Update(assignment);
            await _db.SaveChangesAsync();
        }

        public async Task CloseActiveAssignmentAsync(int communityId)
        {
            var activeAssignment = await _db.CommunityMentorAssignments
                .FirstOrDefaultAsync(a => a.CommunityId == communityId && a.EndDate == null);

            if (activeAssignment != null)
            {
                activeAssignment.EndDate = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        public async Task CloseAllAssignmentsByMentorIdAsync(int mentorId)
        {
            var activeAssignments = await _db.CommunityMentorAssignments
                .Where(a => a.MentorId == mentorId && a.EndDate == null)
                .ToListAsync();

            foreach (var assignment in activeAssignments)
            {
                assignment.EndDate = DateTime.UtcNow;
            }

            if (activeAssignments.Any())
            {
                await _db.SaveChangesAsync();
            }
        }

        public async Task<bool> HasActiveAssignmentWithMentorAsync(int communityId, int mentorId)
        {
            return await _db.CommunityMentorAssignments
                .AnyAsync(a => a.CommunityId == communityId && a.MentorId == mentorId && a.EndDate == null);
        }
    }
}

