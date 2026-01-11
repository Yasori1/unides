using MediatR;
using Unides.Application.DTOs;

namespace Unides.Application.Features.Abouts.Queries
{
    public class GetAboutQuery : IRequest<AboutDto>
    {
    }
}