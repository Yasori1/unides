using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Unides.WebApi.Middlewares
{
    public class CsrfValidationMiddleware
    {
        private readonly RequestDelegate _next;
        public CsrfValidationMiddleware(RequestDelegate next) { _next = next; }

        public async Task InvokeAsync(HttpContext context)
        {
            var method = context.Request.Method;
            var path = context.Request.Path.Value ?? string.Empty;

            // Bypass for infrastructure routes (Hangfire/Swagger UI pages)
            if (path.StartsWith("/hangfire", System.StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/swagger", System.StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Bypass for requests coming from Swagger UI (detected by Referer header)
            var referer = context.Request.Headers["Referer"].ToString();
            if (!string.IsNullOrEmpty(referer) && referer.Contains("/swagger", System.StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // If Authorization: Bearer header is present, skip CSRF (not cookie-based, not CSRF-prone)
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", System.StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Only enforce CSRF when cookie-based auth is in use
            var hasAccessCookie = context.Request.Cookies.ContainsKey("access_token");

            // Sadece state değiştirici isteklerde kontrol et; Auth uçlarını hariç tut
            if (hasAccessCookie &&
                (HttpMethods.IsPost(method) || HttpMethods.IsPut(method) || HttpMethods.IsPatch(method) || HttpMethods.IsDelete(method))
                && !path.StartsWith("/api/Auth"))
            {
                // Double-submit cookie: XSRF-TOKEN cookie'si ile X-CSRF-Token header'ı eşleşmeli
                var cookieToken = context.Request.Cookies["XSRF-TOKEN"];
                var headerToken = context.Request.Headers["X-CSRF-Token"].ToString();

                if (string.IsNullOrWhiteSpace(cookieToken) || string.IsNullOrWhiteSpace(headerToken) || !string.Equals(cookieToken, headerToken, System.StringComparison.Ordinal))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsync("CSRF validation failed.");
                    return;
                }
            }

            await _next(context);
        }
    }
}


