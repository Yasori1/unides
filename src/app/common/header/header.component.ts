import { Component, HostListener, Input, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { HeadroomModule } from '@ctrl/ngx-headroom';
import { trigger, transition, style, animate } from '@angular/animations';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLink, HeadroomModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  animations: [
    // Framer Motion 'Spring' efektinin Angular karşılığı
    trigger('dropdownAnim', [
      // Başlangıçta biraz aşağıda ve şeffaf
      transition(':enter', [
        style({ opacity: 0, transform: 'translate(-50%, 10px) scale(0.95)' }),
        animate(
          '400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({ opacity: 1, transform: 'translate(-50%, 0) scale(1)' })
        ),
      ]),
      // Kapanırken hafifçe aşağı kaybolur
      transition(':leave', [
        animate(
          '150ms ease-in',
          style({ opacity: 0, transform: 'translate(-50%, 10px) scale(0.95)' })
        ),
      ]),
    ]),
    // Hover Pill (Gri Yuvarlak) Efekti
    trigger('pillAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' })),
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

  constructor(
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Eğer showProfile input olarak verilmediyse, localStorage'dan kontrol et
    if (this.showProfile === undefined) {
      this.checkLoginStatus();
      
      // Router events'i dinle, sayfa değiştiğinde tekrar kontrol et
      this.routerSubscription = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.checkLoginStatus();
        });
    } else {
      this._showProfile = this.showProfile;
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private checkLoginStatus(): void {
    if (isPlatformBrowser(this.platformId)) {
      const authToken = localStorage.getItem('auth_token');
      const userType = localStorage.getItem('user_type');
      
      // Öğrenci girişi yapılmışsa (user_type === '1' veya 'student' ve token varsa)
      if (authToken && (userType === '1' || userType === 'student')) {
        this._showProfile = true;
      } else {
        this._showProfile = false;
      }
    }
  }

  get shouldShowProfile(): boolean {
    // Input verilmişse onu kullan, yoksa localStorage kontrolünden gelen değeri kullan
    return this.showProfile !== undefined ? this.showProfile : this._showProfile;
  }

  // Menü üzerine gelince aktifleştir
  setActive(item: string | null) {
    this.activeItem = item;
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
}
