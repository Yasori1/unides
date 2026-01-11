using System;
using System.Collections.Generic;

namespace Unides.Application.DTOs.Mentorship
{
    /// <summary>
    /// Topluluk-Mentör ataması listesi için DTO
    /// </summary>
    public class CommunityMentorAssignmentDto
    {
        public int AssignmentId { get; set; }
        public int CommunityId { get; set; }
        public string CommunityName { get; set; } = string.Empty;
        public int MentorId { get; set; }
        public string MentorFullName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive => EndDate == null;
    }

    /// <summary>
    /// Topluluk başkanının kendi aktif mentörünü görmesi için DTO (iletişim bilgileri dahil)
    /// </summary>
    public class ActiveMentorForCommunityDto
    {
        public int AssignmentId { get; set; }
        public int MentorId { get; set; }
        public string MentorFullName { get; set; } = string.Empty;
        public string CityName { get; set; } = string.Empty;
        public List<string> ExpertiseAreas { get; set; } = new();
        public string? Experience { get; set; }
        public string ContactEmail { get; set; } = string.Empty; // Eşleşme kabul edildiği için görünür
        public string ContactPhone { get; set; } = string.Empty; // Eşleşme kabul edildiği için görünür
        public DateTime StartDate { get; set; }
    }

    /// <summary>
    /// Mentörün kendi atamalarını görmesi için DTO
    /// </summary>
    public class MentorAssignmentDto
    {
        public int AssignmentId { get; set; }
        public int CommunityId { get; set; }
        public string CommunityName { get; set; } = string.Empty;
        public string? CommunityCity { get; set; }
        public string? CommunityUniversity { get; set; }
        public string? CommunityContactEmail { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsActive => EndDate == null;
    }
}

