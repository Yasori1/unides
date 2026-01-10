using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs
{
    public class CreateQuestionRequest
    {
        public string Title { get; set; }
        public string Content { get; set; }
    }

    // Cevap Verirken İstenen Veri
    public class CreateAnswerRequest
    {
        public int QuestionId { get; set; }
        public string Content { get; set; }
    }

    public class QuestionDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string AuthorName { get; set; } // Soran kişinin adı
        public DateTime CreatedAt { get; set; }
        public List<AnswerDto> Answers { get; set; } // Cevaplar listesi
    }

    public class AnswerDto
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public string AuthorName { get; set; } // Cevaplayan kişinin adı
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateQuestionRequest
    {
        public int QuestionId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
    }

    public class UpdateAnswerRequest
    {
        public int AnswerId { get; set; }
        public string Content { get; set; }
    }
}

