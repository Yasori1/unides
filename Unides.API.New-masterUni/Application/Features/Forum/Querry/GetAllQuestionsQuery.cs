using Application.DTOs;
using Application.Interfaces.Repositories;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Entities;

namespace Application.Features.Forum.Querry
{
    public class GetAllQuestionsQuery : IRequest<List<QuestionDto>>
    {
    }

    // 2. HANDLER (İşi Yapan)
    public class GetAllQuestionsQueryHandler : IRequestHandler<GetAllQuestionsQuery, List<QuestionDto>>
    {
        private readonly IForumRepository _forumRepository;

        public GetAllQuestionsQueryHandler(IForumRepository forumRepository)
        {
            _forumRepository = forumRepository;
        }

        public async Task<List<QuestionDto>> Handle(GetAllQuestionsQuery request, CancellationToken cancellationToken)
        {
            // Veritabanından ham veriyi (Entity) çek
            var entities = await _forumRepository.GetAllQuestionsWithDetailsAsync();

            // Entity -> DTO Dönüşümü (Mapping)
            // Bu işlemi normalde AutoMapper yapar ama mantığı anla diye elle yazıyorum:
            var dtos = entities.Select(q => new QuestionDto
            {
                Id = q.Id,
                Title = q.Title,
                Content = q.Content,
                CreatedAt = q.CreatedAt,
                AuthorName = q.User != null ? q.User.Name : "Bilinmeyen Kullanıcı", // User null kontrolü
                Answers = q.Answers.Select(a => new AnswerDto
                {
                    Id = a.Id,
                    Content = a.Content,
                    CreatedAt = a.CreatedAt,
                    AuthorName = a.User != null ? a.User.Name : "Bilinmeyen Kullanıcı"
                }).ToList()
            }).ToList();

            return dtos;
        }
    }
}
