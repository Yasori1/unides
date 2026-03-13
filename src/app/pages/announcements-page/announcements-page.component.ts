import { Component, OnInit, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnnouncementService, Announcement } from '../../services/announcement.services';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';
import { Logger } from '../../utils/logger.util';

// --- Interface Tanımı (DÜZELTİLDİ) ---
// Omit kullanarak Announcement içindeki orijinal 'link' tanımını çıkardık
// ve aşağıda kendi isteğe bağlı 'link?' tanımımızı ekledik.
interface ExtendedAnnouncement extends Announcement {
  link: string;
}

@Component({
  selector: 'app-announcements-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SiteNavbarComponent, SiteFooterComponent, FormsModule],
  templateUrl: './announcements-page.component.html',
  styleUrls: ['./announcements-page.component.scss'],
})
export class AnnouncementsPageComponent implements OnInit {
  // Banner Animasyonu
  heroMoveX = 0;
  heroMoveY = 0;

  // Veri Listeleri
  allAnnouncements: ExtendedAnnouncement[] = [];
  filteredAnnouncements: ExtendedAnnouncement[] = [];
  displayedAnnouncements: ExtendedAnnouncement[] = [];

  // Filtreleme
  searchText: string = '';
  sortOrder: 'default' | 'date_desc' | 'date_asc' = 'default';

  // Custom Dropdown States
  isSortDropdownOpen: boolean = false;

  // Sayfalama
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 0;
  pages: number[] = [];

  isLoading: boolean = true;

  constructor(
    private announcementService: AnnouncementService,
    private imageErrorHandler: ImageErrorHandlerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAnnouncements();
      // Placeholder'ın varlığını önceden kontrol et
      this.imageErrorHandler.checkPlaceholderExists('assets/img/placeholder-announcement.jpg');
    }
  }

  loadAnnouncements(page?: number) {
    this.isLoading = true;
    const requestedPage = page ?? this.currentPage ?? 1;

    this.announcementService.getAnnouncementsPage(requestedPage, this.itemsPerPage).subscribe({
      next: (res) => {
        const generalData: ExtendedAnnouncement[] = (res.items || []).map(item => ({
          ...item,
          link: item.link || ''
        }));
        this.allAnnouncements = generalData;
        this.filteredAnnouncements = [...generalData];
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        Logger.error('Duyurular yüklenirken hata oluştu:', err);
        this.isLoading = false;
        this.allAnnouncements = [];
        this.filteredAnnouncements = [];
        this.totalPages = 0;
        this.pages = [];
      }
    });
  }

  // --- FİLTRELEME MANTIĞI ---
  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value;
    this.applyFilters();
  }

  applyFilters() {
    let temp = [...this.allAnnouncements];

    // 1. Arama Metni (Türkçe Karakter Destekli)
    if (this.searchText && this.searchText.trim()) {
      const term = this.searchText.toLocaleLowerCase('tr-TR');
      temp = temp.filter(
        (a) =>
          (a.title && a.title.toLocaleLowerCase('tr-TR').includes(term)) ||
          (a.shortDescription && a.shortDescription.toLocaleLowerCase('tr-TR').includes(term))
      );
    }

    // 2. Sıralama
    if (this.sortOrder === 'date_desc') {
      temp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (this.sortOrder === 'date_asc') {
      temp.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      // Varsayılan: Tarihe göre (Yeni -> Eski)
      temp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    this.filteredAnnouncements = temp;
    this.displayedAnnouncements = [...this.filteredAnnouncements];
  }

  // --- SAYFALAMA (backend sayfa bazlı) ---
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadAnnouncements(page);
    }
  }

  // --- CUSTOM DROPDOWN MANTIĞI ---
  toggleSortDropdown(event: Event) {
    event.stopPropagation();
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
  }

  selectSort(order: 'default' | 'date_desc' | 'date_asc') {
    this.sortOrder = order;
    this.applyFilters();
    this.isSortDropdownOpen = false;
  }

  getSortLabel(order: string): string {
    switch (order) {
      case 'date_desc': return 'Tarih (Yeni-Eski)';
      case 'date_asc': return 'Tarih (Eski-Yeni)';
      default: return 'Önerilen Sıralama';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.isSortDropdownOpen = false;
  }

  // --- YARDIMCI FONKSİYONLAR ---
  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - 200;
      this.heroMoveX = x / 30;
      this.heroMoveY = y / 30;
    }
  }

  formatDate(dateString: string): string {
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

  // Image error handler - Placeholder görsellerin sürekli istek atmasını engeller
  onImageError(event: Event, type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar' = 'announcement'): void {
    this.imageErrorHandler.handleImageError(event, type);
  }

  // Placeholder URL'i al - eğer placeholder yoksa data URI döndür
  getPlaceholderUrl(type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar' = 'announcement'): string {
    return this.imageErrorHandler.getPlaceholderUrl(type);
  }
}