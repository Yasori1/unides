import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss']
})
export class AboutPageComponent implements OnInit, AfterViewInit {

  heroMoveX = 0;
  heroMoveY = 0;

  focusAreas = [
    'Afet Yönetimi ve Dayanıklılık', 'Aile ve Değerler', 'Bilim ve Teknoloji',
    'Çevre ve İklim', 'Eğitim ve Hayat Boyu Öğrenme', 'Gençlik Bilgilendirmesi',
    'Gençlik Sağlığı ve Spor', 'Gönüllülük ve Sivil Toplum', 'İstihdam ve Girişimcilik',
    'Sosyal Kapsayıcılık', 'Uluslararası Gençlik Çalışmaları'
  ];

  applicationSteps = [
    { id: '01', title: 'Genç Ol', desc: 'Genç ve Üniversite Öğrencisi Olmak.' },
    { id: '02', title: 'Kulüp Üyesi Ol', desc: 'Üniversitende aktif faaliyet gösteren bir kulübe üye olmak.' },
    { id: '03', title: 'Ofise Git', desc: 'Gençlik ve Spor Bakanlığı çatısı altındaki genç ofislere giderek başvuru yap.' },
    { id: '04', title: 'Projeyi Anlat', desc: 'Danışmanına projeni tüm detaylarıyla anlat.' }
  ];

  projectItems = [
    '11 ana başlıktan birine dair proje hazırla',
    'Sorunu ve ihtiyacı net bir dille tanımla',
    'Hedef kitleyi belirle',
    'Kalemleri piyasa fiyatlarına göre araştır'
  ];

  reportItems = [
    'Beklenen somut çıktılarını listele',
    'Yaygın etki ve görünürlük çalışmaları yap',
    'Projenin gelecekte nasıl devam edeceğini yaz',
    'Sonuç raporlaması için veri topla'
  ];

  // YEREL DOSYALAR (src/assets/logos klasöründen okur)
  // Lütfen resimlerin isimlerinin birebir tuttuğundan emin ol.
  marqueeItems = [
    { name: 'İTÜ', img: 'images/logos/itü.jpg' },
    { name: 'ODTÜ', img: 'images/logos/odtü.jpg' },
    { name: 'BOĞAZİÇİ', img: 'images/logos/bogazici.png' },
    { name: 'YILDIZ', img: 'images/logos/ytü.png' },
    { name: 'HACETTEPE', img: 'images/logos/hacettepe.png' },
    { name: 'EGE', img: 'images/logos/ege.png' },
    { name: 'MARMARA', img: 'images/logos/marmara.png' },
    { name: 'KOÇ', img: 'images/logos/koç.png' },
  ];

  // YEREL GSB LOGOSU
  gsbLogoUrl = 'images/logos/gsb.png';

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;
  @ViewChildren('statItem') statItems!: QueryList<ElementRef>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      this.animItems.forEach(item => revealObserver.observe(item.nativeElement));

      const statObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.startCounting();
          statObserver.disconnect();
        }
      }, { threshold: 0.1 });

      if (this.statItems.first) {
        const parent = this.statItems.first.nativeElement.closest('.stats-section');
        if (parent) statObserver.observe(parent);
      }
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
    const rotateX = ((y - centerY) / centerY) * -25; 
    const rotateY = ((x - centerX) / centerX) * 25;
    cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
  }

  cardReset(cardElement: HTMLElement) {
    cardElement.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
  }

  stats = [
    { label: 'Partner Üniversite', value: 85, current: 0, suffix: '+' },
    { label: 'Öğrenci Kulübü', value: 450, current: 0, suffix: '+' },
    { label: 'Aktif Üye', value: 12000, current: 0, suffix: '' },
    { label: 'Gerçekleşen Etkinlik', value: 2300, current: 0, suffix: '+' }
  ];

  startCounting() {
    this.stats.forEach(stat => {
      const duration = 2000;
      const steps = 60;
      const stepTime = duration / steps;
      const increment = stat.value / steps;
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        stat.current = Math.round(increment * currentStep);
        if (currentStep >= steps) {
          stat.current = stat.value;
          clearInterval(timer);
        }
      }, stepTime);
    });
  }
}