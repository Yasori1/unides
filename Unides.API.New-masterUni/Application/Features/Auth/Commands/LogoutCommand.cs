using MediatR;
using Unides.Application.DTOs.Auth;
using Unides.Application.Interfaces.Repositories;
using Unides.Application.Services;

namespace Unides.Application.Features.Auth.Commands
{
    public class LogoutCommand : IRequest<bool>
    {
        public string? RefreshToken { get; set; }
        public int? UserId { get; set; } // Tüm session'ları iptal etmek için

        public LogoutCommand(string? refreshToken = null, int? userId = null)
        {
            RefreshToken = refreshToken;
            UserId = userId;
        }
    }

    public class LogoutCommandHandler : IRequestHandler<LogoutCommand, bool>
    {
        private readonly IUserRepository _userRepository;

        public LogoutCommandHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<bool> Handle(LogoutCommand command, CancellationToken cancellationToken)
        {
            // Eğer userId verilmişse, o kullanıcının tüm session'larını iptal et
            if (command.UserId.HasValue)
            {
                await _userRepository.RevokeAllUserSessionsAsync(command.UserId.Value);
                return true;
            }

            // Eğer refresh token verilmişse, sadece o session'ı iptal et
            if (!string.IsNullOrWhiteSpace(command.RefreshToken))
            {
                var refreshTokenHash = SecurityHelper.HashRefreshToken(command.RefreshToken);
                var session = await _userRepository.GetSessionByTokenHashAsync(refreshTokenHash);

                if (session != null)
                {
                    await _userRepository.RevokeSessionAsync(session.Id);
                    return true;
                }
            }

            return false;
        }
    }
}

