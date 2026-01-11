using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Application.Features.Mentorship.Commands.CommunityRequests
{
    /// <summary>
    /// Mentörün (role_id = 4 veya onaylı mentör) gelen başvuruyu kabul veya reddetmesi
    /// Kabul edilirse eski aktif atama kapatılır ve yeni atama oluşturulur
    /// </summary>
    public class MentorDecideRequestCommand : IRequest<MentorDecideRequestResult>
    {
        public int RequestId { get; set; }
        public int UserId { get; set; } // JWT'den gelecek (mentör kullanıcısı)
        public string Decision { get; set; } = string.Empty; // "accepted" veya "rejected"
    }

    public class MentorDecideRequestResult
    {
        public bool Success { get; set; }
        public int? AssignmentId { get; set; } // Kabul edilirse atama ID'si
        public string? ErrorMessage { get; set; }
    }

    public class MentorDecideRequestCommandHandler : IRequestHandler<MentorDecideRequestCommand, MentorDecideRequestResult>
    {
        private readonly ICommunityMentorRequestRepository _requestRepo;
        private readonly IMentorRepository _mentorRepo;
        private readonly ICommunityMentorAssignmentRepository _assignmentRepo;

        public MentorDecideRequestCommandHandler(
            ICommunityMentorRequestRepository requestRepo,
            IMentorRepository mentorRepo,
            ICommunityMentorAssignmentRepository assignmentRepo)
        {
            _requestRepo = requestRepo;
            _mentorRepo = mentorRepo;
            _assignmentRepo = assignmentRepo;
        }

        public async Task<MentorDecideRequestResult> Handle(MentorDecideRequestCommand request, CancellationToken cancellationToken)
        {
            // 1. Karar geçerli mi kontrol et
            var decision = request.Decision.ToLower();
            if (decision != "accepted" && decision != "rejected")
            {
                return new MentorDecideRequestResult
                {
                    Success = false,
                    ErrorMessage = "Geçersiz karar. 'accepted' veya 'rejected' olmalıdır."
                };
            }

            // 2. Başvuruyu bul
            var mentorRequest = await _requestRepo.GetByIdAsync(request.RequestId);
            if (mentorRequest == null)
            {
                return new MentorDecideRequestResult
                {
                    Success = false,
                    ErrorMessage = "Başvuru bulunamadı."
                };
            }

            // 3. Kullanıcının bu mentör olup olmadığını kontrol et
            var mentor = await _mentorRepo.GetByIdAsync(mentorRequest.MentorId);
            if (mentor == null || mentor.UserId != request.UserId)
            {
                return new MentorDecideRequestResult
                {
                    Success = false,
                    ErrorMessage = "Bu başvuruyu değerlendirme yetkiniz yok."
                };
            }

            // 4. Başvuru pending durumunda mı kontrol et
            if (mentorRequest.Status != "pending")
            {
                return new MentorDecideRequestResult
                {
                    Success = false,
                    ErrorMessage = "Bu başvuru zaten değerlendirilmiş."
                };
            }

            // 5. Başvuru durumunu güncelle
            mentorRequest.Status = decision;
            mentorRequest.DecidedAt = DateTime.UtcNow;
            await _requestRepo.UpdateAsync(mentorRequest);

            // 6. Kabul edildiyse atama oluştur
            if (decision == "accepted")
            {
                // Eski aktif atamayı kapat
                await _assignmentRepo.CloseActiveAssignmentAsync(mentorRequest.CommunityId);

                // Yeni atama oluştur
                var assignment = new CommunityMentorAssignment
                {
                    CommunityId = mentorRequest.CommunityId,
                    MentorId = mentorRequest.MentorId,
                    StartDate = DateTime.UtcNow,
                    EndDate = null // Aktif atama
                };

                var createdAssignment = await _assignmentRepo.AddAsync(assignment);

                return new MentorDecideRequestResult
                {
                    Success = true,
                    AssignmentId = createdAssignment.AssignmentId
                };
            }

            return new MentorDecideRequestResult { Success = true };
        }
    }
}

