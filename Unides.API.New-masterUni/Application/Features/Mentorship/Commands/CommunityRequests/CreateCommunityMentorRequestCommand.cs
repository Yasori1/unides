using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Application.Features.Mentorship.Commands.CommunityRequests
{
    /// <summary>
    /// Topluluk başkanının (role_id = 3) onaylı bir mentöre başvuru yapması
    /// </summary>
    public class CreateCommunityMentorRequestCommand : IRequest<CreateCommunityMentorRequestResult>
    {
        public int UserId { get; set; } // JWT'den gelecek (topluluk başkanı)
        public int UserRoleId { get; set; } // JWT'den gelecek
        public int MentorId { get; set; }
    }

    public class CreateCommunityMentorRequestResult
    {
        public bool Success { get; set; }
        public int? RequestId { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class CreateCommunityMentorRequestCommandHandler : IRequestHandler<CreateCommunityMentorRequestCommand, CreateCommunityMentorRequestResult>
    {
        private readonly ICommunityMentorRequestRepository _requestRepo;
        private readonly IMentorRepository _mentorRepo;
        private readonly ICommunityRepository _communityRepo;

        public CreateCommunityMentorRequestCommandHandler(
            ICommunityMentorRequestRepository requestRepo,
            IMentorRepository mentorRepo,
            ICommunityRepository communityRepo)
        {
            _requestRepo = requestRepo;
            _mentorRepo = mentorRepo;
            _communityRepo = communityRepo;
        }

        public async Task<CreateCommunityMentorRequestResult> Handle(CreateCommunityMentorRequestCommand request, CancellationToken cancellationToken)
        {
            // 1. Sadece topluluk başkanları (role_id = 3) başvuru yapabilir
            if (request.UserRoleId != 3)
            {
                return new CreateCommunityMentorRequestResult
                {
                    Success = false,
                    ErrorMessage = "Sadece topluluk başkanları mentör talebinde bulunabilir."
                };
            }

            // 2. Topluluk başkanının topluluğunu bul
            var community = await _communityRepo.GetByPresidentUserIdAsync(request.UserId);
            if (community == null)
            {
                return new CreateCommunityMentorRequestResult
                {
                    Success = false,
                    ErrorMessage = "Başkanlık yaptığınız bir topluluk bulunamadı."
                };
            }

            // 3. Mentör mevcut ve onaylı mı kontrol et
            var mentor = await _mentorRepo.GetByIdAsync(request.MentorId);
            if (mentor == null)
            {
                return new CreateCommunityMentorRequestResult
                {
                    Success = false,
                    ErrorMessage = "Mentör bulunamadı."
                };
            }

            if (mentor.Status != "approved")
            {
                return new CreateCommunityMentorRequestResult
                {
                    Success = false,
                    ErrorMessage = "Bu mentör henüz onaylanmamış."
                };
            }

            // 4. Aynı mentöre bekleyen başvuru var mı kontrol et
            var hasPendingRequest = await _requestRepo.HasPendingRequestAsync(community.Id, request.MentorId);
            if (hasPendingRequest)
            {
                return new CreateCommunityMentorRequestResult
                {
                    Success = false,
                    ErrorMessage = "Bu mentöre zaten bekleyen bir başvurunuz var."
                };
            }

            // 5. Başvuruyu oluştur
            var mentorRequest = new CommunityMentorRequest
            {
                CommunityId = community.Id,
                MentorId = request.MentorId,
                PresidentUserId = request.UserId,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            var created = await _requestRepo.AddAsync(mentorRequest);

            return new CreateCommunityMentorRequestResult
            {
                Success = true,
                RequestId = created.RequestId
            };
        }
    }
}

