import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { AnnouncementService, Announcement } from '../../services/announcement.services';

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SiteNavbarComponent, SiteFooterComponent],
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
        // SSR sırasında HTTP istekleri yapma, sadece browser'da yap
        if (isPlatformBrowser(this.platformId)) {
          this.loadAnnouncement(id);
        } else {
          // SSR sırasında loading durumunu kapat
          this.isLoading = false;
        }
      } else {
        if (isPlatformBrowser(this.platformId)) {
          this.router.navigate(['/announcements']);
        }
      }
    });
  }

  loadAnnouncement(id: number) {
    // Sadece browser'da çalıştığından emin ol
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;
    this.announcementService.getAnnouncementById(id).subscribe({
      next: (data) => {
        if (data) {
          this.announcement = data;
        } else {
          // Duyuru bulunamadıysa listeye yönlendir
          if (isPlatformBrowser(this.platformId)) {
            this.router.navigate(['/announcements']);
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Duyuru yüklenemedi:', err);
        // Hata durumunda hemen yönlendirme yapma, belki geçici bir hatadır.
        // if (isPlatformBrowser(this.platformId)) {
        //   this.router.navigate(['/announcements']);
        // }
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
