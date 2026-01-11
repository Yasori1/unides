using Application.DTOs.Events.GetAll;
using MediatR;

namespace Application.Features.Events.Queries.GetAll
{
    // Bu Query hiçbir parametre almaz → tüm etkinlikleri listelemek için kullanılır.
    public class GetAllEventsQuery : IRequest<List<EventListItemDto>>
    {
    }
}
