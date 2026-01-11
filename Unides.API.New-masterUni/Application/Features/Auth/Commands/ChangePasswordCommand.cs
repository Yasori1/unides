using MediatR;
using Unides.Application.DTOs.Auth;
using Unides.Application.Interfaces.Repositories;
using Unides.Application.Services;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Unides.Application.Features.Auth.Commands
{
    public record ChangePasswordCommand(ChangePasswordRequest Request) : IRequest<bool>;

    public class ChangePasswordHandler : IRequestHandler<ChangePasswordCommand, bool>
    {
        private readonly IUserRepository _userRepository;

        public ChangePasswordHandler(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<bool> Handle(ChangePasswordCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;

            // 1. Kontroller (Şifre eşleşmesi, kullanıcı varlığı, eski şifre doğruluğu)
            if (req.NewPassword != req.ConfirmNewPassword)
                throw new Exception("Yeni şifreler birbiriyle uyuşmuyor.");

            var user = await _userRepository.GetByEmailAsync(req.Email);
            if (user == null)
                throw new Exception("Kullanıcı bulunamadı.");

            bool isOldPasswordValid = SecurityHelper.VerifyPassword(req.OldPassword, user.PasswordHash);
            if (!isOldPasswordValid)
                throw new Exception("Mevcut şifreniz hatalı.");

            // 2. Yeni şifreyi kaydet
            user.PasswordHash = SecurityHelper.HashPassword(req.NewPassword);
            await _userRepository.UpdateUserAsync(user);

            // 3. OTURUM KAPATMA 
            // Şifre değiştiği için güvenlik amacıyla diğer tüm aktif oturumları iptal et
            await _userRepository.RevokeAllUserSessionsAsync(user.Id);

            return true;
        }
    }
}