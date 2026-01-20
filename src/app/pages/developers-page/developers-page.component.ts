import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

export interface Developer {
  name: string;
  role: string;
  image: string;
  codeBg: string; // Background code snippet
  socialLinks: SocialLinks;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
}

@Component({
  selector: 'app-developers-page',
  standalone: true,
  imports: [
    CommonModule,
    SiteNavbarComponent,
    SiteFooterComponent
  ],
  templateUrl: './developers-page.component.html',
  styleUrls: ['./developers-page.component.scss'],
})
export class DevelopersPageComponent implements OnInit, OnDestroy {
  developers: Developer[] = [
    {
      name: 'Safa Demirhan',
      role: 'Baş Mimar',
      image: 'assets/img/team/safa.jpg',
      codeBg: 'void main() { init_core(); }',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Zeynep Kaya',
      role: 'Shader & Arayüz',
      image: 'assets/img/team/zeynep.jpg',
      codeBg: 'import { crystal } from "unides"',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Can Demir',
      role: 'Backend Motoru',
      image: 'assets/img/team/can.jpg',
      codeBg: 'SELECT * FROM futures',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Selin Aksoy',
      role: 'Güvenlik Operasyonları',
      image: 'assets/img/team/selin.jpg',
      codeBg: 'while(true) { innovate(); }',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Oğuzhan Yılmaz',
      role: 'Mobil Geliştirici',
      image: 'assets/img/team/oguzhan.jpg',
      codeBg: 'Flutter.run()',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Elif Öztürk',
      role: 'Veri Bilimci',
      image: 'assets/img/team/elif.jpg',
      codeBg: 'import pandas as pd',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Murat Çelik',
      role: 'DevOps Mühendisi',
      image: 'assets/img/team/murat.jpg',
      codeBg: 'docker-compose up -d',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Ayşe Yıldız',
      role: 'QA Test Uzmanı',
      image: 'assets/img/team/ayse.jpg',
      codeBg: 'expect(result).toBe(true)',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Burak Şahin',
      role: 'UI/UX Tasarımcı',
      image: 'assets/img/team/burak.jpg',
      codeBg: '.design { beauty: true; }',
      socialLinks: { linkedin: '#', github: '#' }
    }
  ];

  heroMoveX = 50;
  heroMoveY = 50;
  private mouseMoveListener: any;

  alumni: string[] = [
    'Eski Geliştirici 1',
    'Eski Geliştirici 2',
    'Eski Geliştirici 3',
    'Eski Tasarımcı 1',
    'Testçi Arkadaş'
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.mouseMoveListener = (e: MouseEvent) => {
        this.heroMoveX = (e.clientX / window.innerWidth) * 100;
        this.heroMoveY = (e.clientY / window.innerHeight) * 100;
      };
      window.addEventListener('mousemove', this.mouseMoveListener);

      // Simple Observer for scroll reveal
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });

      setTimeout(() => {
        document.querySelectorAll('.dev-cell, .stat-card').forEach(el => observer.observe(el));
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
    }
  }
}
