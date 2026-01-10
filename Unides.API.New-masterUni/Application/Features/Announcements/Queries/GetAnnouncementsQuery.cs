using MediatR;
using Unides.Application.DTOs.Announcements;

namespace Unides.Application.Features.Announcements.Queries
{
    public class GetAnnouncementsQuery : IRequest<IEnumerable<AnnouncementListItemDto>> { }
}


