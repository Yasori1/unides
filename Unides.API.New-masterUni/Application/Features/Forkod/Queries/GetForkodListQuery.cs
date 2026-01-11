using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs;
using Unides.Application.Interfaces.Repositories;

namespace Unides.Application.Features.Forkod.Queries
{
    public class GetForkodListQuery : IRequest<List<ForkodDto>>
    {
    }

    public class GetForkodListQueryHandler : IRequestHandler<GetForkodListQuery, List<ForkodDto>>
    {
        private readonly IForkodRepository _repo;

        public GetForkodListQueryHandler(IForkodRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<ForkodDto>> Handle(GetForkodListQuery request, CancellationToken cancellationToken)
        {
            var list = await _repo.GetAllAsync();
            return list.Select(x => new ForkodDto
            {
                OgrenciNo = x.OgrenciNo,
                Ad = x.Ad,
                Soyad = x.Soyad,
                BolumAdi = x.BolumAdi,
                Sinif = x.Sinif,
                Gpa = x.Gpa
            }).ToList();
        }
    }
}


