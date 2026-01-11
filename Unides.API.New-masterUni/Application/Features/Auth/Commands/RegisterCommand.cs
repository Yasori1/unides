using MediatR;
using Unides.Application.DTOs.Auth;
using Unides.Application.Interfaces.Repositories;
using Unides.Application.Interfaces.Services;
using Unides.Application.Services;
using Unides.Domain.Entities;

namespace Unides.Application.Features.Auth.Commands
{
    // Komut (Command)
    public class RegisterCommand : IRequest<AuthResponse>
    {
        public RegisterRequest Request { get; set; }
        public RegisterCommand(RegisterRequest req) { Request = req; }
    }

    // Komut İşleyicisi (Command Handler)
    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;

        public RegisterCommandHandler(IUserRepository userRepository, ITokenService tokenService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
        }

        public async Task<AuthResponse> Handle(RegisterCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;

            // 1. Mail Zaten Var mı?
            var existingUser = await _userRepository.GetByEmailAsync(req.Email);
            if (existingUser != null) throw new Exception("Bu e-posta adresi zaten kayıtlı.");

            // 2. ROL ve MAIL UZANTISI DOĞRULAMA (Validation)
            string expectedEmailDomain;
            
            // Role name'i veritabanından al (LoginCommand ile aynı mantık)
            string roleName = await _userRepository.GetRoleNameById(req.RoleId);
            if (string.IsNullOrWhiteSpace(roleName) || roleName == "Bilinmiyor")
            {
                throw new Exception("Geçersiz bir rol seçimi yapıldı.");
            }

            switch (req.RoleId)
            {
                case 2: // GSB Personeli
                    expectedEmailDomain = "gsb.gov.tr";
                    if (!req.Email.EndsWith(expectedEmailDomain))
                    {
                        throw new Exception($"GSB Personel kaydı için sadece '{expectedEmailDomain}' uzantılı mail adresi kullanılabilir.");
                    }
                    break;
                case 1: // Üye
                    expectedEmailDomain = "edu.tr";
                    if (!req.Email.EndsWith(expectedEmailDomain))
                    {
                        throw new Exception($"Üye kaydı için sadece '{expectedEmailDomain}' uzantılı mail adresi kullanılabilir.");
                    }
                    break;
                case 3: // Topluluk Başkanı
                    expectedEmailDomain = "edu.tr";
                    if (!req.Email.EndsWith(expectedEmailDomain))
                    {
                        throw new Exception($"Topluluk Başkanı kaydı için sadece '{expectedEmailDomain}' uzantılı mail adresi kullanılabilir.");
                    }
                    break;
                default:
                    throw new Exception("Geçersiz bir rol seçimi yapıldı.");
            }

            // 3. Kullanıcı Oluşturma
            var newUser = new User
            {
                Name = req.FullName,
                Email = req.Email,
                // `SecurityHelper.HashPassword` kullanılıyor
                PasswordHash = SecurityHelper.HashPassword(req.Password),
                RoleId = req.RoleId, // Kullanıcının seçtiği rolü verdik
                CreatedAt = DateTime.UtcNow,
                IsActive = true,
                Rozet = "Yeni"
            };

            await _userRepository.AddAsync(newUser);

            // 4. Session (Refresh Token - Hash'lenmiş olarak) oluştur ve kaydet
            var refreshToken = _tokenService.GenerateRefreshToken();
            var refreshTokenHash = SecurityHelper.HashRefreshToken(refreshToken);

            await _userRepository.AddSessionAsync(new Session
            {
                UserId = newUser.Id,
                RefreshTokenHash = refreshTokenHash,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = _tokenService.GetRefreshTokenExpiry(),
                RevokedAt = null
            });

            // 5. Access Token oluştur
            var token = _tokenService.GenerateAccessToken(newUser.Id, newUser.RoleId, newUser.Email, roleName);

            // 6. Cevabı (AuthResponse) döndür
            return new AuthResponse
            {
                Id = newUser.Id,
                FullName = newUser.Name,
                Email = newUser.Email,
                RoleName = roleName,
                AccessToken = token,
                RefreshToken = refreshToken
            };
        }

    }
}