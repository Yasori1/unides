import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router'; // Router eklendi
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
  categories: string[] = [];

  // Filtreleme Değişkenleri
  searchText: string = '';
  selectedCity: string = '';
  selectedCategory: string = '';
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
    private router: Router, // Router servisi inject edildi
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

    // Servisten verileri çek (API yoksa Mock döner)
    this.communityService.getAllCommunities().subscribe({
      next: (data) => {
        // Eğer API'den veri gelmezse veya boş gelirse ve mock veri kullanmak istersek:
        if (data.length === 0) {
          this.allCommunities = this.communityService.getMockCommunities();
        } else {
          this.allCommunities = data;
        }

        // Filtre dropdownlarını doldur
        this.cities = [...new Set(this.allCommunities.map(c => c.city || 'Belirsiz'))].sort();
        this.categories = [...new Set(this.allCommunities.map(c => c.category))].sort();

        // --- ÖNEMLİ: URL Parametrelerini Kontrol Et ---
        const queryParams = this.route.snapshot.queryParams;

        if (queryParams['search']) {
          this.searchText = queryParams['search'];
        }

        if (queryParams['city']) {
          // Gelen şehir verimizde varsa seçili hale getir
          if (this.cities.includes(queryParams['city'])) {
            this.selectedCity = queryParams['city'];
          }
        }

        // Filtreleri uygula
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Topluluklar yüklenirken hata oluştu:', err);
        // Hata durumunda mock veriyi kullan
        this.allCommunities = this.communityService.getMockCommunities();
        this.cities = [...new Set(this.allCommunities.map(c => c.city || 'Belirsiz'))].sort();
        this.categories = [...new Set(this.allCommunities.map(c => c.category))].sort();
        this.applyFilters();
        this.isLoading = false;
      }
    });
  }

  // --- FİLTRELEME MANTIĞI ---
  applyFilters() {
    let temp = [...this.allCommunities];

    // 1. Arama Metni (Ad veya Üniversite içinde)
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

    // 3. Kategori Filtresi
    if (this.selectedCategory) {
      temp = temp.filter((c) => c.category === this.selectedCategory);
    }

    // 4. Sıralama
    if (this.sortOrder === 'member_desc') {
      temp.sort((a, b) => b.memberCount - a.memberCount);
    } else if (this.sortOrder === 'member_asc') {
      temp.sort((a, b) => a.memberCount - b.memberCount);
    }

    this.filteredCommunities = temp;
    this.currentPage = 1; // Filtre değişince ilk sayfaya dön
    this.initPagination();
  }

  resetFilters() {
    this.searchText = '';
    this.selectedCity = '';
    this.selectedCategory = '';
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

  // Detay sayfasına yönlendirme
  navigateToDetail(id: number) {
    this.router.navigate(['/communities', id]);
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
}