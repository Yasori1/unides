import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { TurkeySkylineComponent } from '../../components/ui/turkey-skyline/turkey-skyline.component';
import { QuartzCounterComponent } from '../../components/ui/quartz-counter/quartz-counter.component';
import { CommunityService } from '../../services/community.services';
import { EventService } from '../../services/event.services';
import { SearchService } from '../../services/search.services';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';
import { TurkishUppercasePipe } from '../../pipes/turkish-uppercase.pipe';
import { environment } from '../../../environments/environment';

// --- Veri Tipleri (Interfaces) ---
interface Community {
  id: string | number; // Guid (string) veya number
  name: string;
  image: string;
  category: string;
  memberCount: number;
  eventCount: number;
  email: string;
  city?: string;
}

interface UpcomingEvent {
  imageUrl?: string;
  id: number;
  title: string;
  date: Date;
  location: string;
  time: string;
  description: string;
  communityName: string;
  communityLogo: string;
  communityId?: number | string; // Topluluk ID'si eklendi
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
    QuartzCounterComponent,
    TurkishUppercasePipe,
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

  // --- Anasayfa sayaç (GET /api/Communities/stats) ---
  homeStats: { totalEvents: number; totalCommunities: number } = { totalEvents: 0, totalCommunities: 0 };
  private statsRefreshInterval: any;
  private readonly STATS_REFRESH_MS = 18000;

  // --- Responsive Placeholder ---
  isMobile: boolean = false;

  // --- Geçmişten Kareler Slider ---
  sliderImages: string[] = [
    'assets/gecmisten-kareler/gecmisten-kareler-1.png',
    'assets/gecmisten-kareler/gecmisten-kareler-2.png',
    'assets/gecmisten-kareler/gecmisten-kareler-3.png',
    'assets/gecmisten-kareler/gecmisten-kareler-4.png',
    'assets/gecmisten-kareler/gecmisten-kareler-5.png',
  ];

  // --- Lightbox ---
  lightboxOpen: boolean = false;
  selectedImage: string | null = null;

  // mockAnnouncements kaldırıldı - artık backend'den veri çekiliyor

  get searchPlaceholder(): string {
    return this.isMobile ? 'Yapay zeka, çevre ya da daha fazlası...' : 'Ne arıyorsun? (Yapay Zeka, Kampüs Etkinliği...)';
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private sanitizer: DomSanitizer,
    private communityService: CommunityService,
    private eventService: EventService,
    private searchService: SearchService,
    private imageErrorHandler: ImageErrorHandlerService
  ) {
    this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/z-3j8kP0D48?autoplay=1'
    );
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startTypewriter();
      this.checkMobile();
      window.addEventListener('resize', () => this.checkMobile());
    }
    this.loadData();
  }

  ngOnDestroy() {
    if (this.typewriterInterval) clearTimeout(this.typewriterInterval);
    if (this.statsRefreshInterval) clearInterval(this.statsRefreshInterval);
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', () => this.checkMobile());
    }
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 768;
  }

  // --- Video İşlemleri ---
  openVideo() {
    this.showVideo = true;
  }
  closeVideo() {
    this.showVideo = false;
  }

  // --- Lightbox İşlemleri ---
  openLightbox(imageUrl: string) {
    this.selectedImage = imageUrl;
    this.lightboxOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeLightbox() {
    this.lightboxOpen = false;
    this.selectedImage = null;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
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
  // Topluluk logolarını yükle
  loadCommunityLogos(events: UpcomingEvent[]): void {
    if (!environment.production) {
      console.log('[Home] loadCommunityLogos çağrıldı, event sayısı:', events.length);
    }

    // Her event için detay endpoint'inden communityId çek (daha güvenli)
    const eventDetailRequests = events.map((event) => {
      return this.eventService.getById(event.id).pipe(
        map((eventDetail) => {
          return {
            eventId: event.id,
            communityId: eventDetail.communityId,
          };
        }),
        catchError((error) => {
          if (!environment.production) {
            console.warn('[Home] Event detayı yüklenemedi:', error, 'Event ID:', event.id);
          }
          // Hata durumunda mevcut communityId'yi kullan (varsa)
          return of({
            eventId: event.id,
            communityId: (event as any).communityId || null,
          });
        })
      );
    });

    // Tüm event detaylarını paralel çek
    forkJoin(eventDetailRequests).subscribe({
      next: (eventDetails) => {
        if (!environment.production) {
          console.log('[Home] Event detayları alındı:', eventDetails);
        }

        // Her event için topluluk logo isteklerini hazırla
        const logoRequests = eventDetails.map((detail) => {
          const event = events.find((e) => e.id === detail.eventId);
          if (!event) {
            return of({ eventId: detail.eventId, logo: 'assets/img/placeholder-avatar.svg' });
          }

          const communityId = detail.communityId;

          if (!communityId || communityId === 0 || communityId === '0') {
            if (!environment.production) {
              console.warn('[Home] Event için communityId bulunamadı:', detail.eventId);
            }
            return of({ eventId: detail.eventId, logo: 'assets/img/placeholder-avatar.svg' });
          }

          // Topluluk detayını çek (logo için)
          if (!environment.production) {
            console.log('[Home] Topluluk detayı çekiliyor, Community ID:', communityId, 'Event ID:', detail.eventId);
          }
          return this.communityService.getCommunityById(String(communityId)).pipe(
            map((community) => {
              if (!environment.production) {
                console.log('[Home] Topluluk detayı alındı:', community.id, 'Logo:', community.logo, 'Event ID:', detail.eventId);
              }
              return {
                eventId: detail.eventId,
                logo: community.logo || 'assets/img/placeholder-avatar.svg',
              };
            }),
            catchError((error) => {
              if (!environment.production) {
                console.warn('[Home] Topluluk logosu yüklenemedi:', error, 'Community ID:', communityId, 'Event ID:', detail.eventId);
              }
              return of({ eventId: detail.eventId, logo: 'assets/img/placeholder-avatar.svg' });
            })
          );
        });

        // Tüm logo isteklerini paralel olarak çalıştır
        forkJoin(logoRequests).subscribe({
          next: (logoResults) => {
            if (!environment.production) {
              console.log('[Home] Logo sonuçları alındı:', logoResults);
            }
            // Logo sonuçlarını event'lere ekle
            logoResults.forEach((result) => {
              const event = events.find((e) => e.id === result.eventId);
              if (event) {
                if (!environment.production) {
                  console.log('[Home] Event logo güncelleniyor:', event.id, 'Eski logo:', event.communityLogo, 'Yeni logo:', result.logo);
                }
                event.communityLogo = result.logo;
              }
            });

            // Event'leri güncelle
            if (!environment.production) {
              console.log('[Home] Events guncelleniyor, yeni event listesi:', events);
            }
            this.upcomingEvents = [...events]; // Yeni array referansı ile güncelleme
          },
          error: (error) => {
            if (!environment.production) {
              console.error('[Home] Topluluk logoları yüklenirken hata:', error);
            }
            // Hata durumunda placeholder logoları kullan
            events.forEach((event) => {
              if (!event.communityLogo || event.communityLogo === 'assets/img/placeholder-avatar.svg') {
                event.communityLogo = 'assets/img/placeholder-avatar.svg';
              }
            });
            this.upcomingEvents = [...events]; // Yeni array referansı ile güncelleme
          },
        });
      },
      error: (error) => {
        if (!environment.production) {
          console.error('[Home] Event detayları yüklenirken hata:', error);
        }
        // Hata durumunda placeholder logoları kullan
        events.forEach((event) => {
          event.communityLogo = 'assets/img/placeholder-avatar.svg';
        });
        this.upcomingEvents = [...events];
      },
    });
  }

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
  /** Anasayfa sayaç verisini yükle (Quartz sayaç kendi animasyonunu yapar) */
  loadHomeStats() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.communityService.getStats().subscribe({
      next: (stats) => {
        this.homeStats = stats;
      },
      error: () => {
        this.homeStats = { totalEvents: 0, totalCommunities: 0 };
      },
    });
  }

  loadData() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;

    // Anasayfa sayaç: toplam etkinlik ve topluluk (GET /api/Communities/stats) + periyodik güncelleme
    this.loadHomeStats();
    this.statsRefreshInterval = setInterval(() => this.loadHomeStats(), this.STATS_REFRESH_MS);

    // Öne Çıkan Topluluklar
    this.communityService.getFeaturedCommunities(6, { skipAuth: true }).subscribe({
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
            city: c.city || '', // Topluluğun bulunduğu şehir
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

          // Debug: imageUrl ve communityLogo'yu logla (sadece development'ta)
          if (!environment.production) {
            if (e.imageUrl) {
              console.log('[Home] Event imageUrl:', e.imageUrl, 'Event ID:', e.id, 'Event Title:', e.title);
            } else {
              console.warn('[Home] Event imageUrl is empty or undefined:', 'Event ID:', e.id, 'Event Title:', e.title);
            }

            // Debug: Event verisini logla
            console.log('[Home] Event verisi:', {
              id: e.id,
              title: e.title,
              communityName: e.communityName,
              communityId: e.communityId,
              communityLogo: e.communityLogo,
              fullEvent: e
            });
          }

          return {
            id: e.id,
            title: e.title,
            date: eventDate,
            location: e.location || 'Konum belirtilmemiş',
            time: eventDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            description: e.shortDescription || e.description || 'Açıklama belirtilmemiş',
            communityName: e.communityName || 'Topluluk',
            communityLogo: e.communityLogo || 'assets/img/placeholder-avatar.svg', // Geçici placeholder, sonra topluluk servisinden güncellenecek
            communityId: e.communityId && e.communityId !== 0 ? e.communityId : undefined, // Topluluk ID'si eklendi (0 değilse)
            imageUrl: e.imageUrl || '', // Etkinlik görseli
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
        const selectedEvents = futureEvents.slice(0, 6).map((e) => {
          const { dateOnly, ...rest } = e;
          return rest as UpcomingEvent;
        });

        // Performans optimizasyonu: Template içinde fonksiyon çağırmak yerine hesaplayıp sakla
        selectedEvents.forEach((e) => {
          e.remainingTimeStr = this.getRemainingTime(e.date);
        });

        // Her event için topluluk logolarını çek
        this.loadCommunityLogos(selectedEvents);
      },
      error: (error) => {
        if (!environment.production) {
          console.error('Upcoming events yüklenemedi:', error);
        }
        this.upcomingEvents = [];
      },
    });

    // Aramıza Yeni Katılanlar - 24 topluluk
    this.communityService.getNewestCommunities(24, { skipAuth: true }).subscribe({
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
        if (!environment.production) {
          console.error('Newest communities yüklenemedi:', error);
        }
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
        if (!environment.production) {
          console.error('Search error:', error);
        }
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

  onEventCardHover(event: MouseEvent): void {
    const card = event.currentTarget as HTMLElement;

    const locationInner = card.querySelector('.location-inner');
    if (locationInner && locationInner.scrollWidth > (locationInner.parentElement?.clientWidth ?? 0)) {
      card.classList.add('location-overflows');
    }

    const communityInner = card.querySelector('.host-community-inner');
    if (communityInner && communityInner.scrollWidth > (communityInner.parentElement?.clientWidth ?? 0)) {
      card.classList.add('community-overflows');
    }

    const descInner = card.querySelector('.event-desc-short-inner');
    if (descInner && descInner.scrollWidth > (descInner.parentElement?.clientWidth ?? 0)) {
      card.classList.add('desc-overflows');
    }
  }

  onEventCardLeave(event: MouseEvent): void {
    const card = event.currentTarget as HTMLElement;
    card.classList.remove('location-overflows', 'community-overflows', 'desc-overflows');
  }

  getRemainingTime(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff <= 0) return 'Başladı';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Bugün';
    return `${days} Gün`;
  }

  // Image error handler - Placeholder görsellerin sürekli istek atmasını engeller
  onImageError(event: Event, type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar' = 'avatar'): void {
    this.imageErrorHandler.handleImageError(event, type);
  }
}
