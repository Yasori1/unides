using System;
using System.Collections.Generic;

namespace Unides.Application.DTOs.Mentorship
{
    /// <summary>
    /// Öğrencinin mentör başvurusu yaparken gönderdiği DTO
    /// </summary>
    public class CreateMentorApplicationDto
    {
        public string FullName { get; set; } = string.Empty;
        public int PreferredCity { get; set; } // cities_id
        public List<string> ExpertiseAreas { get; set; } = new(); // ['girişimcilik','yapay zeka']
        public string? Experience { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
    }

    /// <summary>
    /// Mentör başvurusunu güncellemek için DTO
    /// </summary>
    public class UpdateMentorApplicationDto
    {
        public string? FullName { get; set; }
        public int? PreferredCity { get; set; }
        public List<string>? ExpertiseAreas { get; set; }
        public string? Experience { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
    }

    /// <summary>
    /// Mentör listesi için DTO (Admin için tüm bilgiler)
    /// </summary>
    public class MentorListItemDto
    {
        public int MentorId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int PreferredCity { get; set; }
        public string CityName { get; set; } = string.Empty;
        public List<string> ExpertiseAreas { get; set; } = new();
        public string? Experience { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Onaylı mentör listesi için DTO (Topluluk Başkanı için - iletişim bilgileri gizli)
    /// </summary>
    public class ApprovedMentorListItemDto
    {
        public int MentorId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int PreferredCity { get; set; }
        public string CityName { get; set; } = string.Empty;
        public List<string> ExpertiseAreas { get; set; } = new();
        public string? Experience { get; set; }
        // ContactEmail ve ContactPhone burada YOK!
    }

    /// <summary>
    /// Mentör detayı için DTO (eşleşme kabul edildiyse iletişim bilgileri dahil)
    /// </summary>
    public class MentorDetailDto
    {
        public int MentorId { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int PreferredCity { get; set; }
        public string CityName { get; set; } = string.Empty;
        public List<string> ExpertiseAreas { get; set; } = new();
        public string? Experience { get; set; }
        public string? ContactEmail { get; set; } // Sadece eşleşme varsa dolu
        public string? ContactPhone { get; set; } // Sadece eşleşme varsa dolu
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// Kullanıcının kendi mentör başvuru durumunu görmesi için
    /// </summary>
    public class MyMentorApplicationDto
    {
        public int MentorId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int PreferredCity { get; set; }
        public string CityName { get; set; } = string.Empty;
        public List<string> ExpertiseAreas { get; set; } = new();
        public string? Experience { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? DecisionNote { get; set; } // Admin'in notu (varsa)
    }
}

