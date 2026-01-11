using MediatR;
using Unides.Domain.Entities;

namespace Application.Features.Events.Queries.GetById
{
    public class GetEventByIdQuery : IRequest<Event?>
    {
        public int Id { get; }

        public GetEventByIdQuery(int id)
        {
            Id = id;
        }
    }
}
