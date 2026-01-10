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
    /// Topluluk başkanı için onaylı mentörleri listeler (iletişim bilgileri gizli)
    /// </summary>
    public class GetApprovedMentorsQuery : IRequest<IEnumerable<ApprovedMentorListItemDto>>
    {
        public int UserRoleId { get; set; } // JWT'den gelecek
        public int? CityFilter { get; set; } // Opsiyonel şehir filtresi
    }

    public class GetApprovedMentorsQueryHandler : IRequestHandler<GetApprovedMentorsQuery, IEnumerable<ApprovedMentorListItemDto>>
    {
        private readonly IMentorRepository _mentorRepo;
        private readonly ICityRepository _cityRepo;

        public GetApprovedMentorsQueryHandler(IMentorRepository mentorRepo, ICityRepository cityRepo)
        {
            _mentorRepo = mentorRepo;
            _cityRepo = cityRepo;
        }

        public async Task<IEnumerable<ApprovedMentorListItemDto>> Handle(GetApprovedMentorsQuery request, CancellationToken cancellationToken)
        {
            // Sadece topluluk başkanları (role_id = 3) görebilir
            if (request.UserRoleId != 3)
            {
                return Enumerable.Empty<ApprovedMentorListItemDto>();
            }

            var mentors = request.CityFilter.HasValue
                ? await _mentorRepo.GetApprovedMentorsByCityAsync(request.CityFilter.Value)
                : await _mentorRepo.GetApprovedMentorsAsync();

            var cities = await _cityRepo.GetAllAsync();
            var cityDict = cities.ToDictionary(c => c.CitiesId, c => c.Name);

            return mentors.Select(m => new ApprovedMentorListItemDto
            {
                MentorId = m.MentorId,
                FullName = m.FullName,
                PreferredCity = m.PreferredCity,
                CityName = cityDict.TryGetValue(m.PreferredCity, out var cityName) ? cityName : "",
                ExpertiseAreas = m.ExpertiseAreas,
                Experience = m.Experience
                // ContactEmail ve ContactPhone YOK!
            });
        }
    }
}

