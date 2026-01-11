using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Mentorship.Queries.Cities
{
    /// <summary>
    /// Tüm şehirleri listeler
    /// </summary>
    public class GetAllCitiesQuery : IRequest<IEnumerable<CityDto>>
    {
    }

    public class GetAllCitiesQueryHandler : IRequestHandler<GetAllCitiesQuery, IEnumerable<CityDto>>
    {
        private readonly ICityRepository _cityRepo;

        public GetAllCitiesQueryHandler(ICityRepository cityRepo)
        {
            _cityRepo = cityRepo;
        }

        public async Task<IEnumerable<CityDto>> Handle(GetAllCitiesQuery request, CancellationToken cancellationToken)
        {
            var cities = await _cityRepo.GetAllAsync();

            return cities
                .OrderBy(c => c.CitiesId)
                .Select(c => new CityDto
                {
                    CitiesId = c.CitiesId,
                    Name = c.Name
                });
        }
    }
}

