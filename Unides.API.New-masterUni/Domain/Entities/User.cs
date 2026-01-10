using System;
using System.Collections.Generic;

namespace Unides.Domain.Entities
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }

        // İlişkiler (Foreign Key
        public int RoleId { get; set; }
        public Role Role { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Rozet { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<Session> Sessions { get; set; }
    }
}