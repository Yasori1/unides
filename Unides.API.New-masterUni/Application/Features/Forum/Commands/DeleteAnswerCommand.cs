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
    namespace Unides.Application.Features.Forum.Commands
    {
        public class DeleteAnswerCommand : IRequest<string>
        {
            public int AnswerId { get; }
            public int UserId { get; }
            public int UserRoleId { get; }

            public DeleteAnswerCommand(int answerId, int userId, int userRoleId)
            {
                AnswerId = answerId;
                UserId = userId;
                UserRoleId = userRoleId;
            }
        }

        public class DeleteAnswerCommandHandler : IRequestHandler<DeleteAnswerCommand, string>
        {
            private readonly IForumRepository _repo;
            public DeleteAnswerCommandHandler(IForumRepository repo) { _repo = repo; }

            public async Task<string> Handle(DeleteAnswerCommand command, CancellationToken token)
            {
                var answer = await _repo.GetAnswerByIdAsync(command.AnswerId);
                if (answer == null) throw new Exception("Cevap bulunamadı.");

                // GÜVENLİK: Sadece sahibi silebilir
                bool isOwner = answer.UserId == command.UserId;

                // Kullanıcı GSB Personeli (Rol ID: 2) mi?
                bool isModerator = command.UserRoleId == 2;
                if (!isOwner && !isModerator)
                {
                    throw new Exception("Bu soruyu düzenleme yetkiniz yok. Sadece kendi sorularınızı düzenleyebilirsiniz.");
                }
                await _repo.DeleteAnswerAsync(answer);
                return "Soru silindi.";
            }
        }
    }
}
