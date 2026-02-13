import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.services';
import { AuthService } from '../../services/auth.services';
import { CommunityService } from '../../services/community.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { ImageUploadComponent } from '../../components/ui/image-upload/image-upload';
import { Logger } from '../../utils/logger.util';
import { CreateCommunityDto } from '../../models/community.models';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-community-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ToastComponent,
    LumaSpinComponent,
    ImageUploadComponent,
  ],
  templateUrl: './community-register.html',
  styleUrls: ['./community-register.scss'],
})
export class CommunityRegisterComponent implements OnInit {
  /** 0 = süreç açıklaması (intro), 1 = e-posta/şifre, 2 = doğrulama (başka sayfada), 3 = topluluk bilgileri */
  step: 0 | 1 | 2 | 3 = 0;
  isLoading = false;
  emailError = false;
  passwordMismatch = false;

  /** Kayıt başarılı olduğunda formu gizleyip başarı ekranını gösterir */
  showRegistrationSuccess = false;

  // Adım 1 — Şifre kabul şartları (öğrenci kayıt sayfası ile aynı)
  passwordMinLength = false;
  passwordHasUppercase = false;
  passwordHasLowercase = false;
  passwordHasNumber = false;
  passwordHasSpecial = false;
  hasPasswordInput = false;

  // Adım 1
  email = '';
  password = '';
  confirmPassword = '';

  // Adım 3 - Topluluk bilgileri (Topluluk ekle popup ile aynı alanlar)
  comName = '';
  comCategory = 'Teknoloji';
  miniAbout = '';
  about = '';
  city = '';
  university = '';
  comMail = '';
  comLeadMail = '';
  webSiteUrl = '';
  instagramUrl = '';

  // Setup Token (verify-email sonrası gelen token — complete-community-setup için)
  setupToken = '';

  // Adım 3 - Banner ve Logo (önizleme + yüklenecek dosya)
  bannerPreviewUrl = '';
  logoPreviewUrl = '';
  bannerFile: File | null = null;
  logoFile: File | null = null;

  categories: string[] = [
    'Teknoloji',
    'Sanat',
    'Spor',
    'Kariyer',
    'Kültür',
    'Bilim',
    'Sosyal',
    'Müzik',
    'Genel',
  ];

  cities: string[] = [
    'Adana',
    'Adıyaman',
    'Afyonkarahisar',
    'Ağrı',
    'Amasya',
    'Ankara',
    'Antalya',
    'Artvin',
    'Aydın',
    'Balıkesir',
    'Bilecik',
    'Bingöl',
    'Bitlis',
    'Bolu',
    'Burdur',
    'Bursa',
    'Çanakkale',
    'Çankırı',
    'Çorum',
    'Denizli',
    'Diyarbakır',
    'Edirne',
    'Elazığ',
    'Erzincan',
    'Erzurum',
    'Eskişehir',
    'Gaziantep',
    'Giresun',
    'Gümüşhane',
    'Hakkari',
    'Hatay',
    'Isparta',
    'Mersin',
    'İstanbul',
    'İzmir',
    'Kars',
    'Kastamonu',
    'Kayseri',
    'Kırklareli',
    'Kırşehir',
    'Kocaeli',
    'Konya',
    'Kütahya',
    'Malatya',
    'Manisa',
    'Kahramanmaraş',
    'Mardin',
    'Muğla',
    'Muş',
    'Nevşehir',
    'Niğde',
    'Ordu',
    'Rize',
    'Sakarya',
    'Samsun',
    'Siirt',
    'Sinop',
    'Sivas',
    'Tekirdağ',
    'Tokat',
    'Trabzon',
    'Tunceli',
    'Şanlıurfa',
    'Uşak',
    'Van',
    'Yozgat',
    'Zonguldak',
    'Aksaray',
    'Bayburt',
    'Karaman',
    'Kırıkkale',
    'Batman',
    'Şırnak',
    'Bartın',
    'Ardahan',
    'Iğdır',
    'Yalova',
    'Karabük',
    'Kilis',
    'Osmaniye',
    'Düzce',
  ].sort();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private authService: AuthService,
    private communityService: CommunityService
  ) { }

  ngOnInit(): void {
    const stepParam = this.route.snapshot.queryParams['step'];
    // /create-community?setupToken=... — GET verify-email backend redirect'i
    const querySetupToken = this.route.snapshot.queryParams['setupToken'];
    if (querySetupToken) {
      sessionStorage.setItem('community_setup_token', querySetupToken);
      this.setupToken = querySetupToken;
    }

    if (stepParam === '3' || querySetupToken) {
      // SetupToken var mı kontrol et (sessionStorage veya query param)
      this.setupToken = this.setupToken || sessionStorage.getItem('community_setup_token') || '';
      const storedEmail = sessionStorage.getItem('community_register_email');
      if (this.setupToken) {
        if (storedEmail) {
          this.comLeadMail = storedEmail; // Sadece başkan e-postası 1. adımdaki mail ile dolar
        }
        this.step = 3;
      } else if (storedEmail) {
        this.comLeadMail = storedEmail;
        this.step = 3;
      } else {
        this.toastService.show(
          'Lütfen önce 1. adımı (e-posta ve şifre) tamamlayıp e-postanızı doğrulayın.',
          'error'
        );
        this.step = 0;
      }
    } else if (stepParam === '2') {
      this.step = 2;
    } else if (stepParam === '1') {
      this.step = 1;
    } else {
      this.step = 0;
    }
  }

  /** Intro ekranından kayıt sürecine (Adım 1) geç */
  startRegistration(): void {
    this.step = 1;
  }

  validateEmail(event: any): void {
    const val = (event.target as HTMLInputElement).value.trim();
    this.email = val;
    if (!val) {
      this.emailError = false;
      return;
    }
    this.emailError = val.includes('@') && !val.endsWith('.edu.tr');
  }

  /** Şifre kabul şartlarını kontrol et (öğrenci kayıt ile aynı kurallar) */
  private validatePasswordStrength(pwd: string): void {
    this.passwordMinLength = pwd.length >= 8;
    this.passwordHasUppercase = /[A-Z]/.test(pwd);
    this.passwordHasLowercase = /[a-z]/.test(pwd);
    this.passwordHasNumber = /[0-9]/.test(pwd);
    this.passwordHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?.]/.test(pwd);
  }

  get isPasswordStrong(): boolean {
    return (
      this.passwordMinLength &&
      this.passwordHasUppercase &&
      this.passwordHasLowercase &&
      this.passwordHasNumber &&
      this.passwordHasSpecial
    );
  }

  checkPasswords(event: any, type: 'p1' | 'p2'): void {
    const val = (event.target as HTMLInputElement).value;
    if (type === 'p1') {
      this.password = val;
      this.hasPasswordInput = val.length > 0;
      this.validatePasswordStrength(val);
    } else {
      this.confirmPassword = val;
    }
    this.passwordMismatch = !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  onBannerSelected(imageUrl: string): void {
    this.bannerPreviewUrl = imageUrl;
  }

  onLogoSelected(imageUrl: string): void {
    this.logoPreviewUrl = imageUrl;
  }

  private readonly maxImageSizeBytes = 1 * 1024 * 1024; // 1 MB

  onBannerFileSelected(file: File): void {
    if (file.size > this.maxImageSizeBytes) {
      this.toastService.show(
        'Banner görseli 1 MB\'dan büyük olamaz. Lütfen daha küçük bir dosya seçin.',
        'error'
      );
      return;
    }
    this.bannerFile = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.bannerPreviewUrl = (e.target?.result as string) || '';
    };
    reader.readAsDataURL(file);
  }

  onLogoFileSelected(file: File): void {
    if (file.size > this.maxImageSizeBytes) {
      this.toastService.show(
        'Logo 1 MB\'dan büyük olamaz. Lütfen daha küçük bir dosya seçin.',
        'error'
      );
      return;
    }
    this.logoFile = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.logoPreviewUrl = (e.target?.result as string) || '';
    };
    reader.readAsDataURL(file);
  }

  submitStep1(event: Event): void {
    event.preventDefault();
    if (this.isLoading) return;

    if (!this.email?.trim()) {
      this.toastService.show('E-posta adresi giriniz.', 'error');
      return;
    }
    if (this.emailError) {
      this.toastService.show('Geçerli bir .edu.tr e-posta adresi giriniz.', 'error');
      return;
    }
    if (!this.password) {
      this.toastService.show('Şifre giriniz.', 'error');
      return;
    }
    if (!this.isPasswordStrong) {
      this.toastService.show(
        'Şifre, tüm kabul şartlarını sağlamalıdır (en az 8 karakter, büyük/küçük harf, rakam ve özel karakter).',
        'error'
      );
      return;
    }
    if (this.passwordMismatch || this.password !== this.confirmPassword) {
      this.toastService.show('Şifreler eşleşmiyor.', 'error');
      return;
    }

    this.isLoading = true;
    const fullName = this.email.split('@')[0] || 'Topluluk Yetkilisi';
    this.authService
      .registerCommunity({
        name: fullName,
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        next: () => {
          sessionStorage.setItem('community_register_email', this.email.trim());
          sessionStorage.setItem('community_register_return', '/community-register?step=3');
          this.toastService.show(
            'Doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol edin.',
            'success'
          );
          this.router.navigate(['/email-verification-waiting'], {
            queryParams: { email: this.email.trim(), flow: 'community', step: 2 },
          });
        },
        error: (err) => {
          this.isLoading = false;
          const msg = err?.error?.message || err?.message || 'Kayıt sırasında bir hata oluştu.';
          this.toastService.show(msg, 'error');
          Logger.error('Topluluk kayıt hatası:', err);
        },
        complete: () => {
          this.isLoading = false;
        },
      });
  }

  submitStep3(event: Event): void {
    event.preventDefault();
    if (this.isLoading) return;

    if (!this.comName?.trim()) {
      this.toastService.show('Topluluk adı zorunludur.', 'error');
      return;
    }
    if (!this.comCategory?.trim()) {
      this.toastService.show('Kategori seçiniz.', 'error');
      return;
    }
    if (!this.miniAbout?.trim()) {
      this.toastService.show('Kısa açıklama zorunludur.', 'error');
      return;
    }
    if (!this.about?.trim()) {
      this.toastService.show('Topluluk hakkında açıklaması zorunludur.', 'error');
      return;
    }
    if (!this.city?.trim()) {
      this.toastService.show('Şehir seçiniz.', 'error');
      return;
    }
    if (!this.university?.trim()) {
      this.toastService.show('Üniversite adı giriniz.', 'error');
      return;
    }
    if (!this.comLeadMail?.trim()) {
      this.toastService.show('Topluluk başkanı e-postası zorunludur.', 'error');
      return;
    }
    if (!this.comMail?.trim()) {
      this.toastService.show('Topluluk iletişim e-postası zorunludur.', 'error');
      return;
    }
    if (!this.bannerFile) {
      this.toastService.show('Lütfen topluluk kapak görseli (banner) yükleyin.', 'error');
      return;
    }
    if (!this.logoFile) {
      this.toastService.show('Lütfen topluluk logosu yükleyin.', 'error');
      return;
    }

    this.isLoading = true;

    // Banner ve Logo: Placeholder (kısa ID) göndermiyoruz; yükleme sonrası backend Guid path atayacak. Kısa path kaydedilirse banner görüntülenmez.
    const bannerUrl = undefined;
    const logoUrl = undefined;

    const dto: CreateCommunityDto = {
      comName: this.comName.trim(),
      comCategory: this.comCategory || undefined,
      comAbout: this.about?.trim() || undefined,
      city: this.city.trim(),
      university: this.university.trim(),
      comMail: this.comMail?.trim(),
      comLeadMail: this.comLeadMail.trim(),
      webSiteUrl: this.webSiteUrl?.trim() || undefined,
      instagramUrl: this.instagramUrl?.trim() || undefined,
      bannerUrl,
      logoUrl,
      miniAbout: this.miniAbout?.trim() || undefined,
      isActivity: false, // Onay bekleyen; ilgili şehir kurumsal dashboard'da onaylanacak
    };

    // SetupToken varsa complete-community-setup kullan (hesap+topluluk birlikte oluşturulur)
    const token = this.setupToken || sessionStorage.getItem('community_setup_token') || '';

    if (token) {
      // --- YENI AKIŞ: complete-community-setup ---
      // Backend topluluk oluşturduktan sonra "Topluluğunuz hala onay aşamasındadır" hatası fırlatır.
      // Bu hata beklenen bir durumdur: topluluk VE kullanıcı veritabanında oluşturulmuştur.
      // Hata mesajını kontrol edip başarılı kayıt olarak ele alıyoruz.
      this.authService.completeCommunitySetup(token, dto).subscribe({
        next: (response: any) => {
          const communityId = response?.community?.communityId ?? response?.community?.CommunityId ?? response?.communityId;
          sessionStorage.removeItem('community_setup_token');
          sessionStorage.removeItem('community_register_email');
          sessionStorage.removeItem('community_register_return');
          // Backend bazen accessToken döndürmez (örn. onay bekleyen durum); token yoksa banner/logo 401 alır.
          // Görsel yüklemeden hemen önce token varsa kaydet ki istekler Authorization ile gitsin.
          const token = response?.accessToken ?? response?.AccessToken ?? response?.token ?? response?.Token;
          if (token) {
            this.authService.saveToken(token);
          }
          this.uploadBannerAndLogoThenSuccess(communityId);
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || '';
          const msgLower = msg.toLowerCase();

          // Backend topluluk oluşturduktan sonra "onay aşamasındadır" hatası fırlatır.
          // Bu BEKLENEN bir durumdur — topluluk başarıyla oluşturuldu ama onay bekliyor.
          if (
            msgLower.includes('onay') ||
            msgLower.includes('aşamasındadır') ||
            msgLower.includes('approval')
          ) {
            sessionStorage.removeItem('community_setup_token');
            sessionStorage.removeItem('community_register_email');
            sessionStorage.removeItem('community_register_return');
            // Hata branch'te communityId yok; görsel yüklemesi atlanır
            this.onCommunitySetupSuccess();
          } else {
            // Gerçek hata (validation, token geçersiz, vb.)
            this.isLoading = false;
            this.toastService.show(msg || 'Topluluk oluşturulurken bir hata oluştu.', 'error');
            Logger.error('Topluluk kurulum hatası:', err);
          }
        },
      });
    } else {
      // --- FALLBACK: Eski akış (zaten giriş yapmış kullanıcı için) ---
      this.communityService.createCommunity(dto).subscribe({
        next: (createdCommunity) => {
          sessionStorage.removeItem('community_register_email');
          sessionStorage.removeItem('community_register_return');
          this.uploadBannerAndLogoThenSuccess(createdCommunity?.id ?? '');
        },
        error: (err) => {
          this.isLoading = false;
          if (err?.status === 401) {
            this.toastService.show(
              'Oturum açmanız gerekiyor. Lütfen giriş yapıp tekrar deneyin.',
              'error'
            );
            this.router.navigate(['/community-login'], {
              queryParams: { next: '/community-register?step=3' },
            });
            return;
          }
          const msg =
            err?.error?.message || err?.message || 'Topluluk oluşturulurken bir hata oluştu.';
          this.toastService.show(msg, 'error');
          Logger.error('Topluluk oluşturma hatası:', err);
        },
      });
    }
  }

  /** Dosya adından uzantı al (örn. "foto.jpg" -> "jpg"). Varsayılan: "jpg" */
  private getFileExtension(fileName: string): string {
    if (!fileName?.includes('.')) return 'jpg';
    return fileName.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  }

  /** Banner/Logo URL için kısa benzersiz id (MaxLength 255 uyumlu). */
  private getUniqueImageId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Topluluk oluşturulduktan sonra banner/logo dosyalarını sunucuya sırayla yükler (paralel yükleme ikinci update'in birincisini ezmesin diye).
   */
  private uploadBannerAndLogoThenSuccess(communityId: string): void {
    if (!communityId) {
      this.onCommunitySetupSuccess();
      return;
    }
    const banner$ = this.bannerFile
      ? this.communityService.uploadBanner(communityId, this.bannerFile).pipe(
          catchError((err) => {
            Logger.error('Banner yüklenirken hata:', err);
            return of(null);
          })
        )
      : of(null);
    const logo$ = this.logoFile
      ? this.communityService.uploadLogo(communityId, this.logoFile).pipe(
          catchError((err) => {
            Logger.error('Logo yüklenirken hata:', err);
            return of(null);
          })
        )
      : of(null);
    banner$.pipe(switchMap(() => logo$)).subscribe({
      next: () => this.onCommunitySetupSuccess(),
      error: () => this.onCommunitySetupSuccess(),
    });
  }

  /**
   * Topluluk başarıyla oluşturulduktan sonra (onay bekliyor).
   * Kullanıcıyı bilgilendir ve community-login'deki pending ekranına yönlendir.
   */
  private onCommunitySetupSuccess(): void {
    this.isLoading = false;

    // Topluluk yeni oluşturuldu → ComConfirm=0, IsActivity=false
    localStorage.setItem('community_approved', JSON.stringify(false));

    // Toast veya yönlendirme yok — başarı ekranını göster
    this.showRegistrationSuccess = true;
  }
}
