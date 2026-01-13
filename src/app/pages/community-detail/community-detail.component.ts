import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { CommunityService, Community } from '../../services/community.services';
import { EventService, EventItem } from '../../services/event.services';
import { CommunityEventDto } from '../../models/community.models';

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

  // Banner animation
  heroMoveX = 0;
  heroMoveY = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private communityService: CommunityService,
    private eventService: EventService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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
          // Backend'den gelen events'i kontrol et ve yaklaşan etkinlikleri filtrele
          this.processUpcomingEvents(data.events || []);
          // Topluluk yüklendikten sonra etkinlikleri yükle (fallback için)
          if (data) {
            this.loadCommunityEvents(id);
          }
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
   * Backend'den gelen events'i işle ve yaklaşan etkinlikleri filtrele
   * Yaklaşan etkinlik: startDate bugünden sonra olan etkinlikler
   */
  private processUpcomingEvents(events: CommunityEventDto[]): void {
    if (!events || events.length === 0) {
      this.upcomingEvents = [];
      return;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Bugünün başlangıcı

    // Yaklaşan etkinlikleri filtrele ve sırala
    const upcoming = events
      .filter((event) => {
        if (!event.startDate) return false;
        const eventDate = new Date(event.startDate);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now; // Bugün ve sonrası
      })
      .sort((a, b) => {
        // Tarihe göre sırala (en yakın önce)
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
      })
      .map((event, index) => ({
        id: index + 1, // Frontend için ID
        title: event.title || 'Etkinlik',
        date: event.startDate || '',
        location: event.location || '',
        description: event.title || '', // Backend'de description yok, title kullan
        imageUrl: undefined, // Backend'de imageUrl yok
      }));

    this.upcomingEvents = upcoming;
  }

  loadCommunityEvents(communityId: string) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoadingEvents = true;
    // Backend'den gelen community.events kullanılacak
    if (this.community?.events && this.community.events.length > 0) {
      // Backend'den gelen events'i kullan
      this.communityEvents = this.community.events.map((e: CommunityEventDto) => ({
        id: parseInt(e.eventId) || 0, // EventItem id number bekliyor
        title: e.title || '',
        date: e.startDate || '',
        location: e.location || '',
        description: '',
        communityId: parseInt(this.communityId || '0') || 0, // EventItem communityId number bekliyor
      }));
      this.isLoadingEvents = false;
    } else {
      // Eğer backend'de events yoksa, eski event service'ten çek (fallback)
      this.eventService.getAll().subscribe({
        next: (events) => {
          // Bu topluluğa ait etkinlikleri filtrele
          // EventItem'da communityId number, bizim communityId string (Guid)
          // String'e çevirip karşılaştırıyoruz
          this.communityEvents = events.filter((e) => String(e.communityId) === communityId);
          this.isLoadingEvents = false;
        },
        error: (err) => {
          console.error('Etkinlikler yüklenemedi:', err);
          this.communityEvents = [];
          this.isLoadingEvents = false;
        },
      });
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
}
