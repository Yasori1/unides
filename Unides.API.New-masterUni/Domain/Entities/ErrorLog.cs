using System;

namespace Unides.Domain.Entities
{
    public class ErrorLog
    {
        public long Id { get; set; }
        public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
        public string Action { get; set; }
        public int? UserId { get; set; }
        public string? EntityType { get; set; }
        public int? EntityId { get; set; }
        public string ErrorMessage { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public Guid? CorrelationId { get; set; }
    }
}
