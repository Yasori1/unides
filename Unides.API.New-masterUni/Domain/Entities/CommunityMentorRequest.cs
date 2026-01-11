using System;

namespace Unides.Domain.Entities
{
    /// <summary>
    /// Topluluk başkanının mentöre yaptığı başvuruları tutar
    /// </summary>
    public class CommunityMentorRequest
    {
        public int RequestId { get; set; }
        public int CommunityId { get; set; }
        public int MentorId { get; set; }
        public int PresidentUserId { get; set; } // Başvuruyu yapan topluluk başkanı
        public string Status { get; set; } = "pending"; // pending, accepted, rejected
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DecidedAt { get; set; }

        // Navigation Properties
        public Community Community { get; set; } = null!;
        public Mentor Mentor { get; set; } = null!;
        public User President { get; set; } = null!;
    }
}

