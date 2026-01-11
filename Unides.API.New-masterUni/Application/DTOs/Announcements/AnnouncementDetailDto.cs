using System;

namespace Unides.Application.DTOs.Announcements
{
    public class AnnouncementDetailDto
    {
        public int AnnId { get; set; }
        public string Title { get; set; }
        public string? ShortDescription { get; set; }
        public DateTime? EventDate { get; set; }
        public string? Description { get; set; }
        public string? Link { get; set; }
        public string? ImagePath { get; set; }
    }
}


