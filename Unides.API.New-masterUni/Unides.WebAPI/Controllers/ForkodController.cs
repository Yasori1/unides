using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Unides.Application.Features.Forkod.Queries;
using Microsoft.AspNetCore.Authorization;

namespace Unides.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ForkodController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ForkodController(IMediator mediator)
        {
            _mediator = mediator;
        }

		[AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _mediator.Send(new GetForkodListQuery());
            return Ok(result);
        }
    }
}


