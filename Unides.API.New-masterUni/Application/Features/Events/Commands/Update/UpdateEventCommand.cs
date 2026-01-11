using Application.DTOs.Events.Update;
using MediatR;

namespace Application.Features.Events.Commands.Update
{
    public class UpdateEventCommand : IRequest<int>
    {
        public int Id { get; set; }
        public UpdateEventDto Dto { get; set; }

        public UpdateEventCommand(int id, UpdateEventDto dto)
        {
            Id = id;
            Dto = dto;
        }
    }
}
