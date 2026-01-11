using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Unides.Application.Features.Abouts.Queries;
using Microsoft.AspNetCore.Authorization;

namespace Unides.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AboutController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AboutController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<IActionResult> GetAbout()
        {
            // Handler'� tetikle
            var result = await _mediator.Send(new GetAboutQuery());
            return Ok(result);
        }
    }
}