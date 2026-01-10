using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Commands.Mentors
{
    /// <summary>
    /// Mentörün kendi başvurusunu silmesi (soft delete - status = 'deleted')
    /// Mentör silinirse aktif atamaları da kapatılır
    /// </summary>
    public class DeleteMentorCommand : IRequest<DeleteMentorResult>
    {
        public int MentorId { get; set; }
        public int UserId { get; set; } // JWT'den gelecek
    }

    public class DeleteMentorResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class DeleteMentorCommandHandler : IRequestHandler<DeleteMentorCommand, DeleteMentorResult>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly ICommunityMentorAssignmentRepository _assignmentRepo;

        public DeleteMentorCommandHandler(
            IMentorRepository mentorRepo,
            ICommunityMentorAssignmentRepository assignmentRepo)
        {
            _mentorRepo = mentorRepo;
            _assignmentRepo = assignmentRepo;
        }

        public async Task<DeleteMentorResult> Handle(DeleteMentorCommand request, CancellationToken cancellationToken)
        {
            var mentor = await _mentorRepo.GetByIdAsync(request.MentorId);

            if (mentor == null)
            {
                return new DeleteMentorResult
                {
                    Success = false,
                    ErrorMessage = "Mentör başvurusu bulunamadı."
                };
            }

            // Sadece kendi başvurusunu silebilir
            if (mentor.UserId != request.UserId)
            {
                return new DeleteMentorResult
                {
                    Success = false,
                    ErrorMessage = "Bu başvuruyu silme yetkiniz yok."
                };
            }

            // Zaten silinmiş mi kontrol et
            if (mentor.Status == "deleted")
            {
                return new DeleteMentorResult
                {
                    Success = false,
                    ErrorMessage = "Bu başvuru zaten silinmiş."
                };
            }

            // Soft delete - status'u 'deleted' yap
            mentor.Status = "deleted";
            await _mentorRepo.UpdateAsync(mentor);

            // Aktif atamaları kapat (end_date set et)
            await _assignmentRepo.CloseAllAssignmentsByMentorIdAsync(request.MentorId);

            return new DeleteMentorResult { Success = true };
        }
    }
}

