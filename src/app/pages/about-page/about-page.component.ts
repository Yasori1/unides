import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss'],
})
export class AboutPageComponent implements OnInit, AfterViewInit {
  heroMoveX = 0;
  heroMoveY = 0;

  focusAreas = [
    'Afet Yönetimi ve Dayanıklılık',
    'Aile ve Değerler',
    'Bilim ve Teknoloji',
    'Çevre ve İklim',
    'Eğitim ve Hayat Boyu Öğrenme',
    'Gençlik Bilgilendirmesi',
    'Gençlik Sağlığı ve Spor',
    'Gönüllülük ve Sivil Toplum',
    'İstihdam ve Girişimcilik',
    'Sosyal Kapsayıcılık',
    'Uluslararası Gençlik Çalışmaları',
  ];

  applicationSteps = [
    { id: '1', title: 'Üniversite öğrencisi olmak', desc: '' },
    { id: '2', title: 'Kulüp/Topluluk Üyesi olmak', desc: '' },
    {
      id: '3',
      title: 'Gençlik ve Spor Bakanlığı çatısı altındaki "Genç Ofislere" giderek başvuru yap.',
      desc: '',
    },
    {
      id: '4',
      title: 'Topluluğunun projesini danışmanına tüm detaylarıyla anlat.',
      desc: '',
    },
  ];

  projectItems = [
    '11 ana başlıktan birine dair proje hazırla',
    'Sorunu ve ihtiyacı net bir dille tanımla',
    'Hedef kitleyi belirle',
    'Kalemleri piyasa fiyatlarına göre araştır',
  ];

  reportItems = [
    'Beklenen somut çıktılarını listele',
    'Yaygın etki ve görünürlük çalışmaları yap',
    'Projenin gelecekte nasıl devam edeceğini yaz',
    'Sonuç raporlaması için veri topla',
  ];

  // TEMEL LOGO LİSTESİ
  baseMarqueeItems = [
    { name: 'İTÜ', img: 'images/logos/itü.jpg' },
    { name: 'ODTÜ', img: 'images/logos/odtü.jpg' },
    { name: 'BOĞAZİÇİ', img: 'images/logos/bogazici.png' },
    { name: 'YILDIZ', img: 'images/logos/ytü.png' },
    { name: 'HACETTEPE', img: 'images/logos/hacettepe.png' },
    { name: 'EGE', img: 'images/logos/ege.png' },
    { name: 'MARMARA', img: 'images/logos/marmara.png' },
    { name: 'KOÇ', img: 'images/logos/koç.png' },
  ];

  // SONSUZ DÖNGÜ İÇİN ÇOĞALTILMIŞ LİSTE (3 KAT)
  marqueeItems: any[] = [];

  // GSB logosu da aynı klasör yapısına göre güncellendi
  gsbLogoUrl = 'images/logos/gsb.png';

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // Listeyi 3 kez tekrarlayarak kesintisiz döngü sağlıyoruz
    this.marqueeItems = [
      ...this.baseMarqueeItems,
      ...this.baseMarqueeItems,
      ...this.baseMarqueeItems,
    ];
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              target.classList.add('reveal-active');
              target.style.opacity = '1';
              target.style.transform = 'translateY(0)';
              revealObserver.unobserve(target);
            }
          });
        },
        { threshold: 0.15 }
      );

      this.animItems.forEach((item) => revealObserver.observe(item.nativeElement));
    }
  }

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }

  cardTilt(event: MouseEvent, cardElement: HTMLElement) {
    const rect = cardElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }

  cardReset(cardElement: HTMLElement) {
    cardElement.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
  }
}
