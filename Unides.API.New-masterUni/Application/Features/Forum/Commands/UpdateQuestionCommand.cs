using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs;
using Application.Interfaces.Repositories;
using MediatR;

namespace Application.Features.Forum.Commands
{


    namespace Unides.Application.Features.Forum.Commands
    {
        public class UpdateQuestionCommand : IRequest<string>
        {
            public UpdateQuestionRequest Request { get; }
            public int UserId { get; } // İsteği yapan kişi

            public UpdateQuestionCommand(UpdateQuestionRequest req, int userId)
            {
                Request = req;
                UserId = userId;
            }
        }

        public class UpdateQuestionCommandHandler : IRequestHandler<UpdateQuestionCommand, string>
        {
            private readonly IForumRepository _repo;
            public UpdateQuestionCommandHandler(IForumRepository repo) { _repo = repo; }

            public async Task<string> Handle(UpdateQuestionCommand command, CancellationToken token)
            {
                // 1. Soruyu Bul
                var question = await _repo.GetQuestionByIdAsync(command.Request.QuestionId);
                if (question == null) throw new Exception("Soru bulunamadı.");

                // 2. GÜVENLİK KONTROLÜ: Soruyu düzenleyen kişi, sorunun sahibi mi?
                if (question.UserId != command.UserId)
                    throw new Exception("Bu soruyu düzenleme yetkiniz yok.");

                // 3. Güncelle
                if (!string.IsNullOrEmpty(command.Request.Title))
                {
                    question.Title = command.Request.Title;
                }

                if (!string.IsNullOrEmpty(command.Request.Content))
                {
                    question.Content = command.Request.Content;
                }

                await _repo.UpdateQuestionAsync(question);
                return "Soru güncellendi.";
            }
        }
    }
}