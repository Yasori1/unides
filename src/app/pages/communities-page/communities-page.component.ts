import { Component, OnInit, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { CommunityService, Community } from '../../services/community.services';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';
import { Logger } from '../../utils/logger.util';
import { TurkishUppercasePipe } from '../../pipes/turkish-uppercase.pipe';
import { CITY_NAMES } from '../../data/cities';

@Component({
  selector: 'app-communities-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SiteNavbarComponent, SiteFooterComponent, TurkishUppercasePipe],
  templateUrl: './communities-page.component.html',
  styleUrls: ['./communities-page.component.scss'],
})
export class CommunitiesPageComponent implements OnInit {
  // Banner Animasyonu için
  heroMoveX = 0;
  heroMoveY = 0;

  // Veri Listeleri
  allCommunities: Community[] = [];
  filteredCommunities: Community[] = [];
  displayedCommunities: Community[] = [];

  /** Türkiye illeri — tek kaynak: data/cities.json */
  cities: string[] = CITY_NAMES;

  categories: string[] = [];

  // Yeni Tag Filtresi (Kullanıcı isteği)
  tags: string[] = ['Teknoloji', 'Sanat', 'Spor', 'Müzik', 'Bilim'];

  // Filtreleme Değişkenleri
  searchText: string = '';
  selectedCity: string = '';
  selectedCategory: string = '';
  selectedTag: string = ''; // Yeni tag seçimi
  sortOrder: 'default' | 'name_asc' | 'name_desc' = 'default';

  // Custom Dropdown States
  isCityDropdownOpen: boolean = false;
  isTagDropdownOpen: boolean = false;
  isSortDropdownOpen: boolean = false;

  // Sayfalama
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 0;
  pages: number[] = [];

  isLoading: boolean = true;

  constructor(
    private communityService: CommunityService,
    private imageErrorHandler: ImageErrorHandlerService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchCommunities();
    } else {
      this.isLoading = false;
    }
  }

  fetchCommunities(page?: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;
    const requestedPage = page ?? this.currentPage ?? 1;

    const queryParams = this.route.snapshot.queryParams;
    const backendParams: { university?: string; category?: string; name?: string } = {};
    if (queryParams['search']) this.searchText = queryParams['search'];
    if (queryParams['category']) this.selectedCategory = queryParams['category'];
    if (queryParams['university']) backendParams.university = queryParams['university'];
    if (this.searchText?.trim()) backendParams.name = this.searchText.trim();
    if (this.selectedCategory?.trim()) backendParams.category = this.selectedCategory.trim();

    this.communityService.getCommunitiesPublicPage(requestedPage, this.itemsPerPage, backendParams).subscribe({
      next: (res) => {
        this.allCommunities = res.items;
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.categories = [...new Set(this.allCommunities.map(c => c.category))].sort();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        Logger.error('Topluluklar yüklenirken hata oluştu:', err);
        this.allCommunities = [];
        this.categories = [];
        this.totalPages = 0;
        this.pages = [];
        this.applyFilters();
        this.isLoading = false;
      }
    });
  }

  // --- FİLTRELEME MANTIĞI ---
  applyFilters() {
    let temp = [...this.allCommunities];

    // Backend'den zaten sadece aktif topluluklar geldiği için (status='active' ile istek atıldı)
    // Frontend'de ekstra filtreleme yapmaya gerek yok
    // Ancak güvenlik için yine de kontrol ediyoruz
    temp = temp.filter((c) => {
      // isActivity boolean değeri varsa onu kullan, yoksa status string'ini kontrol et
      if (c.isActivity !== undefined) {
        return c.isActivity === true;
      }
      return c.status === 'Aktif' || c.status === undefined;
    });

    // 1. Arama Metni
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.university.toLowerCase().includes(term)
      );
    }

    // 2. Şehir filtresi (sadece frontend; API'den tüm aktif topluluklar zaten çekildi)
    if (this.selectedCity) {
      temp = temp.filter((c) => (c.city || '').trim() === this.selectedCity);
    }

    // 3. Kategori Filtresi (URL'den gelen)
    if (this.selectedCategory) {
      temp = temp.filter((c) => c.category === this.selectedCategory);
    }

    // 4. Tag Filtresi (Yeni eklenen - Kategoriye göre filtreler)
    if (this.selectedTag) {
      // Not: Şu an için tag'ler kategori alanında tutuluyor varsayıyoruz veya kategori ile eşleşiyor
      // İleride ayrı bir tag alanı olursa burası güncellenebilir.
      // Şimdilik kategori içinde arama yapıyoruz veya tam eşleşme
      temp = temp.filter((c) => c.category === this.selectedTag || c.category.includes(this.selectedTag));
    }

    // 5. Sıralama
    if (this.sortOrder === 'name_asc') {
      temp.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
    } else if (this.sortOrder === 'name_desc') {
      temp.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'tr'));
    }

    this.filteredCommunities = temp;
    this.displayedCommunities = [...this.filteredCommunities];
  }

  resetFilters() {
    this.searchText = '';
    this.selectedCity = '';
    this.selectedCategory = '';
    this.selectedTag = '';
    this.sortOrder = 'default';
    this.fetchCommunities(1);
  }

  // --- SAYFALAMA (backend sayfa bazlı) ---
  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.fetchCommunities(page);
    }
  }

  navigateToDetail(id: string) {
    this.router.navigate(['/communities', id]);
  }

  // --- CUSTOM DROPDOWN MANTIĞI ---
  toggleCityDropdown(event: Event) {
    event.stopPropagation();
    this.isCityDropdownOpen = !this.isCityDropdownOpen;
    this.isTagDropdownOpen = false;
    this.isSortDropdownOpen = false;
  }

  toggleTagDropdown(event: Event) {
    event.stopPropagation();
    this.isTagDropdownOpen = !this.isTagDropdownOpen;
    this.isCityDropdownOpen = false;
    this.isSortDropdownOpen = false;
  }

  toggleSortDropdown(event: Event) {
    event.stopPropagation();
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
    this.isCityDropdownOpen = false;
    this.isTagDropdownOpen = false;
  }

  selectCity(city: string) {
    this.selectedCity = city;
    this.applyFilters();
    this.isCityDropdownOpen = false;
  }

  selectTag(tag: string) {
    this.selectedTag = tag;
    this.applyFilters();
    this.isTagDropdownOpen = false;
  }

  selectSort(order: 'default' | 'name_asc' | 'name_desc') {
    this.sortOrder = order;
    this.applyFilters();
    this.isSortDropdownOpen = false;
  }

  getSortLabel(order: string): string {
    switch (order) {
      case 'name_asc': return "A'dan Z'ye Sıralama";
      case 'name_desc': return "Z'den A'ya Sıralama";
      default: return 'Önerilen Sıralama';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.isCityDropdownOpen = false;
    this.isTagDropdownOpen = false;
    this.isSortDropdownOpen = false;
  }

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }

  // Image error handler - Placeholder görsellerin sürekli istek atmasını engeller
  onImageError(event: Event, type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar' = 'cover'): void {
    this.imageErrorHandler.handleImageError(event, type);
  }
}
