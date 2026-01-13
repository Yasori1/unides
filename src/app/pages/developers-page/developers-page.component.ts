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
      name: 'Safa G.',
      title: 'Lead Architect',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      work: 'Sistem mimarisi ve altyapı geliştirme',
      description: 'Sistem mimarisi ve altyapı geliştirme konusunda uzman. Ünides platformunun temel mimarisini tasarlayarak, ölçeklenebilir ve güvenilir bir altyapı oluşturuyor. Modern teknolojiler ve best practice\'ler kullanarak platformun geleceğe hazır olmasını sağlıyor.',
      backgroundImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop',
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
      description: 'Ürün yönetimi ve strateji geliştirme alanında deneyimli. Kullanıcı ihtiyaçlarını analiz ederek, Ünides\'in yol haritasını belirliyor ve ekibin hedeflerine ulaşmasını sağlıyor. Veri odaklı kararlar alarak ürünün sürekli gelişimini yönetiyor.',
      backgroundImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
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
      description: 'Backend API ve veritabanı yönetimi konusunda uzman. RESTful API\'ler tasarlayarak, veritabanı optimizasyonları yaparak ve mikroservis mimarisi geliştirerek platformun arka plan altyapısını güçlendiriyor. Performans ve güvenlik odaklı çözümler üretiyor.',
      backgroundImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
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
      description: 'Kullanıcı arayüzü ve frontend geliştirme alanında uzman. Modern web teknolojileri kullanarak, kullanıcı dostu ve responsive arayüzler tasarlıyor. Angular ve React gibi framework\'lerle interaktif ve performanslı uygulamalar geliştiriyor.',
      backgroundImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
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
      description: 'CI/CD pipeline ve altyapı otomasyonu konusunda uzman. Docker, Kubernetes ve cloud teknolojileri kullanarak, platformun deployment süreçlerini otomatikleştiriyor ve altyapıyı ölçeklenebilir hale getiriyor. Sürekli entegrasyon ve dağıtım süreçlerini optimize ediyor.',
      backgroundImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop',
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
      description: 'Kullanıcı deneyimi tasarımı ve arayüz geliştirme alanında yaratıcı. Kullanıcı araştırmaları yaparak, wireframe\'ler ve prototipler oluşturarak, Ünides\'in görsel kimliğini ve kullanıcı deneyimini şekillendiriyor. Modern ve erişilebilir tasarımlar üretiyor.',
      backgroundImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
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
      description: 'RESTful API ve mikroservis geliştirme konusunda deneyimli. Node.js ve Python kullanarak, ölçeklenebilir backend servisleri geliştiriyor. API tasarımı, veritabanı yönetimi ve sistem entegrasyonları konularında uzman.',
      backgroundImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
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
      description: 'React ve Angular uygulamaları geliştirme alanında uzman. Modern JavaScript framework\'leri kullanarak, performanslı ve kullanıcı dostu web uygulamaları oluşturuyor. State management, routing ve component mimarisi konularında deneyimli.',
      backgroundImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
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
      description: 'iOS ve Android uygulama geliştirme konusunda uzman. Native ve cross-platform teknolojiler kullanarak, mobil kullanıcı deneyimini optimize ediyor. App Store ve Play Store için uygulama geliştirme ve yayınlama süreçlerini yönetiyor.',
      backgroundImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
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
      description: 'Test otomasyonu ve kalite güvence alanında uzman. Otomatik test senaryoları yazarak, manuel testler yaparak ve sürekli test süreçleri kurarak platformun kalitesini garanti altına alıyor. Bug tracking ve test raporlama konularında deneyimli.',
      backgroundImage: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/fatma',
      },
    },
    {
      name: 'Emre V.',
      title: 'Full Stack',
      image: 'https://randomuser.me/api/portraits/men/33.jpg',
      work: 'Full stack web uygulama geliştirme',
      description: 'Full stack web uygulama geliştirme konusunda deneyimli. Hem frontend hem backend teknolojilerinde uzman olarak, uçtan uca çözümler geliştiriyor. Veritabanı tasarımından kullanıcı arayüzüne kadar tüm katmanlarda çalışabiliyor.',
      backgroundImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
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
      description: 'Veri analizi ve makine öğrenmesi alanında uzman. Büyük veri setlerini analiz ederek, öngörücü modeller geliştiriyor ve platform için veri odaklı kararlar alınmasını sağlıyor. Python, R ve machine learning framework\'leri kullanıyor.',
      backgroundImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
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
      description: 'Güvenlik analizi ve siber güvenlik konusunda uzman. Platformun güvenlik açıklarını tespit ederek, penetration testler yaparak ve güvenlik politikaları oluşturarak kullanıcı verilerinin korunmasını sağlıyor. OWASP standartlarına uygun çözümler geliştiriyor.',
      backgroundImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
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
      description: 'İçerik stratejisi ve pazarlama alanında yaratıcı. Platformun içerik stratejisini belirleyerek, kullanıcı deneyimini iyileştiren içerikler üretiyor ve pazarlama kampanyaları yönetiyor. SEO, sosyal medya ve içerik pazarlama konularında uzman.',
      backgroundImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
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
      description: 'Vue.js ve React uygulamaları geliştirme konusunda uzman. Modern frontend framework\'leri kullanarak, interaktif ve performanslı kullanıcı arayüzleri oluşturuyor. Component-based architecture ve state management konularında deneyimli.',
      backgroundImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
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
      description: 'Node.js ve Python backend geliştirme alanında uzman. RESTful API\'ler, GraphQL endpoint\'leri ve mikroservis mimarisi geliştiriyor. Veritabanı optimizasyonu, caching stratejileri ve performans iyileştirmeleri konularında deneyimli.',
      backgroundImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
      socialLinks: {
        github: 'https://github.com/leyla',
        linkedin: 'https://linkedin.com/in/leyla',
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
