using Application.DTOs;
using Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Interfaces.Repositories;
namespace Application.Features.Forum.Commands
{
    // Komut: Geriye oluşan sorunun ID'sini (int) döner.
    public class CreateQuestionCommand : IRequest<int>
    {
        public CreateQuestionRequest Request { get; }
        public int UserId { get; } // Token'dan gelen ID

        public CreateQuestionCommand(CreateQuestionRequest req, int userId)
        {
            Request = req;
            UserId = userId;
        }
    }

    public class CreateQuestionCommandHandler : IRequestHandler<CreateQuestionCommand, int>
    {
        private readonly IForumRepository _forumRepository;

        public CreateQuestionCommandHandler(IForumRepository forumRepository)
        {
            _forumRepository = forumRepository;
        }

        public async Task<int> Handle(CreateQuestionCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;

            // 1. Validasyonlar (Örn: Başlık boş mu?)
            if (string.IsNullOrWhiteSpace(req.Title) || req.Title.Length < 5)
                throw new Exception("Soru başlığı en az 5 karakter olmalıdır.");

            if (string.IsNullOrWhiteSpace(req.Content))
                throw new Exception("Soru içeriği boş olamaz.");

            // 2. Entity Oluşturma
            var newQuestion = new Question
            {
                Title = req.Title,
                Content = req.Content,
                UserId = command.UserId, // Controller'dan gelen UserID
                CreatedAt = DateTime.UtcNow
            };

            // 3. Repository ile Kayıt
            await _forumRepository.AddQuestionAsync(newQuestion);

            return newQuestion.Id;
        }
    }
}
