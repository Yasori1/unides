using Microsoft.EntityFrameworkCore;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly UnidesDbContext _db;

        public UserRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task<User> GetByEmailAsync(string email)
        {
            return await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User> GetByIdAsync(int id)
        {
            return await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task AddAsync(User user)
        {
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }

        public async Task AddSessionAsync(Session session)
        {
            _db.Sessions.Add(session);
            await _db.SaveChangesAsync();
        }

        public async Task<Session> GetSessionByTokenAsync(string token)
        {
            // Backward compatibility - eski plain token'larý da destekle
            return await _db.Sessions.FirstOrDefaultAsync(s => s.RefreshTokenHash == token || s.RefreshTokenHash == null);
        }

        public async Task<Session> GetSessionByTokenHashAsync(string tokenHash)
        {
            return await _db.Sessions
                .FirstOrDefaultAsync(s => s.RefreshTokenHash == tokenHash
                    && s.RevokedAt == null
                    && s.ExpiresAt > DateTime.UtcNow);
        }

        public async Task UpdateSessionAsync(Session session)
        {
            _db.Sessions.Update(session);
            await _db.SaveChangesAsync();
        }

        public async Task RevokeSessionAsync(int sessionId)
        {
            var session = await _db.Sessions.FindAsync(sessionId);
            if (session != null)
            {
                session.RevokedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
        }

        public async Task RevokeAllUserSessionsAsync(int userId)
        {
            var sessions = await _db.Sessions
                .Where(s => s.UserId == userId && s.RevokedAt == null)
                .ToListAsync();

            foreach (var session in sessions)
            {
                session.RevokedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }

        public async Task<string> GetRoleNameById(int roleId)
        {
            var role = await _db.Roles.FirstOrDefaultAsync(r => r.Id == roleId);
            return role?.Name ?? "Bilinmiyor";
        }

        public async Task UpdateUserAsync(User user)
        {
            _db.Users.Update(user);
            await _db.SaveChangesAsync();
        }
    }
}


