using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class MentorRepository : IMentorRepository
    {
        private readonly UnidesDbContext _db;

        public MentorRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task<Mentor> AddAsync(Mentor mentor)
        {
            _db.Mentors.Add(mentor);
            await _db.SaveChangesAsync();
            return mentor;
        }

        public async Task<Mentor?> GetByIdAsync(int mentorId)
        {
            return await _db.Mentors
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.MentorId == mentorId);
        }

        public async Task<Mentor?> GetByUserIdAsync(int userId)
        {
            return await _db.Mentors
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.UserId == userId);
        }

        public async Task<IEnumerable<Mentor>> GetAllAsync()
        {
            return await _db.Mentors
                .AsNoTracking()
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Mentor>> GetByStatusAsync(string status)
        {
            return await _db.Mentors
                .AsNoTracking()
                .Where(m => m.Status == status)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Mentor>> GetApprovedMentorsAsync()
        {
            return await _db.Mentors
                .AsNoTracking()
                .Where(m => m.Status == "approved")
                .OrderBy(m => m.FullName)
                .ToListAsync();
        }

        public async Task<IEnumerable<Mentor>> GetApprovedMentorsByCityAsync(int cityId)
        {
            return await _db.Mentors
                .AsNoTracking()
                .Where(m => m.Status == "approved" && m.PreferredCity == cityId)
                .OrderBy(m => m.FullName)
                .ToListAsync();
        }

        public async Task UpdateAsync(Mentor mentor)
        {
            _db.Mentors.Update(mentor);
            await _db.SaveChangesAsync();
        }

        public async Task<bool> ExistsByUserIdAsync(int userId)
        {
            return await _db.Mentors.AnyAsync(m => m.UserId == userId && m.Status != "deleted");
        }
    }
}

