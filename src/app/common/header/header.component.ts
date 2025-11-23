import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HeadroomModule } from '@ctrl/ngx-headroom';
import { trigger, transition, style, animate } from '@angular/animations';

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
export class HeaderComponent {
  activeItem: string | null = null;
  classApplied = false; // Mobil menü için
  isSticky: boolean = false;

  constructor(public router: Router) {}

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
