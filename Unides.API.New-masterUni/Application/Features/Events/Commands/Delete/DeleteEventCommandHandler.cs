using MediatR;
using Unides.Application.Interfaces.Repositories;
using Unides.Persistence.Repositories;

namespace Application.Features.Events.Commands.Delete
{
    public class DeleteEventCommandHandler : IRequestHandler<DeleteEventCommand, bool>
    {
        private readonly IEventRepository _eventRepository;

        public DeleteEventCommandHandler(IEventRepository eventRepository)
        {
            _eventRepository = eventRepository;
        }

        public async Task<bool> Handle(DeleteEventCommand request, CancellationToken cancellationToken)
        {
            var eventEntity = await _eventRepository.GetByIdAsync(request.EventId);

            if (eventEntity == null)
                throw new Exception("Etkinlik bulunamadı.");

            await _eventRepository.DeleteAsync(eventEntity);

            return true;
        }
    }
}
