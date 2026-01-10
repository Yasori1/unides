using System.Collections.Generic;
using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Unides.Application.Interfaces.Repositories
{
    public interface IMentorApplicationRepository
    {
        Task<MentorApplication> AddAsync(MentorApplication application);
        Task<MentorApplication?> GetByIdAsync(int applicationId);
        Task<IEnumerable<MentorApplication>> GetByMentorIdAsync(int mentorId);
        Task<IEnumerable<MentorApplication>> GetAllAsync();
        Task<MentorApplication?> GetLatestByMentorIdAsync(int mentorId);
    }
}

