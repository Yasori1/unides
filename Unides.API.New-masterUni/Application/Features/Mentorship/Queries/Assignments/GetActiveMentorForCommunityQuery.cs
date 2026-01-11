using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Queries.Assignments
{
    /// <summary>
    /// Topluluk başkanının kendi topluluğunun aktif mentörünü görüntülemesi (iletişim bilgileri dahil)
    /// </summary>
    public class GetActiveMentorForCommunityQuery : IRequest<ActiveMentorForCommunityDto?>
    {
        public int UserId { get; set; } // JWT'den gelecek
        public int UserRoleId { get; set; } // JWT'den gelecek
    }

    public class GetActiveMentorForCommunityQueryHandler : IRequestHandler<GetActiveMentorForCommunityQuery, ActiveMentorForCommunityDto?>
    {
        private readonly ICommunityRepository _communityRepo;
        private readonly ICommunityMentorAssignmentRepository _assignmentRepo;
        private readonly IMentorRepository _mentorRepo;
        private readonly ICityRepository _cityRepo;

        public GetActiveMentorForCommunityQueryHandler(
            ICommunityRepository communityRepo,
            ICommunityMentorAssignmentRepository assignmentRepo,
            IMentorRepository mentorRepo,
            ICityRepository cityRepo)
        {
            _communityRepo = communityRepo;
            _assignmentRepo = assignmentRepo;
            _mentorRepo = mentorRepo;
            _cityRepo = cityRepo;
        }

        public async Task<ActiveMentorForCommunityDto?> Handle(GetActiveMentorForCommunityQuery request, CancellationToken cancellationToken)
        {
            // Sadece topluluk başkanları (role_id = 3) görebilir
            if (request.UserRoleId != 3)
            {
                return null;
            }

            var community = await _communityRepo.GetByPresidentUserIdAsync(request.UserId);
            if (community == null)
            {
                return null;
            }

            var activeAssignment = await _assignmentRepo.GetActiveAssignmentByCommunityIdAsync(community.Id);
            if (activeAssignment == null)
            {
                return null;
            }

            var mentor = await _mentorRepo.GetByIdAsync(activeAssignment.MentorId);
            if (mentor == null)
            {
                return null;
            }

            var cities = await _cityRepo.GetAllAsync();
            var cityName = cities.FirstOrDefault(c => c.CitiesId == mentor.PreferredCity)?.Name ?? "";

            // Eşleşme kabul edildiği için iletişim bilgileri gösterilir
            return new ActiveMentorForCommunityDto
            {
                AssignmentId = activeAssignment.AssignmentId,
                MentorId = mentor.MentorId,
                MentorFullName = mentor.FullName,
                CityName = cityName,
                ExpertiseAreas = mentor.ExpertiseAreas,
                Experience = mentor.Experience,
                ContactEmail = mentor.ContactEmail ?? "",
                ContactPhone = mentor.ContactPhone ?? "",
                StartDate = activeAssignment.StartDate
            };
        }
    }
}

