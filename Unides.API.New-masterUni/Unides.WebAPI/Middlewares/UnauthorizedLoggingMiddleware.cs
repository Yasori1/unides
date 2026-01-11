using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Unides.Application.Interfaces.Repositories;

namespace Unides.WebApi.Middlewares
{
    public class UnauthorizedLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public UnauthorizedLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IErrorLogRepository errorLogRepository)
        {
            await _next(context);

            if (context.Response.StatusCode == StatusCodes.Status401Unauthorized ||
                context.Response.StatusCode == StatusCodes.Status403Forbidden)
            {
                // Try to read user id if present
                var userIdClaim = context.User.FindFirst("id")?.Value
                    ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? context.User.FindFirst("userId")?.Value;
                int? userId = null;
                if (int.TryParse(userIdClaim, out var uid)) userId = uid;

                var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim();
                var ip = !string.IsNullOrWhiteSpace(forwarded)
                    ? forwarded
                    : context.Connection.RemoteIpAddress?.MapToIPv4()?.ToString();

                try
                {
                    await errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                    {
                        Action = $"{context.Request.Method} {context.Request.Path}",
                        UserId = userId,
                        EntityType = null,
                        EntityId = null,
                        ErrorMessage = context.Response.StatusCode == StatusCodes.Status401Unauthorized
                            ? "Unauthorized"
                            : "Forbidden",
                        IpAddress = ip,
                        UserAgent = context.Request.Headers["User-Agent"].ToString(),
                        CorrelationId = Guid.NewGuid()
                    });
                }
                catch
                {
                    // swallow logging errors
                }
            }
        }
    }
}
