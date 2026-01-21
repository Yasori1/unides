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

export interface Alumni {
  name: string;
  socialLinks?: SocialLinks;
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
      name: 'Emircan Sazlı',
      role: 'Baş Mimar',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      codeBg: 'void main() { init_core(); }',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Alper Uğur Acar',
      role: 'Shader & Arayüz',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      codeBg: 'import { crystal } from "unides"',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Safa Rahman Cenkci',
      role: 'Backend Motoru',
      image: 'https://randomuser.me/api/portraits/men/15.jpg',
      codeBg: 'SELECT * FROM futures',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Abdullah Gönç',
      role: 'Güvenlik Operasyonları',
      image: 'https://randomuser.me/api/portraits/women/28.jpg',
      codeBg: 'while(true) { innovate(); }',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Hüseyin Çeykel',
      role: 'Mobil Geliştirici',
      image: 'https://randomuser.me/api/portraits/men/22.jpg',
      codeBg: 'Flutter.run()',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Oğuzhan Akkoç',
      role: 'Veri Bilimci',
      image: 'https://randomuser.me/api/portraits/women/33.jpg',
      codeBg: 'import pandas as pd',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Yunus Emre Güler',
      role: 'DevOps Mühendisi',
      image: 'https://randomuser.me/api/portraits/men/47.jpg',
      codeBg: 'docker-compose up -d',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Ali Kadir Güzel',
      role: 'QA Test Uzmanı',
      image: 'https://randomuser.me/api/portraits/women/50.jpg',
      codeBg: 'expect(result).toBe(true)',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Hamza Ketenci',
      role: 'UI/UX Tasarımcı',
      image: 'https://randomuser.me/api/portraits/men/18.jpg',
      codeBg: '.design { beauty: true; }',
      socialLinks: { linkedin: '#', github: '#' }
    },
    {
      name: 'Burak Erken',
      role: 'Full Stack Geliştirici',
      image: 'https://randomuser.me/api/portraits/men/25.jpg',
      codeBg: 'const future = await build();',
      socialLinks: { linkedin: '#', github: '#' }
    }
  ];

  heroMoveX = 50;
  heroMoveY = 50;
  private mouseMoveListener: any;

  isAlumniExpanded = false;

  toggleAlumni() {
    this.isAlumniExpanded = !this.isAlumniExpanded;
  }

  alumni: Alumni[] = [
    { name: 'Eski Geliştirici 1', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Eski Geliştirici 2', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Eski Geliştirici 3', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Eski Tasarımcı 1', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Testçi Arkadaş', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Eski Geliştirici 4', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Eski Geliştirici 5', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Eski Tasarımcı 2', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Eski Geliştirici 6', socialLinks: { linkedin: '#', github: '#' } }
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
