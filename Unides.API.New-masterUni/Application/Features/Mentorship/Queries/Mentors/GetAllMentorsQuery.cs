using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Queries.Mentors
{
    /// <summary>
    /// Admin için tüm mentör başvurularını listeler (tüm bilgiler dahil)
    /// </summary>
    public class GetAllMentorsQuery : IRequest<IEnumerable<MentorListItemDto>>
    {
        public int AdminRoleId { get; set; } // JWT'den gelecek
        public string? StatusFilter { get; set; } // Opsiyonel filtre: pending, approved, rejected
    }

    public class GetAllMentorsQueryHandler : IRequestHandler<GetAllMentorsQuery, IEnumerable<MentorListItemDto>>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly ICityRepository _cityRepo;

        public GetAllMentorsQueryHandler(IMentorRepository mentorRepo, ICityRepository cityRepo)
        {
            _mentorRepo = mentorRepo;
            _cityRepo = cityRepo;
        }

        public async Task<IEnumerable<MentorListItemDto>> Handle(GetAllMentorsQuery request, CancellationToken cancellationToken)
        {
            // Sadece Admin (role_id = 2) görebilir
            if (request.AdminRoleId != 2)
            {
                return Enumerable.Empty<MentorListItemDto>();
            }

            var mentors = string.IsNullOrEmpty(request.StatusFilter)
                ? await _mentorRepo.GetAllAsync()
                : await _mentorRepo.GetByStatusAsync(request.StatusFilter);

            var cities = await _cityRepo.GetAllAsync();
            var cityDict = cities.ToDictionary(c => c.CitiesId, c => c.Name);

            return mentors
                .Where(m => m.Status != "deleted") // Silinmişleri gösterme
                .Select(m => new MentorListItemDto
                {
                    MentorId = m.MentorId,
                    UserId = m.UserId,
                    FullName = m.FullName,
                    PreferredCity = m.PreferredCity,
                    CityName = cityDict.TryGetValue(m.PreferredCity, out var cityName) ? cityName : "",
                    ExpertiseAreas = m.ExpertiseAreas,
                    Experience = m.Experience,
                    ContactEmail = m.ContactEmail,
                    ContactPhone = m.ContactPhone,
                    Status = m.Status,
                    CreatedAt = m.CreatedAt
                });
        }
    }
}

