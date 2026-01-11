using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Abouts.Queries
{
    public class GetAboutQueryHandler : IRequestHandler<GetAboutQuery, AboutDto>
    {
        private readonly IAboutRepository _repo;

        public GetAboutQueryHandler(IAboutRepository repo)
        {
            _repo = repo;
        }

        public async Task<AboutDto> Handle(GetAboutQuery request, CancellationToken cancellationToken)
        {
            var data = await _repo.GetAboutInfoAsync();

            return new AboutDto
            {
                Title = data.Title,
                Description = data.Description,
                Link = data.WebsiteLink
            };
        }
    }
}