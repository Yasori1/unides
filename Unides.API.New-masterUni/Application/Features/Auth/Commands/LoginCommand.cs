using MediatR;
using Unides.Application.DTOs.Auth;
using Unides.Application.Interfaces.Repositories;
using Unides.Application.Interfaces.Services;
using Unides.Application.Services;
using Unides.Domain.Entities;

namespace Unides.Application.Features.Auth.Commands
{
    public class LoginCommand : IRequest<AuthResponse>
    {
        public LoginRequest Request { get; set; }
        public LoginCommand(LoginRequest req) { Request = req; }
    }

    public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponse>
    {
        private readonly IUserRepository _userRepo;
        private readonly ITokenService _tokenService;
        public LoginCommandHandler(IUserRepository userRepo, ITokenService tokenService) { _userRepo = userRepo; _tokenService = tokenService; }

        public async Task<AuthResponse> Handle(LoginCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;

            // 1. Kullanıcıyı Bul
            var user = await _userRepo.GetByEmailAsync(req.Email);
            if (user == null) throw new Exception("Kullanıcı bulunamadı.");

            // 2. Şifre Kontrol
            var hash = SecurityHelper.HashPassword(req.Password);
            if (user.PasswordHash != hash) throw new Exception("Hatalı şifre.");

            // 3. Session Kaydet (Refresh Token - Hash'lenmiş olarak)
            var refreshToken = _tokenService.GenerateRefreshToken();
            var refreshTokenHash = SecurityHelper.HashRefreshToken(refreshToken);
            var session = new Session
            {
                UserId = user.Id,
                RefreshTokenHash = refreshTokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = _tokenService.GetRefreshTokenExpiry(),
                RevokedAt = null
            };
            await _userRepo.AddSessionAsync(session);

            // 4. Rol Adını Bul
            var roleName = await _userRepo.GetRoleNameById(user.RoleId);

            return new AuthResponse
            {
                Id = user.Id,
                FullName = user.Name,
                Email = user.Email,
                RoleName = roleName,
                AccessToken = _tokenService.GenerateAccessToken(user.Id, user.RoleId, user.Email, roleName),
                RefreshToken = refreshToken
            };
        }
    }
}