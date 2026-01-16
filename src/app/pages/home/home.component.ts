import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { TurkeySkylineComponent } from '../../components/ui/turkey-skyline/turkey-skyline.component';
import { CommunityService } from '../../services/community.services';
import { EventService } from '../../services/event.services';
import { SearchService } from '../../services/search.services';

// --- Veri Tipleri (Interfaces) ---
interface Community {
  id: string | number; // Guid (string) veya number
  name: string;
  image: string;
  category: string;
  memberCount: number;
  eventCount: number;
  email: string;
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
  remainingTimeStr?: string; // Performans için eklendi
}

interface NewCommunity {
  id: string | number; // Guid (string) veya number
  name: string;
  university: string;
  image: string;
  email: string;
}

interface Announcement {
  title: string;
  content: string;
}

@Component({
  selector: 'app-home', // DÜZELTİLDİ
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SiteNavbarComponent,
    SiteFooterComponent,
    TurkeySkylineComponent,
  ],
  templateUrl: './home.component.html', // DÜZELTİLDİ
  styleUrls: ['./home.component.scss'], // DÜZELTİLDİ
})
export class HomeComponent implements OnInit, OnDestroy {
  // DÜZELTİLDİ (Home3Component -> HomeComponent)

  // --- Animasyon Değişkenleri ---
  typingText: string = 'Toplulukları';
  words: string[] = ['Toplulukları', 'Etkinlikleri', 'Duyuruları'];
  wordIndex = 0;
  charIndex = 0;
  isDeleting = false;
  typingSpeed = 100;
  typewriterInterval: any;

  // --- Arama ve UI Değişkenleri ---
  searchText: string = '';
  isLoading: boolean = true;
  // Video açılmadan önce görünen kapak görseli
  videoThumbnail: string = 'assets/unides_video_gorsel.jpg';

  showVideo: boolean = false;
  safeVideoUrl: SafeResourceUrl;

  // --- Veri Listeleri ---
  featuredCommunities: Community[] = [];
  upcomingEvents: UpcomingEvent[] = [];
  newestCommunities: NewCommunity[] = [];

  // mockAnnouncements kaldırıldı - artık backend'den veri çekiliyor

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private sanitizer: DomSanitizer,
    private communityService: CommunityService,
    private eventService: EventService,
    private searchService: SearchService
  ) {
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/z-3j8kP0D48?autoplay=1'
    );
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
  openVideo() {
    this.showVideo = true;
  }
  closeVideo() {
    this.showVideo = false;
  }

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
    const months = [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ];
    const d = new Date(date);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // --- Veri Yükleme (Backend'den) ---
  loadData() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;

    // Öne Çıkan Topluluklar
    this.communityService.getFeaturedCommunities(6).subscribe({
      next: (communities) => {
        this.featuredCommunities = communities.map((c: any) => {
          // Backend'den gelen ID'yi direkt kullan (Guid string veya number)
          const id = c.id || '';

          // Backend'den gelen tüm alanları kullan
          return {
            id, // Backend'den gelen gerçek ID (Guid string)
            name: c.name || '',
            category: c.category || 'Genel',
            memberCount: c.memberCount || 0,
            eventCount: c.upcomingEventCount || 0, // Backend'den gelen event sayısı
            email: c.email || c.comMail || '', // Backend'den gelen email (varsa)
            image: c.banner || c.coverImage || c.logo || 'assets/img/placeholder-cover.svg',
          };
        });
      },
      error: (error) => {
        console.error('Featured communities yüklenemedi:', error);
        this.featuredCommunities = [];
      },
    });

    // Yaklaşan Etkinlikler
    this.eventService.getHomeUpcomingEvents(20).subscribe({
      // Backend'den daha fazla alıp frontend'de filtrele ve sırala
      next: (events) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Bugünün başlangıcı

        // Etkinlikleri map et ve geçici olarak dateOnly ekle
        const eventsWithDateOnly = events.map((e) => {
          const eventDate = e.startDate ? new Date(e.startDate) : new Date();
          // Sadece tarih kısmını al (saat bilgisini sıfırla)
          const eventDateOnly = new Date(eventDate);
          eventDateOnly.setHours(0, 0, 0, 0);

          return {
            id: e.id,
            title: e.title,
            date: eventDate,
            location: e.location || 'Konum belirtilmemiş',
            time: eventDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            description: e.shortDescription || e.description || 'Açıklama belirtilmemiş',
            communityName: e.communityName || 'Topluluk',
            communityLogo: e.imageUrl || 'assets/img/placeholder-avatar.svg',
            dateOnly: eventDateOnly, // Sıralama için
          };
        });

        // Geçmiş etkinlikleri filtrele (bugün ve gelecekteki etkinlikler)
        const futureEvents = eventsWithDateOnly.filter(
          (e) => e.dateOnly.getTime() >= now.getTime()
        );

        // Bugüne en yakın etkinlikten en uzağa doğru sırala
        futureEvents.sort((a, b) => a.dateOnly.getTime() - b.dateOnly.getTime());

        // İlk 6 tanesini al ve dateOnly'yi kaldır
        this.upcomingEvents = futureEvents.slice(0, 6).map((e) => {
          const { dateOnly, ...rest } = e;
          return rest as UpcomingEvent;
        });

        // Performans optimizasyonu: Template içinde fonksiyon çağırmak yerine hesaplayıp sakla
        this.upcomingEvents.forEach((e) => {
          e.remainingTimeStr = this.getRemainingTime(e.date);
        });
      },
      error: (error) => {
        console.error('Upcoming events yüklenemedi:', error);
        this.upcomingEvents = [];
      },
    });

    // Aramıza Yeni Katılanlar - 24 topluluk
    this.communityService.getNewestCommunities(24).subscribe({
      next: (communities) => {
        this.newestCommunities = communities.map((c: any) => {
          // Backend'den gelen ID'yi direkt kullan (Guid string veya number)
          const id = c.id || '';

          return {
            id, // Backend'den gelen gerçek ID (Guid string)
            name: c.name || '',
            university: c.university || 'Üniversite',
            email: c.email || c.comMail || '',
            image: c.logo || 'assets/img/placeholder-avatar.svg',
          };
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Newest communities yüklenemedi:', error);
        this.newestCommunities = [];
        this.isLoading = false;
      },
    });
  }

  // --- BACKEND'E BAĞLI ARAMA ---
  onSearch() {
    if (!this.searchText || !this.searchText.trim()) return;

    const query = this.searchText.trim();

    // Backend'den arama sonuçlarını al
    this.searchService.search(query).subscribe({
      next: (result) => {
        // Best match varsa ona yönlendir
        if (result.bestMatch) {
          if (result.bestMatch.type === 'community' || result.bestMatch.type === 'communities') {
            if (result.bestMatch.id === 'all') {
              this.router.navigate(['/communities'], { queryParams: { search: query } });
            } else {
              this.router.navigate(['/communities', result.bestMatch.id]);
            }
            return;
          } else if (result.bestMatch.type === 'events' || result.bestMatch.type === 'event') {
            this.router.navigate(['/events'], { queryParams: { search: query } });
            return;
          } else if (
            result.bestMatch.type === 'announcements' ||
            result.bestMatch.type === 'announcement'
          ) {
            this.router.navigate(['/announcements'], { queryParams: { search: query } });
            return;
          }
        }

        // Best match yoksa sonuç sayılarına göre yönlendir
        const communityCount = result.communities.length;
        const eventCount = result.events.length;
        const announcementCount = result.announcements.length;

        if (eventCount > 0 && eventCount >= communityCount && eventCount >= announcementCount) {
          this.router.navigate(['/events'], { queryParams: { search: query } });
        } else if (
          communityCount > 0 &&
          communityCount > eventCount &&
          communityCount >= announcementCount
        ) {
          this.router.navigate(['/communities'], { queryParams: { search: query } });
        } else if (announcementCount > 0) {
          this.router.navigate(['/announcements'], { queryParams: { search: query } });
        } else {
          // Sonuç yoksa topluluklar sayfasına yönlendir
          this.router.navigate(['/communities'], { queryParams: { search: query } });
        }
      },
      error: (error) => {
        console.error('Search error:', error);
        // Hata durumunda varsayılan olarak topluluklar sayfasına yönlendir
        this.router.navigate(['/communities'], { queryParams: { search: query } });
      },
    });
  }

  // --- Yönlendirme Yardımcıları ---
  goToCommunityDetail(id: string | number) {
    // Backend'den gelen Guid string'ini veya number'ı direkt kullan
    this.router.navigate(['/communities', id]);
  }
  goToEventDetail(id: number) {
    this.router.navigate(['/events', id]);
  }

  getRemainingTime(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff <= 0) return 'Başladı';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Bugün';
    return `${days} Gün`;
  }
}
