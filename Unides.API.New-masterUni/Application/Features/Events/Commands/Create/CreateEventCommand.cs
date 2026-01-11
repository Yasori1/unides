using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Events.Create;
using MediatR;

namespace Application.Features.Events.Commands.Create
{
    public class CreateEventCommand : IRequest<int>
    {
        public CreateEventDto Dto { get; set; }

        public CreateEventCommand(CreateEventDto dto)
        {
            Dto = dto;
        }
    }
}




