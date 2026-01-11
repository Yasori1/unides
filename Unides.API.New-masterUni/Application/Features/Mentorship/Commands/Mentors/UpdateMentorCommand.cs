using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Commands.Mentors
{
    /// <summary>
    /// Mentörün kendi başvurusunu güncellemesi (sadece pending durumunda)
    /// </summary>
    public class UpdateMentorCommand : IRequest<UpdateMentorResult>
    {
        public int MentorId { get; set; }
        public int UserId { get; set; } // JWT'den gelecek - sadece kendi başvurusunu güncelleyebilir
        public string? FullName { get; set; }
        public int? PreferredCity { get; set; }
        public List<string>? ExpertiseAreas { get; set; }
        public string? Experience { get; set; }
        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class UpdateMentorResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class UpdateMentorCommandHandler : IRequestHandler<UpdateMentorCommand, UpdateMentorResult>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly ICityRepository _cityRepo;

        public UpdateMentorCommandHandler(IMentorRepository mentorRepo, ICityRepository cityRepo)
        {
            _mentorRepo = mentorRepo;
            _cityRepo = cityRepo;
        }

        public async Task<UpdateMentorResult> Handle(UpdateMentorCommand request, CancellationToken cancellationToken)
        {
            var mentor = await _mentorRepo.GetByIdAsync(request.MentorId);

            if (mentor == null)
            {
                return new UpdateMentorResult
                {
                    Success = false,
                    ErrorMessage = "Mentör başvurusu bulunamadı."
                };
            }

            // Sadece kendi başvurusunu güncelleyebilir
            if (mentor.UserId != request.UserId)
            {
                return new UpdateMentorResult
                {
                    Success = false,
                    ErrorMessage = "Bu başvuruyu güncelleme yetkiniz yok."
                };
            }

            // Sadece pending durumunda güncelleme yapılabilir
            if (mentor.Status != "pending")
            {
                return new UpdateMentorResult
                {
                    Success = false,
                    ErrorMessage = "Sadece bekleyen başvurular güncellenebilir."
                };
            }

            // Şehir değiştiriliyorsa geçerli mi kontrol et
            if (request.PreferredCity.HasValue)
            {
                var cityExists = await _cityRepo.ExistsAsync(request.PreferredCity.Value);
                if (!cityExists)
                {
                    return new UpdateMentorResult
                    {
                        Success = false,
                        ErrorMessage = "Geçersiz şehir seçimi."
                    };
                }
                mentor.PreferredCity = request.PreferredCity.Value;
            }

            // Diğer alanları güncelle
            if (!string.IsNullOrEmpty(request.FullName))
                mentor.FullName = request.FullName;

            if (request.ExpertiseAreas != null)
                mentor.ExpertiseAreas = request.ExpertiseAreas;

            if (request.Experience != null)
                mentor.Experience = request.Experience;

            if (request.ContactEmail != null)
                mentor.ContactEmail = request.ContactEmail;

            if (request.ContactPhone != null)
                mentor.ContactPhone = request.ContactPhone;

            await _mentorRepo.UpdateAsync(mentor);

            return new UpdateMentorResult { Success = true };
        }
    }
}

