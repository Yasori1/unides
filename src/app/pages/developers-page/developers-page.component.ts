import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { ProfileCardComponent } from '../../components/ui/profile-card/profile-card';
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
    DeveloperStreamComponent,
  ],
  templateUrl: './developers-page.component.html',
  styleUrls: ['./developers-page.component.scss'],
})
export class DevelopersPageComponent implements OnInit {
  expandedCardIndex: number | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  // Geliştiriciler
  // Geliştiriciler
  developers: Developer[] = Array(12).fill(null).map((_, index) => ({
    name: 'Ad Soyad',
    title: 'Geliştirici',
    image: 'assets/img/placeholder-avatar.svg',
    work: 'Development',
    description: '',
    backgroundImage: '',
    socialLinks: {
      github: '#',
      linkedin: '#',
      twitter: '#'
    }
  }));

  // Destek Verenler Listesi (Buradan güncellenebilir)
  supporters: string[] = [
    'Destekçi Ad Soyad 1',
    'Destekçi Ad Soyad 2',
    'Destekçi Ad Soyad 3',
    'Destekçi Ad Soyad 4',
    'Destekçi Ad Soyad 5'
  ];

  isSupportersOpen: boolean = false;

  toggleSupporters(): void {
    this.isSupportersOpen = !this.isSupportersOpen;
  }

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
