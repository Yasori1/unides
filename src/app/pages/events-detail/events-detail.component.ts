import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { EventService, EventItem } from '../../services/event.services';

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
    this.eventService.getAll().subscribe({
        next: (events) => {
            const found = events.find(e => e.id === id);
            if (found) {
                this.event = this.mapToCard(found);
                this.isLoading = false;
            } else {
                // Mock event kaldırıldı
                this.isLoading = false;
            }
        },
        error: () => {
             // Mock event kaldırıldı
            this.isLoading = false;
        }
    })
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

  // Image error handler - prevents infinite loop of 404 requests
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Only set fallback if not already set to prevent infinite loop
    if (img.src && !img.src.includes('page-title1.jpg') && !img.src.includes('placeholder-cover.svg')) {
      img.src = 'assets/images/page-title1.jpg';
      // Remove onerror to prevent infinite loop
      img.onerror = null;
    }
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
      category: 'Etkinlik',
      date: formattedDate,
      dateObj: start || new Date(),
      time: formattedTime,
      university: '',
      club: e.communityName || '',
      location: e.location || '',
      quota: 0,
      imageUrl: e.imageUrl || '',
      color: '#2563eb',
      city: '',
    } as any;
  }
}
