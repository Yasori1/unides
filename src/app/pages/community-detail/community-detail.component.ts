import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { CommunityService, Community } from '../../services/community.services';
import { EventService, EventItem } from '../../services/event.services';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';

// CommunityEvent interface for mock data
export interface CommunityEvent {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-community-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './community-detail.component.html',
  styleUrls: ['./community-detail.component.scss'],
})
export class CommunityDetailComponent implements OnInit {
  community: Community | null = null;
  isLoading: boolean = true;
  communityId: string | null = null;
  communityEvents: EventItem[] = [];
  isLoadingEvents: boolean = false;

  // Upcoming events from backend
  upcomingEvents: CommunityEvent[] = [];

  // Sayfalama için
  currentPage: number = 1;
  itemsPerPage: number = 4; // Sayfa başına 4 etkinlik (2x2 grid)
  paginatedEvents: CommunityEvent[] = [];
  totalPages: number = 0;

  // Banner animation
  heroMoveX = 0;
  heroMoveY = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private communityService: CommunityService,
    private eventService: EventService,
    private imageErrorHandler: ImageErrorHandlerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.communityId = id;
        // SSR sırasında HTTP istekleri yapma, sadece browser'da yap
        if (isPlatformBrowser(this.platformId)) {
          this.loadCommunity(id);
        } else {
          // SSR sırasında loading durumunu kapat
          this.isLoading = false;
        }
      } else {
        if (isPlatformBrowser(this.platformId)) {
          this.router.navigate(['/communities']);
        }
      }
    });
  }

  loadCommunity(id: string) {
    // Sadece browser'da çalıştığından emin ol
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;
    this.communityService.getCommunityById(id).subscribe({
      next: (data) => {
        if (data) {
          this.community = data;
          this.communityId = id;
          // Topluluk yüklendikten sonra etkinlikleri backend'den yükle
          this.loadCommunityEvents(id);
        } else {
          // Topluluk bulunamadıysa listeye yönlendir
          this.router.navigate(['/communities']);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Topluluk yüklenemedi:', err);
        this.router.navigate(['/communities']);
        this.isLoading = false;
      },
    });
  }

  /**
   * EventItem[] array'inden tüm onaylanmış etkinlikleri filtrele ve işle
   * Tarih filtresi yok - tüm onaylanmış etkinlikler gösterilir
   * Tarihe göre sıralanır (en yakın önce) ve sayfalama uygulanır
   */
  private processUpcomingEventsFromEventItems(events: EventItem[]): void {
    if (!events || events.length === 0) {
      this.upcomingEvents = [];
      this.paginatedEvents = [];
      this.totalPages = 0;
      return;
    }

    // Tüm onaylanmış etkinlikleri filtrele ve sırala (tarih filtresi yok)
    const upcoming = events
      .filter((event) => {
        // Sadece onaylanmış etkinlikleri göster
        return event.status === 'Onaylandı';
      })
      .sort((a, b) => {
        // Tarihe göre sırala (en yakın önce)
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
      })
      .map((event) => ({
        id: event.id,
        title: event.title || 'Etkinlik',
        date: event.startDate || '',
        location: event.location || '',
        description: event.shortDescription || event.description || event.title || '',
        imageUrl: event.imageUrl,
      }));

    this.upcomingEvents = upcoming;

    // Sayfalama hesapla
    this.totalPages = Math.ceil(upcoming.length / this.itemsPerPage);
    this.currentPage = 1; // Her yüklemede ilk sayfaya dön
    this.updatePaginatedEvents();
  }

  /**
   * Sayfalama için etkinlikleri güncelle
   */
  private updatePaginatedEvents(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEvents = this.upcomingEvents.slice(startIndex, endIndex);
  }

  /**
   * Sayfa değiştir
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedEvents();
      // Sayfanın üstüne kaydır
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  /**
   * Önceki sayfa
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.changePage(this.currentPage - 1);
    }
  }

  /**
   * Sonraki sayfa
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.changePage(this.currentPage + 1);
    }
  }

  /**
   * Sayfa numaralarını döndür (pagination için)
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  loadCommunityEvents(communityId: string) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoadingEvents = true;

    // Backend'den tüm etkinlikleri çek ve bu topluluğa ait olanları filtrele
    this.eventService.getAll().subscribe({
      next: (events) => {
        // Backend'den gelen EventListItemDto'da ComId yok, sadece CommunityName var
        // Bu yüzden CommunityName ile filtreleme yapıyoruz
        const communityName = this.community?.name;

        if (!communityName) {
          // Topluluk adı yoksa boş array döndür
          this.communityEvents = [];
          this.upcomingEvents = [];
          this.isLoadingEvents = false;
          return;
        }

        // Bu topluluğa ait etkinlikleri filtrele
        // Önce communityId ile deneyelim (eğer backend'den geliyorsa)
        let filteredEvents = events.filter((e) => {
          const eventCommunityId = String(e.communityId || '');
          if (eventCommunityId && eventCommunityId !== '0' && eventCommunityId === communityId) {
            return true;
          }
          // Eğer communityId yoksa veya eşleşmiyorsa, CommunityName ile filtrele
          const eventCommunityName = e.communityName || '';
          return eventCommunityName.trim().toLowerCase() === communityName.trim().toLowerCase();
        });

        // Sadece onaylanmış etkinlikleri göster (public sayfa olduğu için)
        this.communityEvents = filteredEvents.filter((e) => e.status === 'Onaylandı');

        // Yaklaşan etkinlikleri de güncelle
        this.processUpcomingEventsFromEventItems(filteredEvents);

        this.isLoadingEvents = false;
      },
      error: (err) => {
        // Hata durumunda boş array kullan
        this.communityEvents = [];
        this.upcomingEvents = [];
        this.isLoadingEvents = false;
      },
    });
  }

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }

  goBack() {
    this.router.navigate(['/communities']);
  }

  openLink(url: string) {
    if (isPlatformBrowser(this.platformId) && url) {
      window.open(url, '_blank');
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  navigateToEvent(eventId: number): void {
    this.router.navigate(['/events', eventId]);
  }

  formatEventDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateString;
    }
  }

  joinCommunity() {
    // TODO: Implement join community functionality
    console.log('Join community:', this.community?.id);
    // This can be connected to a service method later
  }

  copyEmailSuccess: boolean = false;

  copyToClipboard(text: string) {
    if (!isPlatformBrowser(this.platformId) || !text) {
      return;
    }

    // Use Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.showCopySuccess();
        })
        .catch((err) => {
          console.error('Failed to copy:', err);
          this.fallbackCopyToClipboard(text);
        });
    } else {
      // Fallback for older browsers
      this.fallbackCopyToClipboard(text);
    }
  }

  private fallbackCopyToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.showCopySuccess();
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
    } finally {
      document.body.removeChild(textArea);
    }
  }

  private showCopySuccess() {
    this.copyEmailSuccess = true;
    setTimeout(() => {
      this.copyEmailSuccess = false;
    }, 2000);
  }

  // Image error handler - Placeholder görsellerin sürekli istek atmasını engeller
  onImageError(event: Event, type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar' = 'cover'): void {
    this.imageErrorHandler.handleImageError(event, type);
  }
}
