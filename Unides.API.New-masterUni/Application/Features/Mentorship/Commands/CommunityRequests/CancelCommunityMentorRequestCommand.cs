using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Commands.CommunityRequests
{
    /// <summary>
    /// Topluluk başkanının bekleyen başvurusunu iptal etmesi
    /// </summary>
    public class CancelCommunityMentorRequestCommand : IRequest<CancelCommunityMentorRequestResult>
    {
        public int RequestId { get; set; }
        public int UserId { get; set; } // JWT'den gelecek
    }

    public class CancelCommunityMentorRequestResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class CancelCommunityMentorRequestCommandHandler : IRequestHandler<CancelCommunityMentorRequestCommand, CancelCommunityMentorRequestResult>
    {
        private readonly ICommunityMentorRequestRepository _requestRepo;

        public CancelCommunityMentorRequestCommandHandler(ICommunityMentorRequestRepository requestRepo)
        {
            _requestRepo = requestRepo;
        }

        public async Task<CancelCommunityMentorRequestResult> Handle(CancelCommunityMentorRequestCommand request, CancellationToken cancellationToken)
        {
            var mentorRequest = await _requestRepo.GetByIdAsync(request.RequestId);

            if (mentorRequest == null)
            {
                return new CancelCommunityMentorRequestResult
                {
                    Success = false,
                    ErrorMessage = "Başvuru bulunamadı."
                };
            }

            // Sadece başvuruyu yapan iptal edebilir
            if (mentorRequest.PresidentUserId != request.UserId)
            {
                return new CancelCommunityMentorRequestResult
                {
                    Success = false,
                    ErrorMessage = "Bu başvuruyu iptal etme yetkiniz yok."
                };
            }

            // Sadece pending durumundaki başvurular iptal edilebilir
            if (mentorRequest.Status != "pending")
            {
                return new CancelCommunityMentorRequestResult
                {
                    Success = false,
                    ErrorMessage = "Sadece bekleyen başvurular iptal edilebilir."
                };
            }

            mentorRequest.Status = "cancelled";
            mentorRequest.DecidedAt = System.DateTime.UtcNow;
            await _requestRepo.UpdateAsync(mentorRequest);

            return new CancelCommunityMentorRequestResult { Success = true };
        }
    }
}

