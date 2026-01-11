using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Unides.Application.DTOs.Mentorship;
using Unides.Application.Features.Mentorship.Queries.Cities;

namespace Unides.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CitiesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CitiesController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Tüm şehirleri listeler (81 il)
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<CityDto>>> GetAllCities()
        {
            var result = await _mediator.Send(new GetAllCitiesQuery());
            return Ok(result);
        }
    }
}

