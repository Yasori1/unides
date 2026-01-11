namespace Application.DTOs.Events.GetAll
{
    public class EventListItemDto
    {
        public int EtkinlikId { get; set; }
        public string EtkinlikAdi { get; set; }
        public string? ResimUrl { get; set; }
        public string? KisaAciklama { get; set; }
        public DateTime BaslangicTarihi { get; set; }
        public DateTime BitisTarihi { get; set; }
        public string? Konum { get; set; }
        public int ToplulukId { get; set; }
    }
}
