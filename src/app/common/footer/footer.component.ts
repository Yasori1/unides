import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  // Footer Genel Bilgileri
  footerData = {
    logo: {
      src: 'images/logo.png',
      alt: 'ÜNİDES Logo',
      title: 'ÜNİDES',
    },
    description:
      'Bu Portal T.C. Gençlik ve Spor Bakanlığı Gençlik Hizmetleri Genel Müdürlüğünce desteklenmektedir.',
    copyright: '© 2026 ÜNİDES. Tüm hakları saklıdır.',
  };

  // Sosyal Medya Linkleri
  socialLinks = [
    { icon: 'bx bxl-instagram', href: '#', label: 'Instagram' },
    { icon: 'bx bxl-twitter', href: '#', label: 'Twitter' },
    { icon: 'bx bxl-linkedin', href: '#', label: 'LinkedIn' },
    { icon: 'bx bxl-youtube', href: '#', label: 'Youtube' },
  ];

  // Footer Link Grupları
  sections = [
    {
      title: 'Destek & İletişim',
      links: [
        { name: 'Sıkça Sorulan Sorular', href: '/faq' },
        { name: 'İletişim', href: '/contact' },
        { name: 'bilgi@unidesportal.org', href: 'mailto:bilgi@unidesportal.org' },
        { name: '(0312) 551 70 00', href: 'tel:+903125517000' },
      ],
    },
  ];

  // --- Back To Top Fonksiyonelliği ---
  isShow: boolean = false;
  topPosToStartShowing = 100;

  @HostListener('window:scroll')
  checkScroll() {
    const scrollPosition =
      window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isShow = scrollPosition >= this.topPosToStartShowing;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
