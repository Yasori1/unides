using Microsoft.EntityFrameworkCore;
using Unides.Application.Interfaces.Repositories;
using Unides.Domain.Entities;

namespace Unides.Persistence.Repositories
{
    public class AboutRepository : IAboutRepository
    {
        private readonly UnidesDbContext _db;

        public AboutRepository(UnidesDbContext db)
        {
            _db = db;
        }

        public async Task<About> GetAboutInfoAsync()
        {
            var about = await _db.Abouts.AsNoTracking().FirstOrDefaultAsync();
            return about ?? new About
            {
                Title = "ÜNİDES Hakkında",
                Description = "Üniversite toplulukları dijital platformu.",
                WebsiteLink = "https://unides.gsb.gov.tr"
            };
        }
    }
}


