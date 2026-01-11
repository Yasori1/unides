using MediatR;
using Microsoft.Extensions.Logging;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;
using Unides.Persistence.Repositories;

namespace Application.Features.Events.Commands.Create
{
    public class CreateEventCommandHandler : IRequestHandler<CreateEventCommand, int>
    {
        private readonly IEventRepository _eventRepository;

        public CreateEventCommandHandler(IEventRepository eventRepository)
        {
            _eventRepository = eventRepository;
        }

        public async Task<int> Handle(CreateEventCommand request, CancellationToken cancellationToken)
        {
            var dto = request.Dto;

            var newEvent = new Event
            {
                EtkinlikAdi = dto.EtkinlikAdi,
                ResimUrl = dto.ResimUrl,
                KisaAciklama = dto.KisaAciklama,
                DetayliAciklama = dto.DetayliAciklama,
                BaslangicTarihi = dto.BaslangicTarihi.ToUniversalTime(),
                BitisTarihi = dto.BitisTarihi.ToUniversalTime(),
                Konum = dto.Konum,
                ToplulukId = dto.ToplulukId
            };

            await _eventRepository.AddAsync(newEvent);
            return newEvent.EtkinlikId;
        }
    }
}
