using Application.DTOs;
using Application.Interfaces.Repositories;
using Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.Features.Forum.Commands
{
    // Komut: Geriye başarı mesajı (string) döner.
    public class CreateAnswerCommand : IRequest<string>
    {
        public CreateAnswerRequest Request { get; }
        public int UserId { get; }

        public CreateAnswerCommand(CreateAnswerRequest req, int userId)
        {
            Request = req;
            UserId = userId;
        }
    }

    public class CreateAnswerCommandHandler : IRequestHandler<CreateAnswerCommand, string>
    {
        private readonly IForumRepository _forumRepository;

        public CreateAnswerCommandHandler(IForumRepository forumRepository)
        {
            _forumRepository = forumRepository;
        }

        public async Task<string> Handle(CreateAnswerCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;

            // 1. Validasyon (İçerik boş mu?)
            if (string.IsNullOrWhiteSpace(req.Content))
                throw new Exception("Cevap içeriği boş olamaz.");

            // 2. KRİTİK KONTROL: Böyle bir soru var mı?
            // Olmayan bir soruya cevap yazmaya çalışırsa sistem patlar.
            var existingQuestion = await _forumRepository.GetQuestionByIdAsync(req.QuestionId);

            if (existingQuestion == null)
                throw new Exception("Cevap vermeye çalıştığınız soru bulunamadı veya silinmiş.");

            // 3. Entity Oluşturma
            var newAnswer = new Answer
            {
                QuestionId = req.QuestionId,
                Content = req.Content,
                UserId = command.UserId,
                CreatedAt = DateTime.UtcNow
            };

            // 4. Repository ile Kayıt
            await _forumRepository.AddAnswerAsync(newAnswer);

            return "Cevap başarıyla eklendi.";
        }
    }
}
