import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header-branding',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header-branding.component.html',
  styleUrls: ['./header-branding.component.scss']
})
export class HeaderBrandingComponent {
  @Input() isMobileMenuOpen = false;
  @Output() toggleMenu = new EventEmitter<void>();

  onToggleMenu() {
    this.toggleMenu.emit();
  }
}
