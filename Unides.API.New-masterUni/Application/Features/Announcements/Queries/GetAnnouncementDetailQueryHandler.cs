using MediatR;
using Unides.Application.DTOs.Announcements;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Announcements.Queries
{
    public class GetAnnouncementDetailQueryHandler : IRequestHandler<GetAnnouncementDetailQuery, AnnouncementDetailDto>
    {
        private readonly IAnnouncementRepository _repo;
        public GetAnnouncementDetailQueryHandler(IAnnouncementRepository repo) { _repo = repo; }

        public async Task<AnnouncementDetailDto> Handle(GetAnnouncementDetailQuery request, CancellationToken cancellationToken)
        {
            var a = await _repo.GetByIdAsync(request.AnnId);
            if (a == null) throw new Exception("Duyuru bulunamadı.");
            return new AnnouncementDetailDto
            {
                AnnId = a.AnnId,
                Title = a.Title,
                ShortDescription = a.ShortDescription,
                EventDate = a.AnnDate,
                Description = a.Description,
                Link = a.Link,
                ImagePath = a.ImagePath
            };
        }
    }
}


