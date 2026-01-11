using System;

namespace Unides.Application.Interfaces.Services
{
    public interface ITokenService
    {
        string GenerateAccessToken(int userId, int roleId, string email, string roleName);
        string GenerateRefreshToken();
        DateTime GetAccessTokenExpiry();
        DateTime GetRefreshTokenExpiry();
    }
}


