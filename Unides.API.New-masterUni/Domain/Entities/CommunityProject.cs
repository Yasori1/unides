using System;

namespace Unides.Domain.Entities
{
    public class CommunityProject
    {
        public int Id { get; set; }
        public int CommunityId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; } 
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Community? Community { get; set; }
    }
}