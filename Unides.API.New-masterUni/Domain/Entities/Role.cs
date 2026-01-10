using System.Collections.Generic;

namespace Unides.Domain.Entities
{
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; } // Örn: "Uye", "GsbPersonel", "ToplulukBaskani"
        public ICollection<User> Users { get; set; }
    }
}