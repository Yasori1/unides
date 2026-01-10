using Microsoft.EntityFrameworkCore;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class AnnouncementRepository : IAnnouncementRepository
    {
        private readonly UnidesDbContext _db;

        public AnnouncementRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task<Announcement> AddAsync(Announcement entity)
        {
            _db.Announcements.Add(entity);
            await _db.SaveChangesAsync();
            return entity;
        }

        public async Task DeleteAsync(int id)
        {
            var entity = await _db.Announcements.FirstOrDefaultAsync(x => x.AnnId == id);
            if (entity == null) return;
            _db.Announcements.Remove(entity);
            await _db.SaveChangesAsync();
        }

        public async Task<IEnumerable<Announcement>> GetAllAsync()
        {
            return await _db.Announcements
                .AsNoTracking()
                .OrderByDescending(x => x.AnnDate ?? x.CreatedAt)
                .ToListAsync();
        }

        public async Task<Announcement?> GetByIdAsync(int id)
        {
            return await _db.Announcements.AsNoTracking().FirstOrDefaultAsync(x => x.AnnId == id);
        }

        public async Task UpdateAsync(Announcement entity)
        {
            _db.Announcements.Update(entity);
            await _db.SaveChangesAsync();
        }
    }
}


