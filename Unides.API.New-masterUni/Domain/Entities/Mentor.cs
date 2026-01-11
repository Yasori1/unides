using System;
using System.Collections.Generic;

namespace Unides.Domain.Entities
{
    public class Mentor
    {
        public int MentorId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int PreferredCity { get; set; } // Seçtiği il (cities_id referansı)
        public List<string> ExpertiseAreas { get; set; } = new(); // ['girişimcilik','yapay zeka']
        public string? Experience { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public string Status { get; set; } = "pending"; // pending, approved, rejected, deleted
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public User User { get; set; } = null!;
        public City City { get; set; } = null!;
        public ICollection<MentorApplication> Applications { get; set; } = new List<MentorApplication>();
        public ICollection<CommunityMentorRequest> MentorRequests { get; set; } = new List<CommunityMentorRequest>();
        public ICollection<CommunityMentorAssignment> Assignments { get; set; } = new List<CommunityMentorAssignment>();
    }
}

