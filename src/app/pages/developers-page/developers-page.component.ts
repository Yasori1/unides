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
        'Proje yürütücüsü ve Backend takım lideri olarak, aynı zamanda sunucu sorumluluğunu üstlenmiştir. Süreçleri düzenleyerek ekipler arası iletişimi güçlendirmiş ve proje planlamasını etkin bir şekilde yürütmüştür. Projenin genel mimarisini tasarlamış, sistemin temel yapısını oluşturarak ölçeklenebilir ve sürdürülebilir bir altyapı kurmuştur.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/emircansazli/',
        github: 'https://github.com/emircansazli',
      },
    },
    {
      name: 'Alper Uğur Acar',
      role: 'İş Analisti ',
      image: 'assets/alperuguracar.png',
      codeBg: 'import { crystal } from "unides"',
      description:
        'Projenin iş analizi ve içerik yönetimi süreçlerini üstlenmiştir. Kullanılacak temel teknolojileri belirleyip görev dağılımını organize etmiş ve hazırladığı iş planlarıyla ekipler arası eşgüdümü sağlamıştır. Ayrıca projenin sistem kurgusu ve tasarım aşamalarına yön vererek içerik altyapısının hazırlanmasını yönetmiştir.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/alper-u%C4%9Fur-acar-31b508210/',
        github: 'https://github.com/alperuguracar',
      },
    },
    {
      name: 'Safa Rahman Cenkci',
      role: 'Frontend Takım Lideri',
      image: 'assets/safarahmancenkci.png',
      codeBg: 'SELECT * FROM futures',
      description:
        'Projenin arayüz grafik geliştirme süreçlerini ve frontend ekibinin koordinasyonunu yönetmiştir. Angular teknolojisi ile geliştirdiği arayüzün, API bağlantıları aracılığıyla sunucuyla tam entegrasyonunu sağlamıştır.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/safarahmancenkci/',
        github: 'https://github.com/safacenkci',
      },
    },
    {
      name: 'Abdullah Gönç',
      role: 'Frontend Geliştirici',
      image: 'assets/abdullahgonc.png',
      codeBg: 'while(true) { innovate(); }',
      description:
        'Genç hedef kitleye hitap eden projelerin frontend geliştirme süreçlerinde aktif olarak yer almıştır. Kullanıcı deneyimini merkeze alarak; responsive, yüksek performanslı ve modern arayüzler kodlamış, aynı zamanda sistemin büyümesine uyum sağlayabilecek ölçeklenebilir ve sürdürülebilir frontend mimarileri inşa etmiştir.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/abdullah-g%C3%B6n%C3%A7-6b773b293',
        github: 'https://github.com/karoxyyy',
      },
    },
    {
      name: 'Hüseyin Eren Çeykel',
      role: 'Database Yöneticisi',
      image: 'assets/huseyinceykel.png',
      codeBg: 'Flutter.run()',
      description:
        'Projenin veri modeli, ilişkisel şeması ve indeks yapılarını tasarlayarak; veri bütünlüğünü koruyan, yüksek performanslı ve gelecekteki büyümeye uygun, ölçeklenebilir sağlam bir veritabanı altyapısı kurmuştur.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/huseyinerenceykel/',
        github: 'https://github.com/huseyinceykel',
      },
    },
    {
      name: 'Oğuzhan Akkoç',
      role: 'Backend Geliştirici',
      image: 'assets/oguzhanakkoc.png',
      codeBg: 'import pandas as pd',
      description:
        'Sunucu tarafı uygulamalarını geliştirerek API servislerini tasarlamış, veritabanı entegrasyonlarını yönetmiş ve iş mantığını backend katmanında kurgulamıştır. Performans, güvenlik ve ölçeklenebilirlik odaklı bir sistem altyapısı oluşturmuştur.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/o%C4%9Fuzhan-akko%C3%A7/',
        github: 'https://github.com/oguzakkoc0',
      },
    },
    {
      name: 'Yunus Emre Güler',
      role: 'Yapay Zeka Geliştiricisi',
      image: 'assets/yunusemreguler.webp',
      codeBg: 'docker-compose up -d',
      description:
        'Projede AI geliştirici olarak görev almış; makine öğrenmesi algoritmaları ve yapay zeka modelleri geliştirmiştir.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/yunus-emre-g%C3%BCler-b33a3123a/',
        github: 'https://github.com/yunusemre23023',
      },
    },
    {
      name: 'Ali Kadir Güzel',
      role: 'Yapay Zeka Geliştiricisi',
      image: 'assets/alikadirguzel.png',
      codeBg: 'expect(result).toBe(true)',
      description:
        'Projede AI geliştirici olarak görev alarak yapay zeka teknolojileri ile akıllı sistemler geliştirmiş; bu kapsamda uygunsuz içerikleri denetleyen bir argo filtresi tasarlayarak altyapıya entegre etmiştir.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/alikadirguzel',
        github: 'https://github.com/alikadirguzel',
      },
    },
    {
      name: 'Hamza Ketenci',
      role: 'Full Stack Geliştirici',
      image: 'assets/hamzaketenci.png',
      codeBg: '.design { beauty: true; }',
      description:
        'Full-stack geliştirici olarak veritabanı yönetimi ve backend geliştirme süreçlerinde görev almıştır. Veritabanı yapısını düzenlemiş ve veri yönetimini sağlamıştır. Proje sürecinde farklı alanlarda destek vererek projenin birçok katmanında aktif rol almıştır.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/hamzaketenci',
        github: 'https://github.com/HamzaKetenci',
      },
    },
    {
      name: 'Burak Erken',
      role: 'Full Stack Geliştirici',
      image: 'assets/burakerken.png',
      codeBg: 'const future = await build();',
      description:
        'Projede full-stack geliştirici olarak görev alarak uçtan uca geliştirme süreçlerini yürütmüş, ancak ağırlıklı olarak sunucu mimarisi ve yönetimi üzerine yoğunlaşmıştır. Frontend ve backend entegrasyonlarını başarıyla sağlayarak, özellikle sunucu tarafında çözümler üretmiştir.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/burak-erken',
        github: 'https://github.com/BurakErken',
      },
    },
  ];

  heroMoveX = 50;
  heroMoveY = 50;
  private mouseMoveListener: any;

  isAlumniExpanded = false;
  tappedDevIndex: number | null = null;

  toggleAlumni() {
    this.isAlumniExpanded = !this.isAlumniExpanded;
  }

  toggleDevTap(index: number, event: Event): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.innerWidth > 600) return;
    const target = event.target as HTMLElement;
    if (target.closest('a')) return;
    this.tappedDevIndex = this.tappedDevIndex === index ? null : index;
  }

  alumni: Alumni[] = [
    { name: 'Ahmet Berkan Çiçek', socialLinks: { linkedin: '#', github: '#' } },
    { name: 'Yunus Yaman', socialLinks: { linkedin: 'https://www.linkedin.com/in/yunus-yaman/', github: 'https://github.com/Yunusyamann' } },
    { name: 'Yaşar Eren Güre', socialLinks: { linkedin: 'https://www.linkedin.com/in/ya%C5%9Far-eren-g%C3%BCre-436696255', github: 'https://github.com/Yasori1' } },
    { name: 'Derya Gökçeli', socialLinks: { linkedin: 'https://www.linkedin.com/in/derya-gökçeli-839369310', github: 'https://github.com/deryagokceli' } },
    { name: 'Melikhan Atay', socialLinks: { linkedin: 'https://www.linkedin.com/in/muhammet-melikan-atalay/', github: 'https://github.com/Melikan' } },
    { name: 'Melike Kuyucaklıoğlu', socialLinks: { linkedin: 'https://www.linkedin.com/in/melike-kuyucakl%C4%B1o%C4%9Flu-7810a8246' } },
    { name: 'Mehmet Sezer Altun', socialLinks: { linkedin: 'https://www.linkedin.com/in/mehmet-sezer-altun-8a4197224' } },
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
        { threshold: 0.1 },
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
