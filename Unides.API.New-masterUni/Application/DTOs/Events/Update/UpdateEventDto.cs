namespace Application.DTOs.Events.Update
{
    public class UpdateEventDto
    {
        public string EtkinlikAdi { get; set; }
        public string? ResimUrl { get; set; }
        public string? KisaAciklama { get; set; }
        public string? DetayliAciklama { get; set; }
        public DateTime BaslangicTarihi { get; set; }
        public DateTime BitisTarihi { get; set; }
        public string? Konum { get; set; }
    }
}
