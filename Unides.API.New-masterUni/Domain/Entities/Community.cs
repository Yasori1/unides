using System;
using System.Collections.Generic;

namespace Unides.Domain.Entities
{
    public class Community
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? About { get; set; }
        public string? City { get; set; }
        public string? University { get; set; }
        public string? LogoUrl { get; set; }
        public List<string>? Tags { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public int? ToplulukBaskani { get; set; }
        public string? ContactEmail { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? SocialLinks { get; set; } 

        public ICollection<UserCommunity>? UserCommunities { get; set; }
        public ICollection<CommunityProject>? Projects { get; set; } 
        public ICollection<CommunityEvent>? Events { get; set; }     
    }
}