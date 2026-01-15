import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderBrandingComponent } from '../header-branding/header-branding.component';
import { AuthService } from '../../services/auth.services';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-site-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, HeaderBrandingComponent],
  templateUrl: './site-navbar.component.html',
  styleUrls: ['./site-navbar.component.scss'],
})
export class SiteNavbarComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  isLoggedIn = false;
  userRole: string | null = null;
  isInitialized = false; // Auth durumu kontrol edilene kadar navbar'ı gizle
  private routerSubscription?: Subscription;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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
    this.userRole = this.authService.getUserType();
    
    // İlk kontrol tamamlandı, navbar'ı göster
    if (!this.isInitialized) {
      this.isInitialized = true;
    }
    
    // Değerler değiştiyse change detection'ı tetikle
    if (wasLoggedIn !== this.isLoggedIn || oldUserRole !== this.userRole || !this.isInitialized) {
      this.cdr.detectChanges();
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
  
  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.isMobileMenuOpen = false;
  }
}
