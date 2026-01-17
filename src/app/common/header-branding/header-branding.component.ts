import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../../services/auth.services';
import { CommunityService } from '../../services/community.services';
import { Subscription, filter, forkJoin, of } from 'rxjs';
import { switchMap, catchError, take } from 'rxjs/operators';

@Component({
  selector: 'app-header-branding',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header-branding.component.html',
  styleUrls: ['./header-branding.component.scss']
})
export class HeaderBrandingComponent implements OnInit, OnDestroy {
  @Input() isMobileMenuOpen = false;
  @Output() toggleMenu = new EventEmitter<void>();

  isLoggedIn = false;
  userRole: string | null = null;
  isProfileOpen = false;
  userName: string = '';
  userInitial: string = '';
  displayName: string = ''; // Gösterilecek isim (kullanıcı adı veya topluluk adı)
  isInitialized = false; // Auth durumu kontrol edilene kadar navbar'ı gizle
  isCommunityNameLoaded = false; // Topluluk adı yüklenene kadar profil bilgisini gizle
  private routerSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private communityService: CommunityService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // İlk kontrolü yap
    this.checkLoginStatus();

    // Router events'i dinle - sayfa değiştiğinde login durumunu kontrol et
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Kısa bir gecikme ile kontrol et (localStorage güncellemelerinin tamamlanması için)
        setTimeout(() => {
          this.checkLoginStatus();
        }, 0);
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  checkLoginStatus() {
    const wasLoggedIn = this.isLoggedIn;
    const oldUserRole = this.userRole;

    this.isLoggedIn = this.authService.isAuthenticated();
    const rawUserType = this.authService.getUserType();
    
    // userType'ı normalize et: '1'/'student' → 'student', '2'/'corporate' → 'corporate', '3'/'community' → 'community'
    if (rawUserType === '1' || rawUserType === 'student') {
      this.userRole = 'student';
    } else if (rawUserType === '2' || rawUserType === 'corporate') {
      this.userRole = 'corporate';
    } else if (rawUserType === '3' || rawUserType === 'community') {
      this.userRole = 'community';
    } else {
      this.userRole = rawUserType;
    }

    // Kullanıcı bilgilerini al
    if (this.isLoggedIn) {
      const user = this.authService.getUser();
      this.userName = user?.name || user?.fullName || 'Kullanıcı';

      // Topluluk kullanıcısı ise topluluk adını göster
      if (this.userRole === 'community') {
        this.isCommunityNameLoaded = false; // Yükleme başladı, henüz tamamlanmadı
        this.loadCommunityName();
      } else {
        // Öğrenci veya Kurumsal için kullanıcı adını göster
        this.displayName = this.userName;
        this.userInitial = this.userName.charAt(0).toUpperCase();
        this.isCommunityNameLoaded = true; // Topluluk değil, direkt göster
      }
    } else {
      this.userName = '';
      this.displayName = '';
      this.userInitial = '';
      this.isCommunityNameLoaded = false; // Logout olduğunda sıfırla
    }
    
    // İlk kontrol tamamlandı, navbar'ı göster
    if (!this.isInitialized) {
      this.isInitialized = true;
    }

    // Değerler değiştiyse change detection'ı tetikle
    if (wasLoggedIn !== this.isLoggedIn || oldUserRole !== this.userRole || !this.isInitialized) {
      this.cdr.detectChanges();
    }
  }

  loadCommunityName() {
    // Önce localStorage'da topluluk bilgisi var mı kontrol et
    const communityInfoStr = localStorage.getItem('community_info');
    if (communityInfoStr) {
      try {
        const communityInfo = JSON.parse(communityInfoStr);
        if (communityInfo.name) {
          this.displayName = communityInfo.name;
          this.userInitial = communityInfo.name.charAt(0).toUpperCase();
          this.isCommunityNameLoaded = true; // Yükleme tamamlandı
          this.cdr.detectChanges();
          return;
        }
      } catch (e) {
        console.error('Error parsing community info:', e);
      }
    }

    // localStorage'da yoksa backend'den çek
    const user = this.authService.getUser();
    const userEmail = user?.email?.trim().toLowerCase();

    if (!userEmail) {
      // Email yoksa kullanıcı adını göster
      this.displayName = this.userName;
      this.userInitial = this.userName.charAt(0).toUpperCase();
      this.isCommunityNameLoaded = true; // Yükleme tamamlandı (fallback)
      this.cdr.detectChanges();
      return;
    }

    // Aktif toplulukları getir ve kullanıcının topluluğunu bul
    this.communityService.getAllCommunities({ status: 'active' }).pipe(
      take(1),
      switchMap((communities) => {
        if (!communities || communities.length === 0) {
          return of(null);
        }

        // Tüm toplulukların detaylarını paralel olarak çek
        const detailRequests = communities.map((community) =>
          this.communityService.getCommunityById(community.id).pipe(
            catchError(() => of(null)),
            take(1)
          )
        );

        return forkJoin(detailRequests).pipe(
          take(1),
          switchMap((details) => {
            // Kullanıcının e-postasının bir topluluğun ComLeadMail'i ile eşleşip eşleşmediğini kontrol et
            const matchingCommunity = details.find(
              (detail) =>
                detail && detail.comLeadMail?.trim().toLowerCase() === userEmail
            );

            return of(matchingCommunity || null);
          })
        );
      }),
      catchError(() => {
        return of(null);
      })
    ).subscribe({
      next: (matchingCommunity) => {
        if (matchingCommunity) {
          // Community interface'inde 'name' property'si var, 'comName' yok
          this.displayName = matchingCommunity.name || 'Topluluk';
          this.userInitial = this.displayName.charAt(0).toUpperCase();
          // localStorage'a kaydet (gelecek seferler için)
          localStorage.setItem('community_info', JSON.stringify({
            name: this.displayName,
            id: matchingCommunity.id
          }));
        } else {
          // Topluluk bulunamazsa kullanıcı adını göster
          this.displayName = this.userName;
          this.userInitial = this.userName.charAt(0).toUpperCase();
        }
        this.isCommunityNameLoaded = true; // Yükleme tamamlandı
        this.cdr.detectChanges();
      },
      error: () => {
        // Hata durumunda kullanıcı adını göster
        this.displayName = this.userName;
        this.userInitial = this.userName.charAt(0).toUpperCase();
        this.isCommunityNameLoaded = true; // Yükleme tamamlandı (hata durumu)
        this.cdr.detectChanges();
      }
    });
  }

  onToggleMenu() {
    this.toggleMenu.emit();
  }

  toggleProfileDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.isProfileOpen = !this.isProfileOpen;
    // Change detection'ı tetikle
    this.cdr.detectChanges();
  }

  handleSettingsClick() {
    this.isProfileOpen = false;
    // Kullanıcı rolüne göre dashboard'a yönlendir
    if (this.userRole === 'student') {
      this.router.navigate(['/profile'], { queryParams: { tab: 'settings' } });
    } else if (this.userRole === 'corporate') {
      this.router.navigate(['/corporate-dashboard'], { queryParams: { tab: 'settings' } });
    } else if (this.userRole === 'community') {
      this.router.navigate(['/community-dashboard'], { queryParams: { tab: 'settings' } });
    }
  }

  handleLogoutClick() {
    this.isProfileOpen = false;
    this.logout();
  }

  logout() {
    // Local storage'ı temizle
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_type');
    localStorage.removeItem('community_info'); // Topluluk bilgisini de temizle
    // Anasayfaya yönlendir
    this.router.navigate(['/']).then(() => {
      // Sayfa yüklendikten sonra login durumunu güncelle
      setTimeout(() => {
        this.checkLoginStatus();
      }, 100);
    });
  }

  navigateToDashboard() {
    this.isProfileOpen = false;
    // Dashboard'a yönlendir
    if (this.userRole === 'student') {
      this.router.navigate(['/student-dashboard']);
    } else if (this.userRole === 'corporate') {
      this.router.navigate(['/corporate-dashboard']);
    } else if (this.userRole === 'community') {
      this.router.navigate(['/community-dashboard']);
    }
  }

  getRoleDisplayName(): string {
    switch (this.userRole) {
      case 'student':
        return 'Öğrenci';
      case 'corporate':
        return 'Kurumsal';
      case 'community':
        return 'Topluluk';
      default:
        return 'Kullanıcı';
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Profil dropdown kontrolü - profile-info veya profile-wrapper içindeki tıklamaları kontrol et
    if (!target.closest('.profile-wrapper') && !target.closest('.profile-dropdown') && !target.closest('.profile-info')) {
      this.isProfileOpen = false;
    }
  }
}
