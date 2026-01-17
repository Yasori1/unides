import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { ProfileCardComponent } from '../../components/ui/profile-card/profile-card';
import { NeuronsBackgroundComponent } from '../../components/ui/neurons-background/neurons-background';
import { DeveloperStreamComponent } from '../../components/ui/developer-stream/developer-stream.component';

interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
}

interface Developer {
  name: string;
  title: string;
  image: string;
  work: string; // Yaptığı iş / Developladığı kısım
  description?: string; // Detaylı açıklama
  backgroundImage?: string; // Kart arka plan görseli
  socialLinks: SocialLinks;
}

@Component({
  selector: 'app-developers-page',
  standalone: true,
  imports: [
    CommonModule,
    SiteNavbarComponent,
    SiteFooterComponent,
    ProfileCardComponent,
    NeuronsBackgroundComponent,
    DeveloperStreamComponent,
  ],
  templateUrl: './developers-page.component.html',
  styleUrls: ['./developers-page.component.scss'],
})
export class DevelopersPageComponent implements OnInit {
  expandedCardIndex: number | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Geliştiriciler
  developers: Developer[] = [
    {
      name: 'Ad Soyad',
      title: 'Yazılım Geliştirici',
      image: 'assets/img/placeholder-avatar.svg',
      work: 'Backend / Frontend Geliştirme',
      description: 'Ünides projesinde yazılım geliştirme süreçlerinde yer almaktadır.',
      backgroundImage: 'assets/img/placeholder-cover.svg',
      socialLinks: {
        github: '#',
        linkedin: '#',
      },
    },
    {
      name: 'Ad Soyad',
      title: 'Yazılım Geliştirici',
      image: 'assets/img/placeholder-avatar.svg',
      work: 'Sistem Mimarisi',
      description: 'Ünides projesinde yazılım geliştirme süreçlerinde yer almaktadır.',
      backgroundImage: 'assets/img/placeholder-cover.svg',
      socialLinks: {
        github: '#',
        linkedin: '#',
      },
    },
    {
      name: 'Ad Soyad',
      title: 'Tasarımcı',
      image: 'assets/img/placeholder-avatar.svg',
      work: 'UI/UX Tasarım',
      description: 'Ünides projesinde tasarım süreçlerinde yer almaktadır.',
      backgroundImage: 'assets/img/placeholder-cover.svg',
      socialLinks: {
        linkedin: '#',
      },
    },
    {
      name: 'Ad Soyad',
      title: 'Yazılım Geliştirici',
      image: 'assets/img/placeholder-avatar.svg',
      work: 'Full Stack Development',
      description: 'Ünides projesinde yazılım geliştirme süreçlerinde yer almaktadır.',
      backgroundImage: 'assets/img/placeholder-cover.svg',
      socialLinks: {
        github: '#',
        linkedin: '#',
      },
    },
  ];

  // Developer names for stream animation
  get developerNames(): string[] {
    return this.developers.map(dev => dev.name);
  }

  ngOnInit(): void {
    // Component initialization
  }

  toggleCard(index: number): void {
    if (this.expandedCardIndex === index) {
      this.expandedCardIndex = null;
    } else {
      this.expandedCardIndex = index;
    }
  }
}
