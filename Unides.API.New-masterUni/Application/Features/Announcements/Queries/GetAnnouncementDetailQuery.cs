using MediatR;
using Unides.Application.DTOs.Announcements;

namespace Unides.Application.Features.Announcements.Queries
{
    public class GetAnnouncementDetailQuery : IRequest<AnnouncementDetailDto>
    {
        public int AnnId { get; set; }
        public GetAnnouncementDetailQuery(int annId) { AnnId = annId; }
    }
}


