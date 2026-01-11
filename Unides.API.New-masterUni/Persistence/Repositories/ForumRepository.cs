using Application.Interfaces.Repositories;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Unides.Persistence;

namespace Persistence.Repositories
{
    public class ForumRepository : IForumRepository
    {
        private readonly UnidesDbContext _db;

        public ForumRepository(UnidesDbContext db)
        {
            _db = db;
        }

        // Soru Ekleme
        public async Task AddQuestionAsync(Question question)
        {
            await _db.Questions.AddAsync(question);
            await _db.SaveChangesAsync();
        }

        // ID'ye göre Soru Getirme (Cevap verirken kontrol etmek için)
        public async Task<Question> GetQuestionByIdAsync(int id)
        {
            // FindAsync Primary Key üzerinden en hızlı aramayı yapar
            return await _db.Questions.FindAsync(id);
        }

        // Cevap Ekleme
        public async Task AddAnswerAsync(Answer answer)
        {
            await _db.Answers.AddAsync(answer);
            await _db.SaveChangesAsync();
        }

        public async Task<List<Question>> GetAllQuestionsWithDetailsAsync()
        {
            return await _db.Questions
                .Include(q => q.User)       // Soruyu soran kullanıcıyı getir
                .Include(q => q.Answers)    // Sorunun cevaplarını getir
                    .ThenInclude(a => a.User) // Cevabı yazan kullanıcıyı getir
                .OrderByDescending(q => q.CreatedAt) // En yeniler en üstte
                .ToListAsync();
        }
        // Soru Güncelleme
        public async Task UpdateQuestionAsync(Question question)
        {
            _db.Questions.Update(question);
            await _db.SaveChangesAsync();
        }

        // Soru Silme
        public async Task DeleteQuestionAsync(Question question)
        {
            _db.Questions.Remove(question);
            await _db.SaveChangesAsync();
        }

        // ID'ye göre Cevap Getirme (Silmeden/Düzenlemeden önce kontrol için)
        public async Task<Answer> GetAnswerByIdAsync(int id)
        {
            return await _db.Answers.FindAsync(id);
        }

        // Cevap Güncelleme
        public async Task UpdateAnswerAsync(Answer answer)
        {
            _db.Answers.Update(answer);
            await _db.SaveChangesAsync();
        }

        // Cevap Silme
        public async Task DeleteAnswerAsync(Answer answer)
        {
            _db.Answers.Remove(answer);
            await _db.SaveChangesAsync();
        }
    }
}
