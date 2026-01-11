using System;
using Application.Features.Events.Commands.Create;
using Application.Features.Events.Commands.Delete;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Application.Features.Events.Commands.Update;
using Application.Features.Events.Queries.GetById;
using Application.Features.Events.Queries.GetAll;
using Application.DTOs.Events.Create;
using Application.DTOs.Events.Update;

namespace Unides.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public EventsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // CREATE
        [Authorize(Policy = "CommunityAdminOnly")]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateEventDto dto)
        {
            var command = new CreateEventCommand(dto);
            var createdId = await _mediator.Send(command);
            return Ok(new { EventId = createdId });
        }

        // DELETE
        [Authorize(Policy = "CommunityAdminOnly")]
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var command = new DeleteEventCommand(id);
            var result = await _mediator.Send(command);

            return Ok(new { Deleted = result });
        }

        // UPDATE
        [Authorize(Policy = "CommunityAdminOnly")]
        [HttpPut("update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEventDto dto)
        {
            var command = new UpdateEventCommand(id, dto);
            var updatedId = await _mediator.Send(command);
            return Ok(new { Updated = updatedId });
        }

        // GET ALL
        [HttpGet("all")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var events = await _mediator.Send(new GetAllEventsQuery());
                return Ok(events);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Etkinlikler yüklenirken bir hata oluştu.", error = ex.Message });
            }
        }

        // GET BY ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _mediator.Send(new GetEventByIdQuery(id));

            if (result == null)
                return NotFound(new { message = "Etkinlik bulunamadı." });

            return Ok(result);
        }


    }
}
