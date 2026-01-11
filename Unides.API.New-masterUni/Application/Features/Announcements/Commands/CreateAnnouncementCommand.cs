using MediatR;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Application.Features.Announcements.Commands
{
    public class CreateAnnouncementCommand : IRequest<int>
    {
        public string Title { get; set; }
        public string? ShortDescription { get; set; }
        public DateTime? AnnDate { get; set; }
        public string? Description { get; set; }
        public string? Link { get; set; }
        public string? ImagePath { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public int? AnnCreatedAtUserId { get; set; }
        [System.Text.Json.Serialization.JsonIgnore]
        public int? AnnUpdatedAtUserId { get; set; }
    }

    public class CreateAnnouncementCommandHandler : IRequestHandler<CreateAnnouncementCommand, int>
    {
        private readonly IAnnouncementRepository _repo;
        public CreateAnnouncementCommandHandler(IAnnouncementRepository repo) { _repo = repo; }

        public async Task<int> Handle(CreateAnnouncementCommand request, CancellationToken cancellationToken)
        {
            var entity = new Announcement
            {
                Title = request.Title,
                ShortDescription = request.ShortDescription,
                // AnnDate'i UTC'ye çevir (PostgreSQL için)
                AnnDate = request.AnnDate.HasValue
                    ? DateTime.SpecifyKind(request.AnnDate.Value, DateTimeKind.Utc)
                    : (DateTime?)null,
                Description = request.Description,
                Link = request.Link,
                ImagePath = request.ImagePath,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                AnnCreatedAtUserId = request.AnnCreatedAtUserId,
                AnnUpdatedAtUserId = request.AnnUpdatedAtUserId
            };

            var created = await _repo.AddAsync(entity);
            return created.AnnId;
        }
    }
}


