import { NgClass, NgIf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { HeadroomModule } from '@ctrl/ngx-headroom';
<<<<<<< Updated upstream

@Component({
    selector: 'app-header',
    imports: [RouterLink, RouterLinkActive, NgClass, CarouselModule, HeadroomModule, NgIf],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {

    constructor (
        public router: Router
    ) {}
=======
import { trigger, transition, style, animate } from '@angular/animations';
import { filter, Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.services';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLink, HeadroomModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  animations: [
    // Framer Motion 'Spring' efektinin Angular karşılığı
    trigger('dropdownAnim', [
      // Başlangıçta biraz aşağıda ve şeffaf (yumuşak spring animasyon)
      transition(':enter', [
        style({ opacity: 0, transform: 'translate(-50%, -10px) scale(0.92)' }),
        animate(
          '500ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'translate(-50%, 0) scale(1)' })
        ),
      ]),
      // Kapanırken hafifçe yukarı kaybolur
      transition(':leave', [
        animate(
          '200ms cubic-bezier(0.4, 0, 1, 1)',
          style({ opacity: 0, transform: 'translate(-50%, -10px) scale(0.95)' })
        ),
      ]),
    ]),
    // Hover Pill (Gri Yuvarlak) Efekti - Daha smooth
    trigger('pillAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.85)' }),
        animate(
          '300ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'scale(1)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(0.4, 0, 1, 1)',
          style({ opacity: 0, transform: 'scale(0.9)' })
        ),
      ]),
    ]),
    // YENİ: Basit SlideDown Animasyonu
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate(
          '250ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(0.4, 0, 1, 1)',
          style({ opacity: 0, transform: 'translateY(-10px)' })
        ),
      ]),
    ]),
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() showProfile?: boolean; // Optional input, eğer verilmezse localStorage'dan kontrol edilir
  activeItem: string | null = null;
  classApplied = false; // Mobil menü için
  isSticky: boolean = false;
  private _showProfile: boolean = false;
  private routerSubscription?: Subscription;
  isLoggingOut = false;
  isProfileMenuOpen = false; // YENİ: Profile menu açık mı?

  constructor(
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private toastService: ToastService,
    private authService: AuthService
  ) {}
>>>>>>> Stashed changes

    // Language Dropdown Menu
    languageClassApplied = false;
    languageToggleClass() {
        this.languageClassApplied = !this.languageClassApplied;
    }

	// Responsive Menu Trigger
    classApplied = false;
    toggleClass() {
        this.classApplied = !this.classApplied;
    }

<<<<<<< Updated upstream
	// Search Overlay
    searchClassApplied = false;
    searchToggleClass() {
        this.searchClassApplied = !this.searchClassApplied;
=======
  private checkLoginStatus(): void {
    if (isPlatformBrowser(this.platformId)) {
      const authToken = localStorage.getItem('auth_token');
      const userType = localStorage.getItem('user_type');

      // Herhangi bir kullanıcı girişi yapılmışsa (Öğrenci/Kurumsal/Topluluk)
      // user_type: '1' = Öğrenci, '2' = Kurumsal, '3' = Topluluk
      if (authToken && userType && ['1', '2', '3', 'student', 'corporate', 'community'].includes(userType)) {
        this._showProfile = true;
      } else {
        this._showProfile = false;
      }
>>>>>>> Stashed changes
    }

<<<<<<< Updated upstream
    // Owl Carousel
    partnersSlides: OwlOptions = {
		nav: false,
		loop: true,
		dots: false,
		autoplay: true,
		smartSpeed: 500,
		autoplayHoverPause: true,
		navText: [
			"<i class='flaticon-left'></i>",
			"<i class='flaticon-right-arrow'></i>"
		],
        responsive: {
			0: {
				items: 2
			},
			515: {
				items: 3
			},
			695: {
				items: 4
			},
			935: {
				items: 5
			},
			1115: {
				items: 7
			}
		}
    }

	// Responsive Navbar Accordion
    openSectionIndex: number = -1;
    openSectionIndex2: number = -1;
    openSectionIndex3: number = -1;
    toggleSection(index: number): void {
        if (this.openSectionIndex === index) {
            this.openSectionIndex = -1;
        } else {
            this.openSectionIndex = index;
        }
    }
    toggleSection2(index: number): void {
        if (this.openSectionIndex2 === index) {
            this.openSectionIndex2 = -1;
        } else {
            this.openSectionIndex2 = index;
        }
    }
    toggleSection3(index: number): void {
        if (this.openSectionIndex3 === index) {
            this.openSectionIndex3 = -1;
        } else {
            this.openSectionIndex3 = index;
        }
    }
    isSectionOpen(index: number): boolean {
        return this.openSectionIndex === index;
    }
    isSectionOpen2(index: number): boolean {
        return this.openSectionIndex2 === index;
    }
    isSectionOpen3(index: number): boolean {
        return this.openSectionIndex3 === index;
    }

    // Navbar Sticky
    isSticky: boolean = false;
    @HostListener('window:scroll', [])
    checkScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollPosition >= 50) {
            this.isSticky = true;
        } else {
            this.isSticky = false;
        }
    }
=======

  get shouldShowProfile(): boolean {
    // Input verilmişse onu kullan, yoksa localStorage kontrolünden gelen değeri kullan
    return this.showProfile !== undefined ? this.showProfile : this._showProfile;
  }

  // Menü üzerine gelince aktifleştir
  setActive(item: string | null) {
    this.activeItem = item;
  }

  // YENİ: Profile menüyü aç/kapa
  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  // YENİ: Profile menüyü kapat
  closeProfileMenu() {
    this.isProfileMenuOpen = false;
  }

  // Dropdown içindeki click'i durdur (dışarı propagate etmesin)
  onDropdownClick(event: Event) {
    event.stopPropagation();
  }

  // YENİ: Her kullanıcı tipi için doğru profil linkini döndür
  getProfileLink(): string {
    if (isPlatformBrowser(this.platformId)) {
      const userType = localStorage.getItem('user_type');
      
      // Öğrenci
      if (userType === '1' || userType === 'student') {
        return '/student-dashboard';
      }
      // Kurumsal
      else if (userType === '2' || userType === 'corporate') {
        return '/corporate-dashboard';
      }
      // Topluluk
      else if (userType === '3' || userType === 'community') {
        return '/community-dashboard';
      }
    }
    return '/student-dashboard'; // Varsayılan
  }

  // Profile sayfasına yönlendir
  navigateToProfile() {
    const profileLink = this.getProfileLink();
    this.closeProfileMenu(); // Desktop dropdown menüyü kapat
    
    // Mobil menü açıksa kapat
    if (this.classApplied) {
      this.toggleClass();
    }
    
    this.router.navigate([profileLink]);
  }

  // Login sayfasına yönlendir
  navigateToLogin() {
    // Mobil menü açıksa kapat
    if (this.classApplied) {
      this.toggleClass();
    }
    
    this.router.navigate(['/login']);
  }

  // YENİ: Logout işlemi
  handleLogout() {
    if (this.isLoggingOut) return;
    
    this.isLoggingOut = true;
    this.closeProfileMenu();
    
    // AuthService logout
    this.authService.logout();
    this._showProfile = false;
    
    setTimeout(() => {
      this.isLoggingOut = false;
    }, 1000);
  }

  // Dışarı tıklandığında kapat
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const profileWrapper = target.closest('.profile-menu-wrapper');
    
    if (!profileWrapper && this.isProfileMenuOpen) {
      this.closeProfileMenu();
    }
  }

  // Mobil Menü Aç/Kapa
  toggleClass() {
    this.classApplied = !this.classApplied;
  }

  // Mobil Accordion Kontrolü
  openSectionIndex: number = -1;
  toggleSection(index: number): void {
    this.openSectionIndex = this.openSectionIndex === index ? -1 : index;
  }
  isSectionOpen(index: number): boolean {
    return this.openSectionIndex === index;
  }

  @HostListener('window:scroll', [])
  checkScroll() {
    this.isSticky = window.scrollY >= 50;
  }
>>>>>>> Stashed changes

}
