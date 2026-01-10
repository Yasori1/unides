using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public interface IEventRepository
    {
        Task<int> AddAsync(Event entity);
        Task<List<Event>> GetListAsync();
        Task<Event?> GetByIdAsync(int id);
        Task UpdateAsync(Event entity);
        Task DeleteAsync(Event entity);
    }
}
