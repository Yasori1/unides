using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Linq;
using Unides.Application.Interfaces.Repositories;

namespace Unides.WebApi.Filters
{
    public class ValidationLoggingFilter : IAsyncActionFilter
    {
        private readonly IErrorLogRepository _errorLogRepository;

        public ValidationLoggingFilter(IErrorLogRepository errorLogRepository)
        {
            _errorLogRepository = errorLogRepository;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            if (context.ModelState.IsValid)
            {
                await next();
                return;
            }

            var errors = context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? e.Exception?.Message : e.ErrorMessage)
                .Where(m => !string.IsNullOrWhiteSpace(m))
                .ToList();
            var errorMessage = errors.Count > 0
                ? string.Join(" | ", errors)
                : "Validation failed";

            var userIdClaim = context.HttpContext.User.FindFirst("id")?.Value
                ?? context.HttpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? context.HttpContext.User.FindFirst("userId")?.Value;
            int? userId = null;
            if (int.TryParse(userIdClaim, out var uid)) userId = uid;

            var forwarded = context.HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0].Trim();
            var ip = !string.IsNullOrWhiteSpace(forwarded)
                ? forwarded
                : context.HttpContext.Connection.RemoteIpAddress?.MapToIPv4()?.ToString();

            try
            {
                await _errorLogRepository.AddAsync(new Unides.Domain.Entities.ErrorLog
                {
                    Action = $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}",
                    UserId = userId,
                    EntityType = null,
                    EntityId = null,
                    ErrorMessage = errorMessage,
                    IpAddress = ip,
                    UserAgent = context.HttpContext.Request.Headers["User-Agent"].ToString(),
                    CorrelationId = Guid.NewGuid()
                });
            }
            catch (Exception logEx)
            {
                Console.WriteLine($"Validation log failed: {logEx.Message}");
            }

            context.Result = new BadRequestObjectResult(new ValidationProblemDetails(context.ModelState)
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "One or more validation errors occurred."
            });
        }
    }
}
