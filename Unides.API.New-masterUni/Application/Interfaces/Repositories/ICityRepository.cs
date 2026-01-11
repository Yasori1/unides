using System.Collections.Generic;
using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Unides.Application.Interfaces.Repositories
{
    public interface ICityRepository
    {
        Task<City?> GetByIdAsync(int cityId);
        Task<IEnumerable<City>> GetAllAsync();
        Task<bool> ExistsAsync(int cityId);
    }
}

