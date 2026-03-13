import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { EventService, EventItem } from '../../services/event.services';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';

@Component({
  selector: 'app-events-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './events-detail.component.html',
  styleUrls: ['./events-detail.component.scss'],
})
export class EventsDetailComponent implements OnInit {
  event: any = null;
  isLoading = true;
  heroMoveX = 0;
  heroMoveY = 0;
  isImageModalOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private imageErrorHandler: ImageErrorHandlerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        if (isPlatformBrowser(this.platformId)) {
             window.scrollTo(0, 0); // Scroll to top on navigation
        }
        this.fetchEventDetail(+id);
      } else {
          this.router.navigate(['/events']);
      }
    });
  }

  fetchEventDetail(id: number) {
    this.isLoading = true;
    this.eventService.getById(id).subscribe({
      next: (eventItem) => {
        this.event = this.mapToCard(eventItem);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/events']);
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

  openImageModal() {
    this.isImageModalOpen = true;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeImageModal() {
    this.isImageModalOpen = false;
    document.body.style.overflow = ''; // Restore background scrolling
  }

  // Image error handler - Placeholder görsellerin sürekli istek atmasını engeller
  onImageError(event: Event): void {
    this.imageErrorHandler.handleImageError(event, 'event');
  }

  getMonthName(date: Date): string {
      if (!date) return '';
      return date.toLocaleDateString('tr-TR', { month: 'short' });
  }

  // Deprecated mock method removed - data now loaded from backend

  private mapToCard(e: EventItem): any {
    const start = e.startDate ? new Date(e.startDate) : null;
    const formattedDate = start
      ? start.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    const formattedTime = start
      ? start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      : '';

    return {
      id: e.id,
      title: e.title || '',
      description: e.description || e.shortDescription || '',
      date: formattedDate,
      dateObj: start || new Date(),
      time: formattedTime,
      university: '',
      club: e.communityName || '',
      location: e.location || '',
      quota: e.quota !== undefined && e.quota !== null ? e.quota : 0,
      imageUrl: e.imageUrl || '',
      color: '#2563eb',
      city: '',
      contactEmail: e.contactEmail,
    } as any;
  }

  // Metni HTML formatına çevir: \n\n paragraf, \n <br> olarak gösterilir
  formatDescription(description: string): string {
    if (!description) return '';
    
    // Eğer zaten HTML formatındaysa (tag'ler varsa), olduğu gibi döndür
    if (description.includes('<') && description.includes('>')) {
      return description;
    }
    
    // HTML karakterlerini escape et
    const escaped = description
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Çift satır sonlarını paragraf olarak ayır
    const paragraphs = escaped.split(/\n\n+/);
    
    // Her paragrafı <p> etiketi içine al ve tek satır sonlarını <br> yap
    const formatted = paragraphs
      .map(para => {
        // Paragraf içindeki tek satır sonlarını <br> yap
        const withBreaks = para.replace(/\n/g, '<br>');
        // Boş paragrafları atla
        if (withBreaks.trim() === '') return '';
        return `<p>${withBreaks.trim()}</p>`;
      })
      .filter(p => p !== '')
      .join('');
    
    return formatted || escaped.replace(/\n/g, '<br>');
  }
}
