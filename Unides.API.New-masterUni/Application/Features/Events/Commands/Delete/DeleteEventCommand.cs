using MediatR;

namespace Application.Features.Events.Commands.Delete
{
    public class DeleteEventCommand : IRequest<bool>
    {
        public int EventId { get; set; }

        public DeleteEventCommand(int eventId)
        {
            EventId = eventId;
        }
    }
}
