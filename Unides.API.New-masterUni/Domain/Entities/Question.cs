using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unides.Domain.Entities;

namespace Domain.Entities
{

    [Table("questions")]
    public class Question
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("title")]
        [MaxLength(200)]
        public string? Title { get; set; } // Sorunun başlığı

        [Column("content")]
        public string? Content { get; set; } // Sorunun detaylı içeriği

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // İlişkiler
        [Column("user_id")]
        public int UserId { get; set; } // Soruyu soran kullanıcı

        [ForeignKey("UserId")]
        public User? User { get; set; } // Kullanıcı detayına erişmek için

        // Bir sorunun birden çok cevabı olabilir
        public List<Answer> Answers { get; set; } = new List<Answer>();
    }
}
