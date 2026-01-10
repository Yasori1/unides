using System;

namespace Unides.Domain.Entities
{
    /// <summary>
    /// Admin'in (GSB) mentör başvurularını değerlendirdiği kayıtları tutar
    /// </summary>
    public class MentorApplication
    {
        public int ApplicationId { get; set; }
        public int MentorId { get; set; }
        public int? AdminId { get; set; } // Kararı veren admin
        public string Decision { get; set; } = string.Empty; // approved / rejected
        public string? DecisionNote { get; set; }
        public DateTime DecidedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Mentor Mentor { get; set; } = null!;
        public User? Admin { get; set; }
    }
}

