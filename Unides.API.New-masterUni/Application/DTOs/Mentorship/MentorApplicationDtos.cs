using System;

namespace Unides.Application.DTOs.Mentorship
{
    /// <summary>
    /// Admin'in mentör başvurusunu onaylaması/reddetmesi için DTO
    /// </summary>
    public class AdminDecisionDto
    {
        public string Decision { get; set; } = string.Empty; // "approved" veya "rejected"
        public string? DecisionNote { get; set; }
    }

    /// <summary>
    /// Admin karar geçmişi için DTO
    /// </summary>
    public class MentorApplicationDecisionDto
    {
        public int ApplicationId { get; set; }
        public int MentorId { get; set; }
        public string MentorFullName { get; set; } = string.Empty;
        public int? AdminId { get; set; }
        public string? AdminName { get; set; }
        public string Decision { get; set; } = string.Empty;
        public string? DecisionNote { get; set; }
        public DateTime DecidedAt { get; set; }
    }
}

