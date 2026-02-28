import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

export interface Developer {
  name: string;
  role: string;
  image: string;
  codeBg: string; // Background code snippet
  description?: string; // Detaylı görev açıklaması
  socialLinks: SocialLinks;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
}

export interface Alumni {
  name: string;
  socialLinks?: SocialLinks;
}

@Component({
  selector: 'app-developers-page',
  standalone: true,
  imports: [CommonModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './developers-page.component.html',
  styleUrls: ['./developers-page.component.scss'],
})
export class DevelopersPageComponent implements OnInit, OnDestroy {
  developers: Developer[] = [
    {
      name: 'Emircan Sazlı',
      role: 'Proje Yürütücüsü',
      image: 'assets/EmircanSazli.png',
      codeBg: 'void main() { init_core(); }',
      description:
        'Projenin genel mimarisini tasarlayan sistemin temel yapısını oluşturarak, ölçeklenebilir ve sürdürülebilir bir altyapı kurdu.',
      socialLinks: { linkedin: '#', github: '#' },
    },
    {
      name: 'Alper Uğur Acar',
      role: 'İş Analisti ',
      image: 'assets/alperuguracar.png',
      codeBg: 'import { crystal } from "unides"',
      description:
        'Veritabanı geliştiricisi olarak veri modelleri tasarladı, performanslı ve güvenli veritabanları geliştirdi; sistemlerin sürdürülebilirliğine katkı sağladı.',
      socialLinks: { linkedin: '#', github: '#' },
    },
    {
      name: 'Safa Rahman Cenkci',
      role: 'Frontend Takım Lideri',
      image: 'assets/safarahmancenkci.png',
      codeBg: 'SELECT * FROM futures',
      description:
        'Frontend ekibini yöneten ve kullanıcı arayüzü geliştirmelerini koordine eden takım lideri. Modern web teknolojileri ile kullanıcı deneyimini optimize ediyor.',
      socialLinks: { linkedin: '#', github: '#' },
    },
    {
      name: 'Abdullah Gönç',
      role: 'Frontend Geliştirici',
      image: 'assets/abdullahgonc.png',
      codeBg: 'while(true) { innovate(); }',
      description:
        'Gençlere yönelik frontend geliştirmelerinde aktif rol aldım. Responsive, performans odaklı ve kullanıcı dostu arayüzler kodladım, ölçeklenebilir frontend yapıları oluşturdum.',
      socialLinks: { linkedin: '#', github: '#' },
    },
    {
      name: 'Hüseyin Eren Çeykel',
      role: 'Database Sorumlusu',
      image: 'assets/huseyinceykel.png',
      codeBg: 'Flutter.run()',
      description:
        ' İş ihtiyaçlarına uygun tablolar ve veri modelleri oluşturdu; veritabanı fonksiyonları, prosedürleri ve metotları geliştirerek sorgu performansını artırdı, güvenli ve ölçeklenebilir bir sistem yapısı sağladı.',
      socialLinks: { linkedin: '#', github: '#' },
    },
    {
      name: 'Oğuzhan Akkoç',
      role: 'Backend Geliştirici',
      image: 'assets/oguzhanakkoc.png',
      codeBg: 'import pandas as pd',
      description:
        'Sunucu tarafı geliştirmelerini yapan backend geliştirici. API tasarımı ve veri işleme mantığını geliştiriyor.',
      socialLinks: { linkedin: '#', github: '#' },
    },
    {
      name: 'Yunus Emre Güler',
      role: 'Yapay Zeka Geliştiricisi',
      image: 'assets/yunusemreguler.webp',
      codeBg: 'docker-compose up -d',
      description:
        'Yapay zeka modelleri ve algoritmaları geliştiren AI uzmanı. Makine öğrenmesi çözümleri ile projeye değer katıyor.',
      socialLinks: { linkedin: '#', github: '#' },
    },
    {
      name: 'Ali Kadir Güzel',
      role: 'Yapay Zeka Geliştiricisi',
      image: 'assets/alikadirguzel.png',
      codeBg: 'expect(result).toBe(true)',
      description:
        'Yapay zeka teknolojileri ile akıllı sistemler geliştiren AI geliştirici. NLP ve makine öğrenmesi alanlarında çalışıyor.',
      socialLinks: { linkedin: '#', github: '#' },
    },
    {
      name: 'Hamza Ketenci',
      role: 'Full Stack Geliştirici',
      image: 'assets/hamzaketenci.png',
      codeBg: '.design { beauty: true; }',
      description:
        'Hem frontend hem backend geliştirme yapan full stack geliştirici. Projenin tüm katmanlarında aktif rol alıyor.',
      socialLinks: { linkedin: '#', github: '#' },
    },
    {
      name: 'Burak Erken',
      role: 'Full Stack Geliştirici',
      image: 'assets/burakerken.png',
      codeBg: 'const future = await build();',
      description:
        'Uçtan uca geliştirme yapan full stack geliştirici. Frontend ve backend entegrasyonlarını sağlayarak, bütünsel çözümler üretiyor.',
      socialLinks: { linkedin: '#', github: '#' },
    },
  ];

  heroMoveX = 50;
  heroMoveY = 50;
  private mouseMoveListener: any;

  isAlumniExpanded = false;

  toggleAlumni() {
    this.isAlumniExpanded = !this.isAlumniExpanded;
  }

  alumni: Alumni[] = [
    { name: 'Ahmet Berkan Çiçek', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Yunus Yaman', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Yaşar Eren Güre', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Derya Gökçeli', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Melikhan Atay', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Melike Kuyucaklıoğlu', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Mehmet Sezer Altun', socialLinks: { linkedin: '#', github: '#' } },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.mouseMoveListener = (e: MouseEvent) => {
        this.heroMoveX = (e.clientX / window.innerWidth) * 100;
        this.heroMoveY = (e.clientY / window.innerHeight) * 100;
      };
      window.addEventListener('mousemove', this.mouseMoveListener);

      // Simple Observer for scroll reveal
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        },
        { threshold: 0.1 }
      );

      setTimeout(() => {
        document.querySelectorAll('.dev-cell, .stat-card').forEach((el) => observer.observe(el));
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
    }
  }
}
