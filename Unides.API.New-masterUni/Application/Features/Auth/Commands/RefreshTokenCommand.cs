using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Unides.Application.DTOs.Auth;
using Unides.Application.Interfaces.Repositories;
using Unides.Application.Interfaces.Services;

namespace Unides.Application.Features.Auth.Commands
{
    public class RefreshTokenCommand : IRequest<AuthResponse>
    {
        public RefreshRequest Request { get; }
        public RefreshTokenCommand(RefreshRequest request) { Request = request; }
    }

    public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;

        public RefreshTokenCommandHandler(IUserRepository userRepository, ITokenService tokenService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
        }

        public async Task<AuthResponse> Handle(RefreshTokenCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;
            if (string.IsNullOrWhiteSpace(req.RefreshToken))
                throw new Exception("Refresh token gerekli.");

            // Hash'le ve DB'de ara
            var refreshTokenHash = Unides.Application.Services.SecurityHelper.HashRefreshToken(req.RefreshToken);
            var session = await _userRepository.GetSessionByTokenHashAsync(refreshTokenHash);

            if (session == null)
                throw new Exception("Geçersiz veya süresi dolmuş refresh token.");

            var user = await _userRepository.GetByIdAsync(session.UserId);
            if (user == null) throw new Exception("Kullanıcı bulunamadı.");

            var roleName = await _userRepository.GetRoleNameById(user.RoleId);

            // Token Rotasyonu: Eski token'ı iptal et, yeni token üret
            var newRefreshToken = _tokenService.GenerateRefreshToken();
            var newRefreshTokenHash = Unides.Application.Services.SecurityHelper.HashRefreshToken(newRefreshToken);

            // Eski session'ı iptal et
            session.RevokedAt = DateTime.UtcNow;
            session.ReplacedByTokenHash = newRefreshTokenHash;
            await _userRepository.UpdateSessionAsync(session);

            // Yeni session oluştur
            var newSession = new Unides.Domain.Entities.Session
            {
                UserId = user.Id,
                RefreshTokenHash = newRefreshTokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = _tokenService.GetRefreshTokenExpiry(),
                RevokedAt = null
            };
            await _userRepository.AddSessionAsync(newSession);

            var accessToken = _tokenService.GenerateAccessToken(user.Id, user.RoleId, user.Email, roleName);

            return new AuthResponse
            {
                Id = user.Id,
                FullName = user.Name,
                Email = user.Email,
                RoleName = roleName,
                AccessToken = accessToken,
                RefreshToken = newRefreshToken
            };
        }
    }
}


