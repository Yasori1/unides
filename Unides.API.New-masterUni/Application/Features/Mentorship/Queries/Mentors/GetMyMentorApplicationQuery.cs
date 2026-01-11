using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Queries.Mentors
{
    /// <summary>
    /// Kullanıcının kendi mentör başvurusunu görüntülemesi
    /// </summary>
    public class GetMyMentorApplicationQuery : IRequest<MyMentorApplicationDto?>
    {
        public int UserId { get; set; } // JWT'den gelecek
    }

    public class GetMyMentorApplicationQueryHandler : IRequestHandler<GetMyMentorApplicationQuery, MyMentorApplicationDto?>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly IMentorApplicationRepository _applicationRepo;
        private readonly ICityRepository _cityRepo;

        public GetMyMentorApplicationQueryHandler(
            IMentorRepository mentorRepo,
            IMentorApplicationRepository applicationRepo,
            ICityRepository cityRepo)
        {
            _mentorRepo = mentorRepo;
            _applicationRepo = applicationRepo;
            _cityRepo = cityRepo;
        }

        public async Task<MyMentorApplicationDto?> Handle(GetMyMentorApplicationQuery request, CancellationToken cancellationToken)
        {
            var mentor = await _mentorRepo.GetByUserIdAsync(request.UserId);

            if (mentor == null || mentor.Status == "deleted")
            {
                return null;
            }

            var cities = await _cityRepo.GetAllAsync();
            var cityName = cities.FirstOrDefault(c => c.CitiesId == mentor.PreferredCity)?.Name ?? "";

            // Admin'in karar notunu al (varsa)
            string? decisionNote = null;
            if (mentor.Status == "approved" || mentor.Status == "rejected")
            {
                var latestApplication = await _applicationRepo.GetLatestByMentorIdAsync(mentor.MentorId);
                decisionNote = latestApplication?.DecisionNote;
            }

            return new MyMentorApplicationDto
            {
                MentorId = mentor.MentorId,
                FullName = mentor.FullName,
                PreferredCity = mentor.PreferredCity,
                CityName = cityName,
                ExpertiseAreas = mentor.ExpertiseAreas,
                Experience = mentor.Experience,
                ContactEmail = mentor.ContactEmail,
                ContactPhone = mentor.ContactPhone,
                Status = mentor.Status,
                CreatedAt = mentor.CreatedAt,
                DecisionNote = decisionNote
            };
        }
    }
}

