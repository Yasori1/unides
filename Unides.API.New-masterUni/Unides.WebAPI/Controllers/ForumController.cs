using Application.DTOs; // DTO'ların olduğu yer
using Application.Features.Forum.Commands; // Command'lerin olduğu yer
using Application.Features.Forum.Commands.Unides.Application.Features.Forum.Commands;
using Application.Features.Forum.Querry;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Unides.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // DİKKAT: Bu sınıfa sadece Token ile giriş yapmış kullanıcılar erişebilir.
    public class ForumController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ForumController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // Yardımcı Metot: Token'ın içindeki şifreli UserID bilgisini okur.
        // Frontend'den ID istemeyiz, Token'dan okumak en güvenlisidir.
        private int GetCurrentUserId()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString))
                throw new UnauthorizedAccessException("Kullanıcı kimliği doğrulanamadı.");

            return int.Parse(userIdString);
        }
        private int GetCurrentUserRoleId()
        {
            // 1. Token'ın içindeki "role" (ClaimTypes.Role) verisini bul
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            // 2. Eğer rol bilgisi hiç yoksa hata fırlat veya 0 dön
            if (string.IsNullOrEmpty(roleClaim))
                throw new UnauthorizedAccessException("Kullanıcı rolü doğrulanamadı.");

            // 3. String olarak gelen rolü ID'ye çevir (Register kısmındaki mantığın tersi)
            if (roleClaim == "Gsb Görevlisi") return 2; // GSB Personeli
            if (roleClaim == "Kullanıcı") return 1;         // Standart Üye / Öğrenci

            // 4. Eğer Token'da direkt sayı olarak (örn: "2") saklandıysa onu parse etmeyi dene
            if (int.TryParse(roleClaim, out int roleId))
            {
                return roleId;
            }

            // Bilinmeyen bir rol ise 0 dön (Yetkisiz sayılır)
            return 0;
        }
        // 1. SORU OLUŞTURMA
        // POST: api/forum/ask
        [HttpPost("formAsk")]
        public async Task<IActionResult> AskQuestion([FromBody] CreateQuestionRequest req)
        {
            try
            {
                // 1. Token'dan kullanıcının ID'sini alıyoruz
                int userId = GetCurrentUserId();

                // 2. Command oluşturup MediatR'a gönderiyoruz (Request + UserId)
                var result = await _mediator.Send(new CreateQuestionCommand(req, userId));

                // 3. Başarılı dönerse (Soru ID'si döner)
                return Ok(new { message = "Soru başarıyla oluşturuldu.", questionId = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 2. CEVAP VERME
        // POST: api/forum/answer
        [HttpPost("formAnswer")]
        public async Task<IActionResult> AnswerQuestion([FromBody] CreateAnswerRequest req)
        {
            try
            {
                // 1. Token'dan kullanıcının ID'sini alıyoruz
                int userId = GetCurrentUserId();

                // 2. Command oluşturup MediatR'a gönderiyoruz
                var result = await _mediator.Send(new CreateAnswerCommand(req, userId));

                // 3. Başarılı dönerse (Mesaj döner)
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("getAllQuestionsAndAnswer")]
        [AllowAnonymous] // ÖNEMLİ: Giriş yapmayanlar da forumu okuyabilsin (İstersen kaldırabilirsin)
        public async Task<IActionResult> GetAllQuestions()
        {
            try
            {
                var result = await _mediator.Send(new GetAllQuestionsQuery());
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 1. SORU GÜNCELLEME (PUT)
        [HttpPut("questionUpdate")]
        public async Task<IActionResult> UpdateQuestion([FromBody] UpdateQuestionRequest req)
        {
            try
            {
                int userId = GetCurrentUserId();
                var result = await _mediator.Send(new UpdateQuestionCommand(req, userId));
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    detay = ex.InnerException?.Message // Asıl suçlu burada yazar
                });
            }
        }

        // 2. SORU SİLME (DELETE)
        [HttpDelete("questionDelete/{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            try
            {
                int userId = GetCurrentUserId();
                int RoleId = GetCurrentUserRoleId();
                var result = await _mediator.Send(new DeleteQuestionCommand(id, userId, RoleId));
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 3. CEVAP GÜNCELLEME (PUT)
        [HttpPut("answerUpdate")]
        public async Task<IActionResult> UpdateAnswer([FromBody] UpdateAnswerRequest req)
        {
            try
            {
                int userId = GetCurrentUserId();
                var result = await _mediator.Send(new UpdateAnswerCommand(req, userId));
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 4. CEVAP SİLME (DELETE)
        [HttpDelete("answerDelete/{id}")]
        public async Task<IActionResult> DeleteAnswer(int id)
        {
            try
            {
                int userId = GetCurrentUserId();
                int userRoleId = GetCurrentUserRoleId();
                var result = await _mediator.Send(new DeleteAnswerCommand(id, userId, userRoleId));
                return Ok(new { message = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}