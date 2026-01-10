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
    [Table("answers")]
    public class Answer
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("content")]
        public string? Content { get; set; } // Cevap metni

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // İlişkiler 
        [Column("question_id")]
        public int QuestionId { get; set; } // Hangi soruya yazıldı?

        [ForeignKey("QuestionId")]
        public Question? Question { get; set; } // Soruyu geri çağırmak için (JsonIgnore gerekebilir)

        [Column("user_id")]
        public int UserId { get; set; } // Cevabı yazan kim?

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
