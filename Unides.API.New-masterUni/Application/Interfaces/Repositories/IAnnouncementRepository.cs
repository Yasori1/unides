using System.Collections.Generic;
using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Unides.Application.Interfaces.Repositories
{
    public interface IAnnouncementRepository
    {
        Task<Announcement> AddAsync(Announcement entity);
        Task<Announcement?> GetByIdAsync(int id);
        Task<IEnumerable<Announcement>> GetAllAsync();
        Task UpdateAsync(Announcement entity);
        Task DeleteAsync(int id);
    }
}


