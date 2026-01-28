import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
// Servisler
import { ToastService } from '../../services/toast.services';
import { AuthService, LoginResponse } from '../../services/auth.services';
import { CommunityService } from '../../services/community.services';
// Bileşenler
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
// Http Client
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { switchMap, catchError, take } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { Logger } from '../../utils/logger.util';

@Component({
  selector: 'app-community-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ToastComponent,
    HttpClientModule,
    LumaSpinComponent,
    FormsModule,
  ],
  templateUrl: './community-login.html',
  styleUrls: ['./community-login.scss'],
  // BU SATIR EKLENMELİ: Spline gibi custom element'leri tanıması için gereklidir
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CommunityLoginComponent implements OnInit, OnDestroy {
  emailError: boolean = false;
  isLoading: boolean = false;
  showForgotPasswordModal: boolean = false;
  forgotPasswordEmail: string = '';
  forgotEmailError: boolean = false;
  isSendingEmail: boolean = false;
  emailSent: boolean = false;
  private popStateListener?: (event: PopStateEvent) => void;

  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private communityService: CommunityService,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit(): void {
    // Spline Viewer scriptini dinamik olarak yükle
    const scriptCheck = document.querySelector(
      'script[src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"]'
    );

    if (!scriptCheck) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js';
      document.head.appendChild(script);
    }

    // Geri butonuna basıldığında anasayfaya yönlendir
    this.popStateListener = (event: PopStateEvent) => {
      // State kontrolü yap - eğer bizim eklediğimiz state ise veya community-login sayfasındaysak
      if (
        (event.state && event.state.fromCommunityLogin) ||
        this.router.url === '/community-login'
      ) {
        // window.location kullanarak direkt anasayfaya yönlendir (Angular Router'ı bypass eder)
        window.location.href = '/';
      }
    };
    window.addEventListener('popstate', this.popStateListener);

    // History'ye bir entry ekle ki geri butonuna basıldığında popstate tetiklensin
    history.pushState({ fromCommunityLogin: true }, '', location.href);
  }

  ngOnDestroy(): void {
    if (this.popStateListener) {
      window.removeEventListener('popstate', this.popStateListener);
    }
  }

  validateCommunityEmail(event: any) {
    const email = event.target.value;

    if (!email) {
      this.emailError = false;
      return;
    }

    if (email.includes('@') && !email.endsWith('.edu.tr')) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (this.isLoading) return;

    const form = event.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = form.querySelector('input[type="password"]') as HTMLInputElement;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // 1. Validasyonlar
    if (!email || !password) {
      this.toastService.show('Lütfen e-posta ve şifre alanlarını doldurunuz.', 'error');
      return;
    }

    if (this.emailError) {
      this.toastService.show('Lütfen geçerli bir topluluk e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    // 2. BACKEND SORGUSU BAŞLIYOR
    this.isLoading = true;

    this.authService.loginCommunity(email, password).subscribe({
      next: (response: LoginResponse) => {
        // --- BAŞARILI GİRİŞ ---
        // Giriş başarılı olduktan sonra, kullanıcının e-postasının bir topluluğun başkan e-postası olup olmadığını kontrol et
        const normalizedEmail = email.trim().toLowerCase();

        // Aktif ve pasif toplulukları getir ve kullanıcının e-postasının ComLeadMail ile eşleşip eşleşmediğini kontrol et
        // CommunityMiniDto'da ComLeadMail yok, bu yüzden her topluluğun detayını kontrol etmemiz gerekiyor
        // Hem aktif hem pasif toplulukları kontrol et (status parametresi olmadan tüm toplulukları getir)
        this.communityService
          .getAllCommunities()
          .pipe(
            take(1), // İlk sonucu al ve tamamla
            switchMap((communities) => {
              if (!communities || communities.length === 0) {
                // Topluluk bulunamadı - girişe izin ver (backend zaten doğruladı)
                Logger.warn('Topluluk bulunamadı, ancak backend girişi onayladı. Girişe izin veriliyor.');
                return of(true); // Girişe izin ver
              }

              // Tüm toplulukların detaylarını paralel olarak çek (ComLeadMail kontrolü için)
              const checkPromises = communities.map((community) =>
                this.communityService.getCommunityById(community.id).pipe(
                  catchError(() => of(null)),
                  take(1)
                )
              );

              // Tüm topluluk detaylarını paralel olarak kontrol et
              return forkJoin(checkPromises).pipe(
                take(1),
                switchMap((communityDetails) => {
                  // Kullanıcının e-postasının bir topluluğun ComLeadMail'i ile eşleşip eşleşmediğini kontrol et
                  // Hem aktif hem pasif toplulukları kontrol et
                  const matchingCommunity = communityDetails.find(
                    (detail) =>
                      detail && 
                      detail.comLeadMail && 
                      detail.comLeadMail.trim().toLowerCase() === normalizedEmail
                  );

                  if (matchingCommunity) {
                    return of(true); // Topluluk başkanı bulundu
                  } else {
                    // Topluluk başkanı bulunamadı ama backend girişi onayladı
                    // Backend'de kullanıcı rolü topluluk başkanı (roleId=3) olarak ayarlanmış olabilir
                    // Bu durumda girişe izin ver
                    Logger.warn('Topluluk başkanı eşleşmesi bulunamadı, ancak backend girişi onayladı. Girişe izin veriliyor.');
                    return of(true); // Girişe izin ver
                  }
                })
              );
            }),
            catchError((error) => {
              // Topluluk kontrolü sırasında hata oluşursa, girişe izin ver (backend zaten doğruladı)
              Logger.error('Topluluk kontrolü hatası:', error);
              Logger.warn('Topluluk kontrolü başarısız oldu, ancak backend girişi onayladı. Girişe izin veriliyor.');
              return of(true); // Hata durumunda da girişe izin ver
            })
          )
          .subscribe({
            next: (hasCommunity) => {
              // Backend girişi onayladıysa, topluluk kontrolü başarısız olsa bile girişe izin ver
              this.isLoading = false;
              this.toastService.show(
                'Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz...',
                'success'
              );

              setTimeout(() => {
                this.router.navigate(['/']);
              }, 1500);
            },
            error: (error) => {
              // Topluluk kontrolü sırasında hata oluşursa, yine de girişe izin ver (backend zaten doğruladı)
              this.isLoading = false;
              Logger.error('Topluluk kontrolü hatası:', error);
              Logger.warn('Topluluk kontrolü başarısız oldu, ancak backend girişi onayladı. Girişe izin veriliyor.');

              this.toastService.show(
                'Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz...',
                'success'
              );

              setTimeout(() => {
                this.router.navigate(['/']);
              }, 1500);
            },
          });
      },
      error: (error: HttpErrorResponse) => {
        // --- HATALI GİRİŞ ---
        this.isLoading = false;
        Logger.error('Giriş Hatası:', error);

        const message = error.error?.message || error.message || 'E-posta veya şifre hatalı!';
        this.toastService.show(message, 'error');
      },
    });
  }

  openForgotPasswordModal() {
    this.showForgotPasswordModal = true;
    this.forgotPasswordEmail = '';
    this.forgotEmailError = false;
    this.emailSent = false;
  }

  closeForgotPasswordModal() {
    this.showForgotPasswordModal = false;
    this.forgotPasswordEmail = '';
    this.forgotEmailError = false;
    this.emailSent = false;
  }

  validateForgotEmail(event: any) {
    const email = event.target.value.trim();

    if (!email) {
      this.forgotEmailError = false;
      return;
    }

    // E-posta formatı kontrolü: @ işareti olmalı ve .edu.tr ile bitmeli
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]) {
      // @ işareti yoksa veya @ işaretinden önce/sonra boşsa
      this.forgotEmailError = true;
      return;
    }

    // .edu.tr ile bitmeli
    if (!email.endsWith('.edu.tr')) {
      this.forgotEmailError = true;
    } else {
      this.forgotEmailError = false;
    }
  }

  async sendPasswordResetEmail() {
    const email = this.forgotPasswordEmail.trim();

    if (!email) {
      this.toastService.show('Lütfen e-posta adresinizi giriniz.', 'error');
      return;
    }

    // E-posta formatı kontrolü
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1] || !email.endsWith('.edu.tr')) {
      this.toastService.show('Lütfen geçerli bir topluluk e-postası (.edu.tr) giriniz.', 'error');
      this.forgotEmailError = true;
      return;
    }

    if (this.forgotEmailError) {
      this.toastService.show('Lütfen geçerli bir topluluk e-postası (.edu.tr) giriniz.', 'error');
      return;
    }

    this.isSendingEmail = true;
    this.emailSent = false;

    try {
      const response = await fetch('/api/Auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.forgotPasswordEmail.trim(),
        }),
      });

      // Response'un JSON olup olmadığını kontrol et
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.toastService.show('Sunucuya Bağlanılamadı', 'error');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        this.emailSent = true;
        this.toastService.show('Şifre sıfırlama linki e-posta adresinize gönderildi.', 'success');
        setTimeout(() => {
          this.closeForgotPasswordModal();
        }, 3000);
      } else {
        // Mail bulunamadı kontrolü
        const errorMessage = data.message || '';
        const lowerMessage = errorMessage.toLowerCase();

        if (
          response.status === 404 ||
          lowerMessage.includes('not found') ||
          lowerMessage.includes('bulunamadı') ||
          lowerMessage.includes('kullanıcı bulunamadı') ||
          lowerMessage.includes('email not found') ||
          lowerMessage.includes('e-posta bulunamadı')
        ) {
          this.toastService.show('Mail bulunamadı', 'error');
        } else if (errorMessage) {
          this.toastService.show(errorMessage, 'error');
        } else {
          this.toastService.show('Bir hata oluştu. Lütfen tekrar deneyiniz.', 'error');
        }
      }
    } catch (error: any) {
      Logger.error('Şifre sıfırlama hatası:', error);
      // Network hatası veya fetch hatası
      if (error.message && error.message.includes('fetch')) {
        this.toastService.show('Sunucuya Bağlanılamadı', 'error');
      } else {
        this.toastService.show('Sunucuya Bağlanılamadı', 'error');
      }
    } finally {
      this.isSendingEmail = false;
    }
  }
}
