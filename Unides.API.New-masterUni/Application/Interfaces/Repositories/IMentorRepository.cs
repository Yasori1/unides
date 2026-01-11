using System.Collections.Generic;
using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Unides.Application.Interfaces.Repositories
{
    public interface IMentorRepository
    {
        Task<Mentor> AddAsync(Mentor mentor);
        Task<Mentor?> GetByIdAsync(int mentorId);
        Task<Mentor?> GetByUserIdAsync(int userId);
        Task<IEnumerable<Mentor>> GetAllAsync();
        Task<IEnumerable<Mentor>> GetByStatusAsync(string status);
        Task<IEnumerable<Mentor>> GetApprovedMentorsAsync();
        Task<IEnumerable<Mentor>> GetApprovedMentorsByCityAsync(int cityId);
        Task UpdateAsync(Mentor mentor);
        Task<bool> ExistsByUserIdAsync(int userId);
    }
}

