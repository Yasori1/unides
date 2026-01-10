using System;

namespace Unides.Application.DTOs.Announcements
{
    public class AnnouncementListItemDto
    {
        public int AnnId { get; set; }
        public string Title { get; set; }
        public string? ShortDescription { get; set; }
        public DateTime? AnnDate { get; set; }
        public string? ImagePath { get; set; }
    }
}


