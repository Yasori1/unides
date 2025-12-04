import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { AnnouncementService, Announcement } from '../../services/announcement.services';

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './announcement-detail.component.html',
  styleUrls: ['./announcement-detail.component.scss'],
})
export class AnnouncementDetailComponent implements OnInit {
  announcement: Announcement | null = null;
  isLoading: boolean = true;
  announcementId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private announcementService: AnnouncementService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      if (id) {
        this.announcementId = id;
        this.loadAnnouncement(id);
      } else {
        this.router.navigate(['/announcements']);
      }
    });
  }

  loadAnnouncement(id: number) {
    this.isLoading = true;
    this.announcementService.getAnnouncementById(id).subscribe({
      next: (data) => {
        if (data) {
          this.announcement = data;
        } else {
          // Duyuru bulunamadıysa listeye yönlendir
          this.router.navigate(['/announcements']);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Duyuru yüklenemedi:', err);
        this.router.navigate(['/announcements']);
        this.isLoading = false;
      },
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  openLink(url: string) {
    if (isPlatformBrowser(this.platformId)) {
      window.open(url, '_blank');
    }
  }
}

