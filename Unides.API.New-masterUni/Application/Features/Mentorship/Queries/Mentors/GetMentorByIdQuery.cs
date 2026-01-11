using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Queries.Mentors
{
    /// <summary>
    /// Mentör detayını getirir. Topluluk başkanı için eşleşme varsa iletişim bilgileri dahil.
    /// </summary>
    public class GetMentorByIdQuery : IRequest<MentorDetailDto?>
    {
        public int MentorId { get; set; }
        public int UserId { get; set; } // JWT'den gelecek
        public int UserRoleId { get; set; } // JWT'den gelecek
    }

    public class GetMentorByIdQueryHandler : IRequestHandler<GetMentorByIdQuery, MentorDetailDto?>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly ICityRepository _cityRepo;
        private readonly ICommunityRepository _communityRepo;
        private readonly ICommunityMentorAssignmentRepository _assignmentRepo;

        public GetMentorByIdQueryHandler(
            IMentorRepository mentorRepo,
            ICityRepository cityRepo,
            ICommunityRepository communityRepo,
            ICommunityMentorAssignmentRepository assignmentRepo)
        {
            _mentorRepo = mentorRepo;
            _cityRepo = cityRepo;
            _communityRepo = communityRepo;
            _assignmentRepo = assignmentRepo;
        }

        public async Task<MentorDetailDto?> Handle(GetMentorByIdQuery request, CancellationToken cancellationToken)
        {
            var mentor = await _mentorRepo.GetByIdAsync(request.MentorId);

            if (mentor == null || mentor.Status == "deleted")
            {
                return null;
            }

            var cities = await _cityRepo.GetAllAsync();
            var cityName = cities.FirstOrDefault(c => c.CitiesId == mentor.PreferredCity)?.Name ?? "";

            // İletişim bilgilerini gösterip göstermeyeceğimizi belirle
            bool showContactInfo = false;

            // Admin her zaman görebilir
            if (request.UserRoleId == 2)
            {
                showContactInfo = true;
            }
            // Topluluk başkanı ise aktif eşleşme var mı kontrol et
            else if (request.UserRoleId == 3)
            {
                var community = await _communityRepo.GetByPresidentUserIdAsync(request.UserId);
                if (community != null)
                {
                    showContactInfo = await _assignmentRepo.HasActiveAssignmentWithMentorAsync(community.Id, request.MentorId);
                }
            }
            // Mentörün kendisi ise gösterebilir
            else if (mentor.UserId == request.UserId)
            {
                showContactInfo = true;
            }

            return new MentorDetailDto
            {
                MentorId = mentor.MentorId,
                UserId = mentor.UserId,
                FullName = mentor.FullName,
                PreferredCity = mentor.PreferredCity,
                CityName = cityName,
                ExpertiseAreas = mentor.ExpertiseAreas,
                Experience = mentor.Experience,
                ContactEmail = showContactInfo ? mentor.ContactEmail : null,
                ContactPhone = showContactInfo ? mentor.ContactPhone : null,
                Status = mentor.Status,
                CreatedAt = mentor.CreatedAt
            };
        }
    }
}

