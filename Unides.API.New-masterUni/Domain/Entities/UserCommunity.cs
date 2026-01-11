using System;

namespace Unides.Domain.Entities
{
    public class UserCommunity
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }

        public int CommunityId { get; set; }
        public Community Community { get; set; }

        // Burası çok önemli: Kullanıcı "Global"de normal üye olabilir
        // ama "Bu Toplulukta" Başkan olabilir.
        public string RoleInCommunity { get; set; } // "Baskan", "Uye" vs.

        public DateTime JoinedAt { get; set; }
    }
}