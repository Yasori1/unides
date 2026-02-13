import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
import { catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';
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
  isCheckingApproval: boolean = false;
  showForgotPasswordModal: boolean = false;
  forgotPasswordEmail: string = '';
  forgotEmailError: boolean = false;
  isSendingEmail: boolean = false;
  emailSent: boolean = false;
  /** Giriş başarılı ama topluluk henüz onaylanmadığında form yerine bu mesaj gösterilir */
  showPendingApprovalMessage: boolean = false;
  /** Topluluk adı (pending ekranında göstermek için) */
  pendingCommunityName: string = '';
  private popStateListener?: (event: PopStateEvent) => void;

  constructor(
    private toastService: ToastService,
    private authService: AuthService,
    private communityService: CommunityService,
    private router: Router,
    private route: ActivatedRoute,
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

    // --- Zaten giriş yapmış topluluk başkanı mı? Onay durumunu kontrol et ---
    this.checkIfAlreadyLoggedInAndPending();
  }

  /**
   * Sayfa yüklendiğinde: Kullanıcı zaten giriş yapmışsa ve topluluk onay bekliyor ise
   * pending ekranını göster. Onaylıysa anasayfaya/dashboard'a yönlendir.
   */
  private checkIfAlreadyLoggedInAndPending(): void {
    // Kullanıcı giriş yapmış mı ve topluluk rolünde mi?
    if (!this.authService.isAuthenticated() || this.authService.getUserType() !== 'community') {
      return;
    }

    this.isCheckingApproval = true;

    // Backend'den güncel topluluk bilgisini al
    this.communityService
      .getMyLeadCommunity()
      .pipe(take(1), catchError(() => of(null)))
      .subscribe({
        next: (community) => {
          this.isCheckingApproval = false;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e6794e23-5632-4fdd-a837-2f9289c5988e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'community-login.ts:checkIfAlreadyLoggedIn-getMyLeadCommunity',message:'getMyLeadCommunity result on init',data:{hasCommunity:!!community,id:community?.id,isActivity:community?.isActivity,name:community?.name?.substring(0,50)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
          // #endregion
          if (community && community.isActivity === false) {
            // Topluluk hâlâ onay bekliyor — pending ekranını göster
            this.authService.saveCommunityApproved(false);
            this.showPendingApprovalMessage = true;
            this.pendingCommunityName = community.name || '';
          } else if (community && community.isActivity === true) {
            // Topluluk onaylı — localStorage'ı güncelle ve yönlendir
            this.authService.saveCommunityApproved(true);
            this.router.navigate(['/']);
          }
          // community === null → lead-by-me yok, formu göstermeye devam et
        },
        error: () => {
          this.isCheckingApproval = false;
        },
      });
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
      next: () => {
        // Giriş başarılı; token kaydedildi. Kendi topluluğumuzu (onay bekleyen dahil) lead-by-me ile al
        this.communityService
          .getMyLeadCommunity()
          .pipe(take(1), catchError(() => of(null)))
          .subscribe({
            next: (community) => {
              this.isLoading = false;
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/e6794e23-5632-4fdd-a837-2f9289c5988e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'community-login.ts:onSubmit-success-getMyLeadCommunity',message:'getMyLeadCommunity after login success',data:{hasCommunity:!!community,id:community?.id,isActivity:community?.isActivity,name:community?.name?.substring(0,50)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
              // #endregion
              const nextUrl = this.route.snapshot.queryParams['next'];

              if (community && community.isActivity === false) {
                // Topluluk henüz onaylanmamış: sayfada kal, pending ekranı göster
                this.authService.saveCommunityApproved(false);
                this.showPendingApprovalMessage = true;
                this.pendingCommunityName = community.name || '';
                this.toastService.show('Giriş başarılı.', 'success');
                return;
              }

              // Onaylı topluluk: localStorage'ı güncelle ve yönlendir
              this.authService.saveCommunityApproved(true);
              const target = nextUrl || '/';
              this.toastService.show('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
              setTimeout(() => this.router.navigateByUrl(target), 800);
            },
            error: () => {
              this.isLoading = false;
              // lead-by-me hatası — güvenli varsayılan: anasayfaya yönlendir
              this.authService.saveCommunityApproved(true);
              const target = this.route.snapshot.queryParams['next'] || '/';
              this.toastService.show('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
              setTimeout(() => this.router.navigateByUrl(target), 800);
            },
          });
      },
      error: (error: HttpErrorResponse) => {
        // --- HATALI GİRİŞ ---
        this.isLoading = false;
        Logger.error('Giriş Hatası:', error);

        const rawMessage =
          error.error?.message ||
          (error.error as any)?.Message ||
          error.message ||
          '';
        const rawLower = (rawMessage || '').toLowerCase();

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e6794e23-5632-4fdd-a837-2f9289c5988e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'community-login.ts:onSubmit-error',message:'Login error callback',data:{status:error?.status,rawMessage:rawMessage?.substring(0,200),hasSilinmistir:rawLower.includes('silinmiştir')||rawLower.includes('silinmis'),hasReddedilmis:rawLower.includes('reddedilmiştir')||rawLower.includes('reddedilmis')},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion

        // Backend LoginCommand: RoleId 4 = reddedilmiş, RoleId 5 = silinmiş; bu kullanıcılar giriş yapamaz, tekrar topluluk kaydı oluşturabilir.
        // Sıra: en özel mesaj önce (önce reddedilmiş sonra silinmiş), sonra reddedilmiş, sonra silinmiş. Backend mesajını aynen gösteriyoruz.
        const isOnceRejectedThenDeleted =
          rawLower.includes('önce reddedilmiş') && (rawLower.includes('sonra silinmiştir') || rawLower.includes('sonra silinmis'));
        const isRejected = rawLower.includes('reddedilmiştir') || rawLower.includes('reddedilmis');
        const isDeleted = rawLower.includes('silinmiştir') || rawLower.includes('silinmis');

        if (isOnceRejectedThenDeleted || isRejected || isDeleted) {
          const displayMessage =
            rawMessage?.trim() ||
            (isOnceRejectedThenDeleted
              ? 'Topluluğunuz önce reddedilmiş, sonra silinmiştir. Tekrar topluluk kaydı oluşturup GSB\'ye yollayınız.'
              : isRejected
                ? 'Topluluğunuz reddedilmiştir. Tekrar topluluk kaydı oluşturup GSB\'ye yollayınız.'
                : 'Topluluğunuz silinmiştir. Tekrar topluluk kaydı oluşturup GSB\'ye yollayınız.');
          this.toastService.show(displayMessage + ' Tekrar kayıt olmak veya yeni topluluk oluşturmak için Topluluk Kaydı sayfasını kullanabilirsiniz.', 'error');
          return;
        }

        const message = rawMessage || 'E-posta veya şifre hatalı!';
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

  /** Onay bekleyen ekranındayken çıkış yapıp tekrar giriş formunu göstermek için */
  logoutAndShowForm(): void {
    // Logout normalde anasayfaya yönlendirir; onu bypass edip burada kalıyoruz
    // Manuel temizlik yapıyoruz
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_type');
    localStorage.removeItem('community_approved');
    this.showPendingApprovalMessage = false;
    this.pendingCommunityName = '';
    this.toastService.show('Çıkış yapıldı.', 'success');
  }

  /** Onay durumunu tekrar kontrol et (kullanıcı "Durumu Kontrol Et" butonuna bastığında) */
  recheckApprovalStatus(): void {
    if (!this.authService.isAuthenticated()) {
      this.toastService.show('Oturum süresi dolmuş. Lütfen tekrar giriş yapınız.', 'error');
      this.logoutAndShowForm();
      return;
    }

    this.isCheckingApproval = true;

    this.communityService
      .getMyLeadCommunity()
      .pipe(take(1), catchError(() => of(null)))
      .subscribe({
        next: (community) => {
          this.isCheckingApproval = false;
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e6794e23-5632-4fdd-a837-2f9289c5988e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'community-login.ts:recheckApprovalStatus-getMyLeadCommunity',message:'getMyLeadCommunity on recheck',data:{hasCommunity:!!community,id:community?.id,isActivity:community?.isActivity},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
          // #endregion
          if (community && community.isActivity === true) {
            // Topluluk onaylandı!
            this.authService.saveCommunityApproved(true);
            this.toastService.show('Topluluğunuz onaylandı! Anasayfaya yönlendiriliyorsunuz...', 'success');
            setTimeout(() => this.router.navigate(['/']), 1200);
          } else {
            this.toastService.show('Topluluğunuz henüz onay sürecinde.', 'error');
          }
        },
        error: () => {
          this.isCheckingApproval = false;
          this.toastService.show('Durum kontrol edilemedi. Lütfen tekrar deneyiniz.', 'error');
        },
      });
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
