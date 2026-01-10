using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Events.Create
{
    public class CreateEventDto
    {
        public string EtkinlikAdi { get; set; }
        public string? ResimUrl { get; set; }
        public string? KisaAciklama { get; set; }
        public string? DetayliAciklama { get; set; }
        public DateTime BaslangicTarihi { get; set; }
        public DateTime BitisTarihi { get; set; }
        public string? Konum { get; set; }
        public int ToplulukId { get; set; }
    }
}

