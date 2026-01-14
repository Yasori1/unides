import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.services';

@Component({
  selector: 'app-header-branding',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header-branding.component.html',
  styleUrls: ['./header-branding.component.scss']
})
export class HeaderBrandingComponent implements OnInit {
  @Input() isMobileMenuOpen = false;
  @Output() toggleMenu = new EventEmitter<void>();

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

  onToggleMenu() {
    this.toggleMenu.emit();
  }
}
