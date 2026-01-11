using System;
using System.Collections.Generic;

namespace Unides.Domain.Entities
{
    public class CommunityEvent
    {
        public int Id { get; set; }
        public int CommunityId { get; set; }
        public string? Title { get; set; }
        public string? Summary { get; set; }
        public string? Description { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public string? Location { get; set; }
        public List<string>? Tags { get; set; }
        public bool IsPublished { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Community? Community { get; set; }
    }
}