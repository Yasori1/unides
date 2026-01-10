import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { CommunityService, Community } from '../../services/community.services';

@Component({
  selector: 'app-communities-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SiteNavbarComponent, SiteFooterComponent],
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

  // Filtre Seçenekleri
  cities: string[] = [];
  // categories removed

  // Filtreleme Değişkenleri
  searchText: string = '';
  selectedCity: string = '';
  // selectedCategory removed
  sortOrder: 'default' | 'member_desc' | 'member_asc' = 'default';

  // Sayfalama
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 0;
  pages: number[] = [];

  isLoading: boolean = true;

  constructor(
    private communityService: CommunityService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchCommunities();
    } else {
      this.isLoading = false;
    }
  }

  fetchCommunities() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;

    this.communityService.getAllCommunities().subscribe({
      next: (data) => {
        if (data.length === 0) {
          this.allCommunities = this.communityService.getMockCommunities();
        } else {
          this.allCommunities = data;
        }

        // Filtre dropdownlarını doldur
        this.cities = [...new Set(this.allCommunities.map(c => c.city || 'Belirsiz'))].sort();
        // categories removed

        // URL Parametrelerini Kontrol Et
        const queryParams = this.route.snapshot.queryParams;

        if (queryParams['search']) {
          this.searchText = queryParams['search'];
        }

        if (queryParams['city']) {
          // Gelen şehir bizim 81 il listemizde var mı diye bakıyoruz
          if (this.cities.includes(queryParams['city'])) {
            this.selectedCity = queryParams['city'];
          }
        }

        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Topluluklar yüklenirken hata oluştu:', err);
        this.allCommunities = this.communityService.getMockCommunities();
        this.cities = [...new Set(this.allCommunities.map(c => c.city || 'Belirsiz'))].sort();
        // this.categories removed
        this.applyFilters();
        this.isLoading = false;
      }
    });
  }

  // --- FİLTRELEME MANTIĞI ---
  applyFilters() {
    let temp = [...this.allCommunities];

    // 1. Arama Metni
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.university.toLowerCase().includes(term)
      );
    }

    // 2. Şehir Filtresi
    if (this.selectedCity) {
      temp = temp.filter((c) => c.city === this.selectedCity);
    }

    // 3. Kategori Filtresi removed

    // 4. Sıralama
    if (this.sortOrder === 'member_desc') {
      temp.sort((a, b) => b.memberCount - a.memberCount);
    } else if (this.sortOrder === 'member_asc') {
      temp.sort((a, b) => a.memberCount - b.memberCount);
    }

    this.filteredCommunities = temp;
    this.currentPage = 1;
    this.initPagination();
  }

  resetFilters() {
    this.searchText = '';
    this.selectedCity = '';
    // selectedCategory removed
    this.sortOrder = 'default';
    this.applyFilters();
  }

  // --- SAYFALAMA MANTIĞI ---
  initPagination() {
    this.totalPages = Math.ceil(this.filteredCommunities.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedCommunities = this.filteredCommunities.slice(startIndex, endIndex);
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

  navigateToDetail(id: number) {
    this.router.navigate(['/communities', id]);
  }

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }
}
