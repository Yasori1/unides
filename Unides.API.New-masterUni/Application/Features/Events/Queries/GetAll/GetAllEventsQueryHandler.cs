using Application.DTOs.Events.GetAll;
using MediatR;
using Unides.Persistence.Repositories;

namespace Application.Features.Events.Queries.GetAll
{
    public class GetAllEventsQueryHandler : IRequestHandler<GetAllEventsQuery, List<EventListItemDto>>
    {
        private readonly IEventRepository _repository;

        public GetAllEventsQueryHandler(IEventRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<EventListItemDto>> Handle(GetAllEventsQuery request, CancellationToken cancellationToken)
        {
            // 1) Verileri çek
            var events = await _repository.GetListAsync();

            // 2) DTO'ya map et → DetayliAciklama burada özellikle döndürülmüyor
            return events.Select(e => new EventListItemDto
            {
                EtkinlikId = e.EtkinlikId,
                EtkinlikAdi = e.EtkinlikAdi,
                ResimUrl = e.ResimUrl,
                KisaAciklama = e.KisaAciklama,
                BaslangicTarihi = e.BaslangicTarihi,
                BitisTarihi = e.BitisTarihi,
                Konum = e.Konum,
                ToplulukId = e.ToplulukId
            })
            .ToList();
        }
    }
}
