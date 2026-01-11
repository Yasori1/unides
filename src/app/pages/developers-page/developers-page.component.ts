import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { ProfileCardComponent } from '../../components/ui/profile-card/profile-card';
import { NeuronsBackgroundComponent } from '../../components/ui/neurons-background/neurons-background';

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
  ],
  templateUrl: './developers-page.component.html',
  styleUrls: ['./developers-page.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Bu satır 'spline-viewer' hatasını çözer
})
export class DevelopersPageComponent implements OnInit {
  // Geliştiriciler
  developers: Developer[] = [
    {
      name: 'Safa G.',
      title: 'Lead Architect',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      work: 'Sistem mimarisi ve altyapı geliştirme',
      socialLinks: {
        github: 'https://github.com/safa',
        linkedin: 'https://linkedin.com/in/safa',
        website: 'https://safa.dev',
      },
    },
    {
      name: 'Elif Y.',
      title: 'Product Manager',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      work: 'Ürün yönetimi ve strateji geliştirme',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/elif',
        twitter: 'https://twitter.com/elif',
      },
    },
    {
      name: 'Caner K.',
      title: 'Senior Backend',
      image: 'https://randomuser.me/api/portraits/men/86.jpg',
      work: 'Backend API ve veritabanı yönetimi',
      socialLinks: {
        github: 'https://github.com/caner',
        linkedin: 'https://linkedin.com/in/caner',
      },
    },
    {
      name: 'Zeynep S.',
      title: 'Senior Frontend',
      image: 'https://randomuser.me/api/portraits/women/68.jpg',
      work: 'Kullanıcı arayüzü ve frontend geliştirme',
      socialLinks: {
        github: 'https://github.com/zeynep',
        linkedin: 'https://linkedin.com/in/zeynep',
        website: 'https://zeynep.dev',
      },
    },
    {
      name: 'Murat D.',
      title: 'DevOps Engineer',
      image: 'https://randomuser.me/api/portraits/men/46.jpg',
      work: 'CI/CD pipeline ve altyapı otomasyonu',
      socialLinks: {
        github: 'https://github.com/murat',
        linkedin: 'https://linkedin.com/in/murat',
      },
    },
    {
      name: 'Ayşe T.',
      title: 'UI/UX Designer',
      image: 'https://randomuser.me/api/portraits/women/23.jpg',
      work: 'Kullanıcı deneyimi tasarımı ve arayüz geliştirme',
      socialLinks: {
        instagram: 'https://instagram.com/ayse',
        linkedin: 'https://linkedin.com/in/ayse',
        website: 'https://ayse.design',
      },
    },
    {
      name: 'Burak Y.',
      title: 'Backend Developer',
      image: 'https://randomuser.me/api/portraits/men/22.jpg',
      work: 'RESTful API ve mikroservis geliştirme',
      socialLinks: {
        github: 'https://github.com/burak',
        linkedin: 'https://linkedin.com/in/burak',
      },
    },
    {
      name: 'Selin D.',
      title: 'Frontend Developer',
      image: 'https://randomuser.me/api/portraits/women/90.jpg',
      work: 'React ve Angular uygulamaları geliştirme',
      socialLinks: {
        github: 'https://github.com/selin',
        linkedin: 'https://linkedin.com/in/selin',
      },
    },
    {
      name: 'Oğuzhan K.',
      title: 'Mobile Developer',
      image: 'https://randomuser.me/api/portraits/men/11.jpg',
      work: 'iOS ve Android uygulama geliştirme',
      socialLinks: {
        github: 'https://github.com/oguzhan',
        linkedin: 'https://linkedin.com/in/oguzhan',
      },
    },
    {
      name: 'Fatma A.',
      title: 'QA Engineer',
      image: 'https://randomuser.me/api/portraits/women/12.jpg',
      work: 'Test otomasyonu ve kalite güvence',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/fatma',
      },
    },
    {
      name: 'Emre V.',
      title: 'Full Stack',
      image: 'https://randomuser.me/api/portraits/men/33.jpg',
      work: 'Full stack web uygulama geliştirme',
      socialLinks: {
        github: 'https://github.com/emre',
        linkedin: 'https://linkedin.com/in/emre',
        website: 'https://emre.dev',
      },
    },
    {
      name: 'Gamze Ö.',
      title: 'Data Scientist',
      image: 'https://randomuser.me/api/portraits/women/45.jpg',
      work: 'Veri analizi ve makine öğrenmesi',
      socialLinks: {
        github: 'https://github.com/gamze',
        linkedin: 'https://linkedin.com/in/gamze',
      },
    },
    {
      name: 'Hakan Ç.',
      title: 'Security',
      image: 'https://randomuser.me/api/portraits/men/55.jpg',
      work: 'Güvenlik analizi ve siber güvenlik',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/hakan',
        website: 'https://hakan.security',
      },
    },
    {
      name: 'İrem B.',
      title: 'Content Strategist',
      image: 'https://randomuser.me/api/portraits/women/66.jpg',
      work: 'İçerik stratejisi ve pazarlama',
      socialLinks: {
        instagram: 'https://instagram.com/irem',
        linkedin: 'https://linkedin.com/in/irem',
        twitter: 'https://twitter.com/irem',
      },
    },
    {
      name: 'Kaan L.',
      title: 'Frontend Developer',
      image: 'https://randomuser.me/api/portraits/men/77.jpg',
      work: 'Vue.js ve React uygulamaları',
      socialLinks: {
        github: 'https://github.com/kaan',
        linkedin: 'https://linkedin.com/in/kaan',
      },
    },
    {
      name: 'Leyla M.',
      title: 'Backend Developer',
      image: 'https://randomuser.me/api/portraits/women/88.jpg',
      work: 'Node.js ve Python backend geliştirme',
      socialLinks: {
        github: 'https://github.com/leyla',
        linkedin: 'https://linkedin.com/in/leyla',
      },
    },
  ];

  ngOnInit(): void {
    // Spline scriptinin yüklenip yüklenmediğini kontrol et
    const scriptCheck = document.querySelector(
      'script[src="https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js"]'
    );

    if (!scriptCheck) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js';
      document.head.appendChild(script);
    }
  }
}
