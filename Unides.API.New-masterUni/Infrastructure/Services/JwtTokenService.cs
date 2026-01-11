using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Unides.Application.Interfaces.Services;
using Unides.Domain.Entities;

namespace Unides.Infrastructure.Services
{
    public class JwtTokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateAccessToken(int userId, int roleId, string email, string roleName)
        {
            var issuer = _configuration["Jwt:Issuer"] ?? "Unides";
            var audience = _configuration["Jwt:Audience"] ?? "UnidesAudience";
            var key = _configuration["Jwt:Key"];
            var minutesStr = _configuration["Jwt:AccessTokenMinutes"];
            var minutes = int.TryParse(minutesStr, out var m) ? m : 60;

            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException("Jwt:Key not configured");
            }

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
    {
                // 1. Controller'daki GetCurrentUserId() metodunun aradığı yer burası:
                // Buraya userId.ToString() veriyoruz ki int.Parse() hata vermesin.
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()), 
        
                // 2. Standart "Subject" (Konu) alanı da UserID olmalıdır.
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),

                // Diğer bilgiler
                new Claim("id", userId.ToString()),
                new Claim("roleId", roleId.ToString()),
                new Claim(ClaimTypes.Role, roleName),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
    };



            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(minutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var bytes = new byte[32];
            RandomNumberGenerator.Fill(bytes);
            return Convert.ToBase64String(bytes);
        }

        public DateTime GetAccessTokenExpiry()
        {
            var minutesStr = _configuration["Jwt:AccessTokenMinutes"];
            var minutes = int.TryParse(minutesStr, out var m) ? m : 60;
            return DateTime.UtcNow.AddMinutes(minutes);
        }

        public DateTime GetRefreshTokenExpiry()
        {
            var daysStr = _configuration["Jwt:RefreshTokenDays"];
            var days = int.TryParse(daysStr, out var d) ? d : 7;
            return DateTime.UtcNow.AddDays(days);
        }
    }
}


