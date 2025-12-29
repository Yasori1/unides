import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { CommunityService, Community } from '../../services/community.services';
import { EventService, EventItem } from '../../services/event.services';

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
  communityId: number | null = null;
  communityEvents: EventItem[] = [];
  isLoadingEvents: boolean = false;

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
      const id = +params['id'];
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

  loadCommunity(id: number) {
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

  loadCommunityEvents(communityId: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoadingEvents = true;
    this.eventService.getAll().subscribe({
      next: (events) => {
        // Bu topluluğa ait etkinlikleri filtrele
        this.communityEvents = events.filter((e) => e.communityId === communityId);
        this.isLoadingEvents = false;
      },
      error: (err) => {
        console.error('Etkinlikler yüklenemedi:', err);
        this.communityEvents = [];
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
}
