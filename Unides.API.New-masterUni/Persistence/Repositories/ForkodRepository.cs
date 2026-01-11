using Microsoft.EntityFrameworkCore;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class ForkodRepository : IForkodRepository
    {
        private readonly UnidesDbContext _db;

        public ForkodRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task<List<Forkod>> GetAllAsync()
        {
            return await _db.Forkod.AsNoTracking().ToListAsync();
        }
    }
}


