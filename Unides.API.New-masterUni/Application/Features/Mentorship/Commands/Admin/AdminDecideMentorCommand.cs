using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Application.Features.Mentorship.Commands.Admin
{
    /// <summary>
    /// Admin'in (GSB - role_id = 2) mentör başvurusunu onaylaması veya reddetmesi
    /// </summary>
    public class AdminDecideMentorCommand : IRequest<AdminDecideMentorResult>
    {
        public int MentorId { get; set; }
        public int AdminId { get; set; } // JWT'den gelecek
        public int AdminRoleId { get; set; } // JWT'den gelecek
        public string Decision { get; set; } = string.Empty; // "approved" veya "rejected"
        public string? DecisionNote { get; set; }
    }

    public class AdminDecideMentorResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class AdminDecideMentorCommandHandler : IRequestHandler<AdminDecideMentorCommand, AdminDecideMentorResult>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly IMentorApplicationRepository _applicationRepo;

        public AdminDecideMentorCommandHandler(
            IMentorRepository mentorRepo,
            IMentorApplicationRepository applicationRepo)
        {
            _mentorRepo = mentorRepo;
            _applicationRepo = applicationRepo;
        }

        public async Task<AdminDecideMentorResult> Handle(AdminDecideMentorCommand request, CancellationToken cancellationToken)
        {
            // 1. Sadece Admin (role_id = 2) karar verebilir
            if (request.AdminRoleId != 2)
            {
                return new AdminDecideMentorResult
                {
                    Success = false,
                    ErrorMessage = "Bu işlem için yetkiniz yok."
                };
            }

            // 2. Karar geçerli mi kontrol et
            var decision = request.Decision.ToLower();
            if (decision != "approved" && decision != "rejected")
            {
                return new AdminDecideMentorResult
                {
                    Success = false,
                    ErrorMessage = "Geçersiz karar. 'approved' veya 'rejected' olmalıdır."
                };
            }

            // 3. Mentör başvurusunu bul
            var mentor = await _mentorRepo.GetByIdAsync(request.MentorId);
            if (mentor == null)
            {
                return new AdminDecideMentorResult
                {
                    Success = false,
                    ErrorMessage = "Mentör başvurusu bulunamadı."
                };
            }

            // 4. Sadece pending durumundaki başvurular değerlendirilebilir
            if (mentor.Status != "pending")
            {
                return new AdminDecideMentorResult
                {
                    Success = false,
                    ErrorMessage = "Bu başvuru zaten değerlendirilmiş."
                };
            }

            // 5. Mentör durumunu güncelle
            mentor.Status = decision;
            await _mentorRepo.UpdateAsync(mentor);

            // 6. Karar kaydını oluştur
            var application = new MentorApplication
            {
                MentorId = request.MentorId,
                AdminId = request.AdminId,
                Decision = decision,
                DecisionNote = request.DecisionNote,
                DecidedAt = DateTime.UtcNow
            };
            await _applicationRepo.AddAsync(application);

            return new AdminDecideMentorResult { Success = true };
        }
    }
}

