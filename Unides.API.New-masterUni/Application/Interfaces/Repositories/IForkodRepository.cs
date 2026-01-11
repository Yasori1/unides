using System.Collections.Generic;
using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Unides.Application.Interfaces.Repositories
{
    public interface IForkodRepository
    {
        Task<List<Forkod>> GetAllAsync();
    }
}


