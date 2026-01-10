using MediatR;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Application.Features.Announcements.Commands
{
    public class UpdateAnnouncementCommand : IRequest
    {
        public int AnnId { get; set; }
        public string Title { get; set; }
        public string? ShortDescription { get; set; }
        public DateTime? AnnDate { get; set; }
        public string? Description { get; set; }
        public string? Link { get; set; }
        public string? ImagePath { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public int? AnnUpdatedAtUserId { get; set; }
    }

    public class UpdateAnnouncementCommandHandler : IRequestHandler<UpdateAnnouncementCommand>
    {
        private readonly IAnnouncementRepository _repo;
        public UpdateAnnouncementCommandHandler(IAnnouncementRepository repo) { _repo = repo; }

        public async Task Handle(UpdateAnnouncementCommand request, CancellationToken cancellationToken)
        {
            var existing = await _repo.GetByIdAsync(request.AnnId);
            if (existing == null) throw new Exception("Duyuru bulunamadı.");

            existing.Title = request.Title;
            existing.ShortDescription = request.ShortDescription;
            // AnnDate'i UTC'ye çevir (PostgreSQL için)
            existing.AnnDate = request.AnnDate.HasValue
                ? DateTime.SpecifyKind(request.AnnDate.Value, DateTimeKind.Utc)
                : (DateTime?)null;
            existing.Description = request.Description;
            existing.Link = request.Link;
            existing.ImagePath = request.ImagePath;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.AnnUpdatedAtUserId = request.AnnUpdatedAtUserId;

            await _repo.UpdateAsync(existing);
        }
    }
}


