using MediatR;
using Unides.Application.DTOs.Announcements;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Announcements.Queries
{
    public class GetAnnouncementsQueryHandler : IRequestHandler<GetAnnouncementsQuery, IEnumerable<AnnouncementListItemDto>>
    {
        private readonly IAnnouncementRepository _repo;
        public GetAnnouncementsQueryHandler(IAnnouncementRepository repo) { _repo = repo; }

        public async Task<IEnumerable<AnnouncementListItemDto>> Handle(GetAnnouncementsQuery request, CancellationToken cancellationToken)
        {
            var list = await _repo.GetAllAsync();
            return list.Select(a => new AnnouncementListItemDto
            {
                AnnId = a.AnnId,
                Title = a.Title,
                ShortDescription = a.ShortDescription,
                AnnDate = a.AnnDate,
                ImagePath = a.ImagePath
            });
        }
    }
}


