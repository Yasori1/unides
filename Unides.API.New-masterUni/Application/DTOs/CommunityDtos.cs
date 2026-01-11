using System;

namespace Unides.Application.DTOs
{
    public class CreateCommunityDto
    {
        public string? Name { get; set; }
        public string? About { get; set; }
        public string? City { get; set; }
        public string? University { get; set; }
        public string? ContactEmail { get; set; }
    }

    public class UpdateCommunityDto
    {
        public string? Name { get; set; }  
        public string? About { get; set; }
        public string? City { get; set; }
        public string? University { get; set; }
        public string? LogoUrl { get; set; }
        public string? ContactEmail { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? SocialLinks { get; set; }
    }

    public class CreateProjectDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public DateTime? StartDate { get; set; }
    }
    
    public class CreateEventDto
    {
        public string? Title { get; set; }
        public string? Summary { get; set; }
        public string? Description { get; set; }
        public DateTime StartAt { get; set; }
        public string? Location { get; set; }
    }
}