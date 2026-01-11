using System;

namespace Unides.Domain.Entities
{
    /// <summary>
    /// Kabul edilen mentör-topluluk eşleşmelerini tutar.
    /// Bir topluluk aynı anda yalnızca 1 aktif mentöre sahip olabilir.
    /// </summary>
    public class CommunityMentorAssignment
    {
        public int AssignmentId { get; set; }
        public int CommunityId { get; set; }
        public int MentorId { get; set; }
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; } // null = aktif atama

        // Navigation Properties
        public Community Community { get; set; } = null!;
        public Mentor Mentor { get; set; } = null!;
    }
}

