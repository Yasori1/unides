using MediatR;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Application.Features.Mentorship.Commands.Mentors
{
    /// <summary>
    /// Öğrencinin (role_id = 1) mentör başvurusu yapması
    /// </summary>
    public class CreateMentorCommand : IRequest<CreateMentorResult>
    {
        public int UserId { get; set; } // JWT'den gelecek
        public int UserRoleId { get; set; } // JWT'den gelecek
        public string FullName { get; set; } = string.Empty;
        public int PreferredCity { get; set; }
        public List<string> ExpertiseAreas { get; set; } = new();
        public string? Experience { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class CreateMentorResult
    {
        public bool Success { get; set; }
        public int? MentorId { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class CreateMentorCommandHandler : IRequestHandler<CreateMentorCommand, CreateMentorResult>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly ICityRepository _cityRepo;

        public CreateMentorCommandHandler(IMentorRepository mentorRepo, ICityRepository cityRepo)
        {
            _mentorRepo = mentorRepo;
            _cityRepo = cityRepo;
        }

        public async Task<CreateMentorResult> Handle(CreateMentorCommand request, CancellationToken cancellationToken)
        {
            // 1. Sadece öğrenciler (role_id = 1) başvuru yapabilir
            if (request.UserRoleId != 1)
            {
                return new CreateMentorResult
                {
                    Success = false,
                    ErrorMessage = "Sadece öğrenciler mentör başvurusu yapabilir."
                };
            }

            // 2. Kullanıcının zaten aktif bir başvurusu var mı kontrol et
            var existingMentor = await _mentorRepo.GetByUserIdAsync(request.UserId);
            if (existingMentor != null && existingMentor.Status != "deleted")
            {
                return new CreateMentorResult
                {
                    Success = false,
                    ErrorMessage = "Zaten bir mentör başvurunuz bulunmaktadır."
                };
            }

            // 3. Şehir geçerli mi kontrol et
            var cityExists = await _cityRepo.ExistsAsync(request.PreferredCity);
            if (!cityExists)
            {
                return new CreateMentorResult
                {
                    Success = false,
                    ErrorMessage = "Geçersiz şehir seçimi."
                };
            }

            // 4. Mentör kaydını oluştur
            var mentor = new Mentor
            {
                UserId = request.UserId,
                FullName = request.FullName,
                PreferredCity = request.PreferredCity,
                ExpertiseAreas = request.ExpertiseAreas,
                Experience = request.Experience,
                ContactEmail = request.ContactEmail,
                ContactPhone = request.ContactPhone,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            var created = await _mentorRepo.AddAsync(mentor);

            return new CreateMentorResult
            {
                Success = true,
                MentorId = created.MentorId
            };
        }
    }
}

