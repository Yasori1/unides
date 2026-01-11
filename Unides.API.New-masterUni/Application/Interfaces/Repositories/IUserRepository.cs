using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Unides.Application.Interfaces.Repositories
{
    public interface IUserRepository
    {
        Task<User> GetByEmailAsync(string email);
        Task<User> GetByIdAsync(int id);
        Task AddAsync(User user);
        Task AddSessionAsync(Session session);
        Task<Session> GetSessionByTokenAsync(string token);
        Task<Session> GetSessionByTokenHashAsync(string tokenHash);
        Task UpdateSessionAsync(Session session);
        Task RevokeSessionAsync(int sessionId);
        Task RevokeAllUserSessionsAsync(int userId);
        Task<string> GetRoleNameById(int roleId);
        Task UpdateUserAsync(User user);
    }
}
