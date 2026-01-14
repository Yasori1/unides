import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderBrandingComponent } from '../header-branding/header-branding.component';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-site-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, HeaderBrandingComponent],
  templateUrl: './site-navbar.component.html',
  styleUrls: ['./site-navbar.component.scss'],
})
export class SiteNavbarComponent implements OnInit {
  isMobileMenuOpen = false;
  isLoggedIn = false;
  userRole: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.userRole = this.authService.getUserType();
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
