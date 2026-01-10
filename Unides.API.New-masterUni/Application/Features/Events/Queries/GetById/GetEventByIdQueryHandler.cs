using Application.Features.Events.Queries.GetById;
using MediatR;
using Unides.Domain.Entities;
using Unides.Persistence.Repositories;

namespace Application.Features.Events.Queries.GetById
{
    public class GetEventByIdQueryHandler : IRequestHandler<GetEventByIdQuery, Event?>
    {
        private readonly IEventRepository _eventRepository;

        public GetEventByIdQueryHandler(IEventRepository eventRepository)
        {
            _eventRepository = eventRepository;
        }

        public async Task<Event?> Handle(GetEventByIdQuery request, CancellationToken cancellationToken)
        {
            return await _eventRepository.GetByIdAsync(request.Id);
        }
    }
}
