using MediatR;
using Unides.Persistence.Repositories;

namespace Application.Features.Events.Commands.Update
{
    public class UpdateEventCommandHandler : IRequestHandler<UpdateEventCommand, int>
    {
        private readonly IEventRepository _eventRepository;

        public UpdateEventCommandHandler(IEventRepository eventRepository)
        {
            _eventRepository = eventRepository;
        }

        public async Task<int> Handle(UpdateEventCommand request, CancellationToken cancellationToken)
        {
            var entity = await _eventRepository.GetByIdAsync(request.Id);

            if (entity == null)
                throw new Exception("Etkinlik bulunamadı.");

            // Alanları güncelle
            entity.EtkinlikAdi = request.Dto.EtkinlikAdi;
            entity.ResimUrl = request.Dto.ResimUrl;
            entity.KisaAciklama = request.Dto.KisaAciklama;
            entity.DetayliAciklama = request.Dto.DetayliAciklama;
            entity.BaslangicTarihi = request.Dto.BaslangicTarihi.ToUniversalTime();
            entity.BitisTarihi = request.Dto.BitisTarihi.ToUniversalTime();
            entity.Konum = request.Dto.Konum;

            await _eventRepository.UpdateAsync(entity);

            return entity.EtkinlikId;
        }
    }
}
