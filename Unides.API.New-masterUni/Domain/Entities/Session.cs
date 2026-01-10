using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace Unides.Domain.Entities
{
    public class Session
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public string RefreshTokenHash { get; set; } // Hashed refresh token
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? RevokedAt { get; set; } // Token iptal edildi mi?
        public string? ReplacedByTokenHash { get; set; } // Bu token hangi token ile değiştirildi?
    }
}
