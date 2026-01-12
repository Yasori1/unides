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

  // Mock data for upcoming events
  upcomingEvents: CommunityEvent[] = [
    {
      id: 1,
      title: 'Networking Meetup',
      date: '2024-03-15',
      location: 'Kampüs Merkez Binası, Konferans Salonu',
      description:
        'Topluluk üyeleri ve mezunlarla tanışma, networking fırsatları ve kariyer paylaşımları.',
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    },
    {
      id: 2,
      title: 'Tech Workshop: Web Development',
      date: '2024-03-22',
      location: 'Bilgisayar Laboratuvarı A',
      description:
        'Modern web geliştirme teknolojileri, React ve Angular workshop. Pratik uygulamalar ve proje örnekleri.',
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
    },
    {
      id: 3,
      title: 'Kariyer Günleri',
      date: '2024-04-05',
      location: 'Spor Salonu',
      description:
        'Şirket temsilcileriyle buluşma, staj ve iş fırsatları, CV değerlendirme ve mülakat simülasyonları.',
      imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800',
    },
    {
      id: 4,
      title: 'Hackathon 2024',
      date: '2024-04-12',
      location: 'Teknoloji Merkezi',
      description:
        '48 saatlik kodlama maratonu. Takımlar halinde yarışın, ödüller kazanın ve network kurun.',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800',
    },
  ];

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
          // Topluluk yüklendikten sonra etkinlikleri yükle
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
