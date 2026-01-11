using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class ErrorLogRepository : IErrorLogRepository
    {
        private readonly UnidesDbContext _db;
        public ErrorLogRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task AddAsync(ErrorLog log)
        {
            _db.ErrorLogs.Add(log);
            await _db.SaveChangesAsync();
        }
    }
}
