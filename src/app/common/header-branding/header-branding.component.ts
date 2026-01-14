import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../../services/auth.services';
import { Subscription, filter } from 'rxjs';

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
    
    // Değerler değiştiyse change detection'ı tetikle
    if (wasLoggedIn !== this.isLoggedIn || oldUserRole !== this.userRole) {
      this.cdr.detectChanges();
    }
  }

  onToggleMenu() {
    this.toggleMenu.emit();
  }
}
