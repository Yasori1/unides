using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class MentorApplicationRepository : IMentorApplicationRepository
    {
        private readonly UnidesDbContext _db;

        public MentorApplicationRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task<MentorApplication> AddAsync(MentorApplication application)
        {
            _db.MentorApplications.Add(application);
            await _db.SaveChangesAsync();
            return application;
        }

        public async Task<MentorApplication?> GetByIdAsync(int applicationId)
        {
            return await _db.MentorApplications
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.ApplicationId == applicationId);
        }

        public async Task<IEnumerable<MentorApplication>> GetByMentorIdAsync(int mentorId)
        {
            return await _db.MentorApplications
                .AsNoTracking()
                .Where(a => a.MentorId == mentorId)
                .OrderByDescending(a => a.DecidedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<MentorApplication>> GetAllAsync()
        {
            return await _db.MentorApplications
                .AsNoTracking()
                .OrderByDescending(a => a.DecidedAt)
                .ToListAsync();
        }

        public async Task<MentorApplication?> GetLatestByMentorIdAsync(int mentorId)
        {
            return await _db.MentorApplications
                .AsNoTracking()
                .Where(a => a.MentorId == mentorId)
                .OrderByDescending(a => a.DecidedAt)
                .FirstOrDefaultAsync();
        }
    }
}

