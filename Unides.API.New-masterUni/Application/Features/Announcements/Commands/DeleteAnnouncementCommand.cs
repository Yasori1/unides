using MediatR;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Announcements.Commands
{
    public class DeleteAnnouncementCommand : IRequest
    {
        public int AnnId { get; set; }
        public DeleteAnnouncementCommand(int annId) { AnnId = annId; }
    }

    public class DeleteAnnouncementCommandHandler : IRequestHandler<DeleteAnnouncementCommand>
    {
        private readonly IAnnouncementRepository _repo;
        public DeleteAnnouncementCommandHandler(IAnnouncementRepository repo) { _repo = repo; }

        public async Task Handle(DeleteAnnouncementCommand request, CancellationToken cancellationToken)
        {
            await _repo.DeleteAsync(request.AnnId);
        }
    }
}


