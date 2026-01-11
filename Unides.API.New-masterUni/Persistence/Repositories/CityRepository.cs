using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class CityRepository : ICityRepository
    {
        private readonly UnidesDbContext _db;

        public CityRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task<City?> GetByIdAsync(int cityId)
        {
            return await _db.Cities
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.CitiesId == cityId);
        }

        public async Task<IEnumerable<City>> GetAllAsync()
        {
            return await _db.Cities
                .AsNoTracking()
                .OrderBy(c => c.CitiesId)
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(int cityId)
        {
            return await _db.Cities.AnyAsync(c => c.CitiesId == cityId);
        }
    }
}

