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
      src: 'assets/img/logo.png',
      alt: 'Unides Logo',
      title: 'Unides',
    },
    description:
      'Gençlik Hizmetleri Genel Müdürlüğünce ÜNİDES Projesi kapsamında desteklenmektedir.',
    copyright: '© 2024 Unides. Tüm hakları saklıdır.',
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
      title: 'Kurumsal',
      links: [
        { name: 'Hakkımızda', href: '/about' },
        { name: 'Nasıl Çalışır?', href: '/how-it-works' },
        { name: 'İletişim', href: '/contact' },
        { name: 'Gizlilik Sözleşmesi', href: '/privacy-policy' },
      ],
    },
    {
      title: 'Kullanıcı',
      links: [
        { name: 'Giriş Yap', href: '/login' },
        { name: 'Kayıt Ol', href: '/register' },
        { name: 'Hesabım', href: '/profile' },
        { name: 'Kullanım Şartları', href: '/terms-conditions' },
      ],
    },
    {
      title: 'Destek & İletişim',
      links: [
        { name: 'Sıkça Sorulan Sorular', href: '/faq' },
        { name: 'Yardım Merkezi', href: '/help' },
        { name: 'info@unides.com', href: 'mailto:info@unides.com' },
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
