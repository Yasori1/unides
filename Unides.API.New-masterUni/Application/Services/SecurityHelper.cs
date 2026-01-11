using System;
using System.Security.Cryptography;
using System.Text;

namespace Unides.Application.Services
{
    public static class SecurityHelper
    {
        public static string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        public static string GenerateMockToken(string email, string role)
        {
            // İleride buraya gerçek JWT gelecek
            return $"MOCK_TOKEN_FOR_{email}_{role}_{Guid.NewGuid()}";
        }

        public static string HashRefreshToken(string refreshToken)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(refreshToken));
            return Convert.ToBase64String(bytes);
        }

        public static bool VerifyPassword(string password, string storedHash)
        {
            // Kullanıcının girdiği şifreyi hash'le ve DB'deki ile karşılaştır
            string hashOfInput = HashPassword(password);
            return string.Equals(hashOfInput, storedHash);
        }
    }
}