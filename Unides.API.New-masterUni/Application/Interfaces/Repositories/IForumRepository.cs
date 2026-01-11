using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces.Repositories
{
    public interface IForumRepository
    {
        // Soru ekleme
        Task AddQuestionAsync(Question question);

        // Soru bulma (Cevap verirken sorunun varlığını kontrol etmek için şart)
        Task<Question> GetQuestionByIdAsync(int id);

        // Cevap ekleme
        Task AddAnswerAsync(Answer answer);
        // Tüm soru ve cevapları getir
        Task<List<Question>> GetAllQuestionsWithDetailsAsync();

        // Mevcut metotların altına ekle:
        Task UpdateQuestionAsync(Question question);
        Task DeleteQuestionAsync(Question question);

        // Cevap işlemleri için (Cevabı bulmamız lazım önce)
        Task<Answer> GetAnswerByIdAsync(int id);
        Task UpdateAnswerAsync(Answer answer);
        Task DeleteAnswerAsync(Answer answer);
    }
}
