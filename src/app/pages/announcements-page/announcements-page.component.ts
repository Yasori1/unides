import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnnouncementService, Announcement } from '../../services/announcement.services';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-announcements-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SiteNavbarComponent, SiteFooterComponent, FormsModule],
  templateUrl: './announcements-page.component.html',
  styleUrls: ['./announcements-page.component.scss'],
})
export class AnnouncementsPageComponent implements OnInit {
  announcements: Announcement[] = [];
  filteredAnnouncements: Announcement[] = [];
  isLoading = true;
  searchText = '';

  constructor(
    private announcementService: AnnouncementService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAnnouncements();
    }
  }

  loadAnnouncements() {
    this.isLoading = true;
    this.announcementService.getAllAnnouncements().subscribe({
      next: (data) => {
        this.announcements = data;
        this.filteredAnnouncements = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Duyurular yüklenirken hata oluştu:', err);
        this.isLoading = false;
      }
    });
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value.toLowerCase();
    this.filterAnnouncements();
  }

  filterAnnouncements() {
    if (!this.searchText) {
      this.filteredAnnouncements = this.announcements;
      return;
    }
    this.filteredAnnouncements = this.announcements.filter(a => 
      a.title.toLowerCase().includes(this.searchText) ||
      (a.shortDescription && a.shortDescription.toLowerCase().includes(this.searchText))
    );
  }
}
