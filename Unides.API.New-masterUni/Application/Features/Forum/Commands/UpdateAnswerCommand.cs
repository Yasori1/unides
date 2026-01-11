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
        public class UpdateAnswerCommand : IRequest<string>
        {
            public UpdateAnswerRequest Request { get; }
            public int UserId { get; }

            public UpdateAnswerCommand(UpdateAnswerRequest req, int userId)
            {
                Request = req;
                UserId = userId;
            }
        }

        public class UpdateAnswerCommandHandler : IRequestHandler<UpdateAnswerCommand, string>
        {
            private readonly IForumRepository _repo;
            public UpdateAnswerCommandHandler(IForumRepository repo) { _repo = repo; }

            public async Task<string> Handle(UpdateAnswerCommand command, CancellationToken token)
            {
                var answer = await _repo.GetAnswerByIdAsync(command.Request.AnswerId);
                if (answer == null) throw new Exception("Cevap bulunamadı.");

                if (answer.UserId != command.UserId)
                    throw new Exception("Bu cevabı düzenleme yetkiniz yok.");

                answer.Content = command.Request.Content;
                await _repo.UpdateAnswerAsync(answer);
                return "Cevap güncellendi.";
            }
        }
    }
}
