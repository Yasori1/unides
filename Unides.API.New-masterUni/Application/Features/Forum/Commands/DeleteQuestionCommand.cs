using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Interfaces.Repositories;
using MediatR;


namespace Application.Features.Forum.Commands
{

    namespace Unides.Application.Features.Forum.Commands
    {
        public class DeleteQuestionCommand : IRequest<string>
        {
            public int QuestionId { get; }
            public int UserId { get; }
            public int UserRoleId { get; }

            public DeleteQuestionCommand(int questionId, int userId, int RoleId)
            {
                QuestionId = questionId;
                UserId = userId;
                UserRoleId = RoleId;
            }
        }

        public class DeleteQuestionCommandHandler : IRequestHandler<DeleteQuestionCommand, string>
        {
            private readonly IForumRepository _repo;
            public DeleteQuestionCommandHandler(IForumRepository repo) { _repo = repo; }

            public async Task<string> Handle(DeleteQuestionCommand command, CancellationToken token)
            {
                var question = await _repo.GetQuestionByIdAsync(command.QuestionId);
                if (question == null) throw new Exception("Soru bulunamadı.");

                // GÜVENLİK: Sadece sahibi silebilir
                bool isOwner = question.UserId == command.UserId;

                // Kullanıcı GSB Personeli (Rol ID: 2) mi?
                bool isModerator = command.UserRoleId == 2;
                if (!isOwner && !isModerator)
                {
                    throw new Exception("Bu soruyu düzenleme yetkiniz yok. Sadece kendi sorularınızı düzenleyebilirsiniz.");
                }
                await _repo.DeleteQuestionAsync(question);
                return "Soru silindi.";
            }
        }
    }
}
