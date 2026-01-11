using Microsoft.EntityFrameworkCore;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class EventRepository : IEventRepository
    {
        private readonly UnidesDbContext _context;

        public EventRepository(UnidesDbContext context)
        {
            _context = context;
        }

        // CREATE
        public async Task<int> AddAsync(Event entity)
        {
            await _context.Events.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity.EtkinlikId;
        }

        // LIST
        public async Task<List<Event>> GetListAsync()
        {
            return await _context.Events.ToListAsync();
        }

        // GET BY ID
        public async Task<Event?> GetByIdAsync(int id)
        {
            return await _context.Events
                .FirstOrDefaultAsync(e => e.EtkinlikId == id);
        }

        // UPDATE
        public async Task UpdateAsync(Event entity)
        {
            _context.Events.Update(entity);
            await _context.SaveChangesAsync();
        }

        // DELETE
        public async Task DeleteAsync(Event entity)
        {
            _context.Events.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}
