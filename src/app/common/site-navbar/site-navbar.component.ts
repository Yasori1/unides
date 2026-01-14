import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderBrandingComponent } from '../header-branding/header-branding.component';

@Component({
  selector: 'app-site-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, HeaderBrandingComponent],
  templateUrl: './site-navbar.component.html',
  styleUrls: ['./site-navbar.component.scss'],
})
export class SiteNavbarComponent {
  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
}
