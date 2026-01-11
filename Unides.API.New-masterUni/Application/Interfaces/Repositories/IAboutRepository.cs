using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Unides.Application.Interfaces.Repositories
{
    public interface IAboutRepository
    {
        Task<About> GetAboutInfoAsync();
    }
}