using System;

namespace Unides.Domain.Entities
{
    public class Announcement
    {
        public int AnnId { get; set; }
        public string Title { get; set; }
        public string? ShortDescription { get; set; }
        public DateTime? AnnDate { get; set; }
        public string? Description { get; set; }
        public string? Link { get; set; }
        public string? ImagePath { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public int? AnnCreatedAtUserId { get; set; }
        public int? AnnUpdatedAtUserId { get; set; }
    }
}


