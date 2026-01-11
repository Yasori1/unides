using System;

namespace Unides.Application.DTOs.Mentorship
{
    /// <summary>
    /// Topluluk başkanının mentöre başvuru yapması için DTO
    /// </summary>
    public class CreateCommunityMentorRequestDto
    {
        public int MentorId { get; set; }
    }

    /// <summary>
    /// Mentörün başvuruyu kabul/red etmesi için DTO
    /// </summary>
    public class MentorRequestDecisionDto
    {
        public string Decision { get; set; } = string.Empty; // "accepted" veya "rejected"
    }

    /// <summary>
    /// Topluluk başkanının yaptığı başvuruları listelemek için DTO
    /// </summary>
    public class CommunityMentorRequestListItemDto
    {
        public int RequestId { get; set; }
        public int CommunityId { get; set; }
        public string CommunityName { get; set; } = string.Empty;
        public int MentorId { get; set; }
        public string MentorFullName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? DecidedAt { get; set; }
    }

    /// <summary>
    /// Mentörün gelen başvuruları görmesi için DTO
    /// </summary>
    public class PendingMentorRequestDto
    {
        public int RequestId { get; set; }
        public int CommunityId { get; set; }
        public string CommunityName { get; set; } = string.Empty;
        public string? CommunityCity { get; set; }
        public string? CommunityUniversity { get; set; }
        public int PresidentUserId { get; set; }
        public string PresidentName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}

