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
        'Veritabanı geliştiricisi olarak veri modelleri tasarladı, performanslı ve güvenli veritabanları geliştirdi; sistemlerin sürdürülebilirliğine katkı sağladı.',
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
        "ÜNİDES Dijital Portal'ın arayüz geliştirme süreçlerini ve frontend ekibinin koordinasyonunu yönettim. Angular ile geliştirdiğim arayüzün, API bağlantıları aracılığıyla sunucuyla olan tam entegrasyonunu sağladım.",
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
        'Gençlere yönelik frontend geliştirmelerinde aktif rol aldım. Responsive, performans odaklı ve kullanıcı dostu arayüzler kodladım, ölçeklenebilir frontend yapıları oluşturdum.',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/in/abdullah-g%C3%B6n%C3%A7-6b773b293',
        github: 'https://github.com/karoxyyy',
      },
    },
    {
      name: 'Hüseyin Eren Çeykel',
      role: 'Database Sorumlusu',
      image: 'assets/huseyinceykel.png',
      codeBg: 'Flutter.run()',
      description:
        'Veri modeli, ilişkisel şema ve indeks yapısını tasarlayarak bütünlük, performans ve ölçeklenebilirlik odaklı bir altyapı inşa ettim.',
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
        'Sunucu tarafı uygulamalarını geliştirerek API servislerini tasarladım, veritabanı entegrasyonlarını yönettim ve iş mantığını backend katmanında kurguladım. Performans, güvenlik ve ölçeklenebilirlik odaklı bir sistem altyapısı oluşturdum.',
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
        'Yapay zeka modelleri ve algoritmaları geliştiren AI uzmanı. Makine öğrenmesi çözümleri ile projeye değer katıyor.',
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
        'Yapay zeka teknolojileri ile akıllı sistemler geliştiren AI geliştirici. NLP ve makine öğrenmesi alanlarında çalışıyor.',
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
        'Hem frontend hem backend geliştirme yapan full stack geliştirici. Projenin tüm katmanlarında aktif rol alıyor.',
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
        'Uçtan uca geliştirme yapan full stack geliştirici. Frontend ve backend entegrasyonlarını sağlayarak, bütünsel çözümler üretiyor.',
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
