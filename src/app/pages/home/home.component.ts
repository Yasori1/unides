import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

// --- Veri Tipleri (Interfaces) ---
interface Community { 
  id: number; 
  name: string; 
  image: string; 
  category: string; 
  memberCount: number; 
  eventCount: number; 
}

interface UpcomingEvent { 
  id: number; 
  title: string; 
  date: Date; 
  location: string; 
  time: string; 
  description: string; 
  communityName: string; 
  communityLogo: string; 
}

interface NewCommunity { 
  id: number; 
  name: string; 
  university: string; 
  image: string; 
}

interface Announcement {
  title: string;
  content: string;
}

@Component({
  selector: 'app-home', // DÜZELTİLDİ
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './home.component.html', // DÜZELTİLDİ
  styleUrls: ['./home.component.scss']  // DÜZELTİLDİ
})
export class HomeComponent implements OnInit, OnDestroy { // DÜZELTİLDİ (Home3Component -> HomeComponent)

  // --- Animasyon Değişkenleri ---
  typingText: string = 'Toplulukları'; 
  words: string[] = ['Toplulukları', 'Etkinlikleri', 'Duyuruları', 'Fırsatları'];
  wordIndex = 0;
  charIndex = 0;
  isDeleting = false;
  typingSpeed = 100;
  typewriterInterval: any;

  // --- Arama ve UI Değişkenleri ---
  searchText: string = '';
  isLoading: boolean = true;
  videoThumbnail: string = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000';
  
  showVideo: boolean = false;
  safeVideoUrl: SafeResourceUrl;

  // --- Veri Listeleri ---
  featuredCommunities: Community[] = [];
  upcomingEvents: UpcomingEvent[] = [];
  newestCommunities: NewCommunity[] = [];

  // Arama için Mock Duyuru Verileri
  mockAnnouncements: Announcement[] = [
    { title: 'TÜBİTAK Proje Çağrısı', content: '2209-A Öğrenci projeleri başvuruları başladı.' },
    { title: 'Burs Başvuruları', content: '2025 dönemi bursları' },
    { title: 'Staj Programı', content: 'Yaz stajı başvuruları' },
    { title: 'Yurt Sonuçları', content: 'Yedek yurt başvuru sonuçları açıklandı.' }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/z-3j8kP0D48?autoplay=1');
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startTypewriter();
    }
    this.loadData();
  }

  ngOnDestroy() {
    if (this.typewriterInterval) clearTimeout(this.typewriterInterval);
  }

  // --- Video İşlemleri ---
  openVideo() { this.showVideo = true; }
  closeVideo() { this.showVideo = false; }

  // --- Typewriter (Yazı Yazma) Efekti ---
  startTypewriter() {
    const currentWord = this.words[this.wordIndex];
    
    if (this.isDeleting) {
      this.typingText = currentWord.substring(0, this.charIndex - 1);
      this.charIndex--;
      this.typingSpeed = 50; 
    } else {
      this.typingText = currentWord.substring(0, this.charIndex + 1);
      this.charIndex++;
      this.typingSpeed = 150; 
    }

    if (!this.isDeleting && this.charIndex === currentWord.length) {
      this.isDeleting = true;
      this.typingSpeed = 2000; 
    } else if (this.isDeleting && this.charIndex === 0) {
      this.isDeleting = false;
      this.wordIndex = (this.wordIndex + 1) % this.words.length;
      this.typingSpeed = 500; 
    }

    this.typewriterInterval = setTimeout(() => this.startTypewriter(), this.typingSpeed);
  }

  // --- Tarih Formatlama ---
  formatDateTr(date: Date): string {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const d = new Date(date);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // --- Veri Yükleme (Simülasyon) ---
  loadData() {
    this.isLoading = true;
    setTimeout(() => {
      this.featuredCommunities = [
        { id: 1, name: 'Yapay Zeka Kulübü', category: 'Teknoloji', memberCount: 1250, eventCount: 45, image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600' },
        { id: 2, name: 'Girişimcilik', category: 'Kariyer', memberCount: 980, eventCount: 32, image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=600' },
        { id: 3, name: 'Doğa Sporları', category: 'Spor', memberCount: 650, eventCount: 12, image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=600' },
        { id: 4, name: 'Müzik Atölyesi', category: 'Sanat', memberCount: 820, eventCount: 28, image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600' },
        { id: 5, name: 'Siber Güvenlik', category: 'Teknoloji', memberCount: 1100, eventCount: 50, image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600' },
        { id: 6, name: 'Fotoğrafçılık', category: 'Sanat', memberCount: 450, eventCount: 15, image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=600' }
      ];

      const rawEvents: UpcomingEvent[] = [
        { 
          id: 1, title: 'Hackathon 2025', date: new Date('2025-12-30T22:33:00'), location: 'İTÜ Kampüsü', time: '22:33', 
          description: '48 saatlik kodlama maratonunda projeni geliştir, ödülleri kazan!',
          communityName: 'Yazılım Kulübü', communityLogo: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80'
        },
        { 
          id: 2, title: 'Girişimcilik Zirvesi', date: new Date('2026-01-01T14:00:00'), location: 'ODTÜ Kültür Merkezi', time: '14:00', 
          description: 'Yatırımcılarla buluşma fırsatı.', communityName: 'Girişimcilik K.', communityLogo: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=100'
        },
        { 
          id: 3, title: 'Tasarım Workshop', date: new Date('2026-01-01T10:00:00'), location: 'Online', time: '10:00', 
          description: 'UI/UX tasarımın temelleri.', communityName: 'Sanat Topluluğu', communityLogo: 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=100'
        },
        { 
          id: 4, title: 'Robotik Yarışması', date: new Date('2026-01-25T13:30:00'), location: 'Teknopark', time: '13:30', 
          description: 'Otonom robotların mücadelesi.', communityName: 'Robotik K.', communityLogo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100'
        },
        { 
          id: 5, title: 'Bahar Festivali', date: new Date('2026-05-20'), location: 'Ana Kampüs', time: '12:00', 
          description: 'Eğlence dolu bir gün.', communityName: 'Müzik Kulübü', communityLogo: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100'
        },
        { 
          id: 6, title: 'Kariyer Zirvesi', date: new Date('2026-06-01'), location: 'Konferans Salonu', time: '09:00', 
          description: 'Sektör devleriyle buluşma.', communityName: 'İK Kulübü', communityLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
        }
      ];
      this.upcomingEvents = rawEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

      const demoImages = [
        'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100',
        'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=100',
        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      ];
      this.newestCommunities = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name: `Topluluk ${i + 1}`,
        university: 'İstanbul Üni.',
        image: demoImages[i % demoImages.length]
      }));

      this.isLoading = false;
    }, 1000);
  }

  // --- GELİŞMİŞ AKILLI ARAMA ALGORİTMASI ---
  onSearch() {
    if (!this.searchText || !this.searchText.trim()) return;

    const query = this.searchText.trim().toLocaleLowerCase('tr-TR');

    // 1. ADIM: Kesin Yönlendirmeler
    if (['etkinlik', 'event', 'takvim'].some(k => query.includes(k))) {
      this.router.navigate(['/events'], { queryParams: { search: query } });
      return;
    }
    if (['topluluk', 'kulüp', 'club'].some(k => query.includes(k))) {
      this.router.navigate(['/communities'], { queryParams: { search: query } });
      return;
    }
    if (['duyuru', 'burs', 'staj'].some(k => query.includes(k))) {
      this.router.navigate(['/announcements'], { queryParams: { search: query } });
      return;
    }

    // 2. ADIM: Ağırlıklı Puanlama
    
    // -- Etkinlik Puanı --
    let eventScore = 0;
    this.upcomingEvents.forEach(e => {
      if (e.title.toLocaleLowerCase('tr-TR').includes(query)) eventScore += 10;
      else if (e.description.toLocaleLowerCase('tr-TR').includes(query)) eventScore += 1;
      else if (e.location.toLocaleLowerCase('tr-TR').includes(query)) eventScore += 1;
    });

    // -- Topluluk Puanı --
    let communityScore = 0;
    const allCommunities = [...this.featuredCommunities, ...this.newestCommunities];
    allCommunities.forEach(c => {
      if (c.name.toLocaleLowerCase('tr-TR').includes(query)) {
        communityScore += 10;
      }
      else if ('category' in c && (c as Community).category.toLocaleLowerCase('tr-TR').includes(query)) {
        communityScore += 2;
      }
    });

    // -- Duyuru Puanı --
    let announcementScore = 0;
    this.mockAnnouncements.forEach(a => {
      if (a.title.toLocaleLowerCase('tr-TR').includes(query)) announcementScore += 10;
      else if (a.content.toLocaleLowerCase('tr-TR').includes(query)) announcementScore += 1;
    });

    // 3. ADIM: Yönlendirme
    if (eventScore > 0 && eventScore >= communityScore && eventScore >= announcementScore) {
      this.router.navigate(['/events'], { queryParams: { search: query } });
    } 
    else if (communityScore > 0 && communityScore > eventScore && communityScore >= announcementScore) {
      this.router.navigate(['/communities'], { queryParams: { search: query } });
    } 
    else if (announcementScore > 0) {
      this.router.navigate(['/announcements'], { queryParams: { search: query } });
    } 
    else {
      this.router.navigate(['/communities'], { queryParams: { search: query } });
    }
  }

  // --- Yönlendirme Yardımcıları ---
  goToCommunityDetail(id: number) { this.router.navigate(['/communities', id]); }
  goToEventDetail(id: number) { this.router.navigate(['/events', id]); }

  getRemainingTime(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff <= 0) return 'Başladı';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if(days === 0) return 'Bugün'; 
    return `${days} Gün`;
  }
}