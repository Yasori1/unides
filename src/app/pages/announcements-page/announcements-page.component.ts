import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { AnnouncementService, Announcement } from '../../services/announcement.services';

@Component({
  selector: 'app-announcements-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './announcements-page.component.html',
  styleUrls: ['./announcements-page.component.scss'],
})
export class AnnouncementsPageComponent implements OnInit {
  // Banner Animasyonu için
  heroMoveX = 0;
  heroMoveY = 0;

  // Veri Listeleri
  allAnnouncements: Announcement[] = [];
  filteredAnnouncements: Announcement[] = [];
  displayedAnnouncements: Announcement[] = [];

  // Filtreleme Değişkenleri
  searchText: string = '';
  sortOrder: 'default' | 'date_desc' | 'date_asc' = 'default';

  // Sayfalama
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 0;
  pages: number[] = [];

  isLoading: boolean = true;

  constructor(
    private announcementService: AnnouncementService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.fetchAnnouncements();
  }

  fetchAnnouncements() {
    this.isLoading = true;
    this.announcementService.getAllAnnouncements().subscribe({
      next: (data) => {
        this.allAnnouncements = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Duyurular yüklenemedi:', err);
        this.isLoading = false;
      },
    });
  }

  // --- FİLTRELEME MANTIĞI ---
  applyFilters() {
    let temp = [...this.allAnnouncements];

    // 1. Arama Metni (Başlık veya Kısa Açıklama içinde)
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(
        (a) =>
          a.title.toLowerCase().includes(term) || a.shortDescription.toLowerCase().includes(term)
      );
    }

    // 2. Sıralama
    if (this.sortOrder === 'date_desc') {
      temp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (this.sortOrder === 'date_asc') {
      temp.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    this.filteredAnnouncements = temp;
    this.currentPage = 1;
    this.initPagination();
  }

  resetFilters() {
    this.searchText = '';
    this.sortOrder = 'default';
    this.applyFilters();
  }

  // --- SAYFALAMA MANTIĞI ---
  initPagination() {
    this.totalPages = Math.ceil(this.filteredAnnouncements.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedAnnouncements = this.filteredAnnouncements.slice(startIndex, endIndex);
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedData();
    }
  }

  // --- Banner Mouse Efekti ---
  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }

  // Tarih formatlama
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
