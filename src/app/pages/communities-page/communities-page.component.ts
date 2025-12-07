import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // FormsModule eklendi
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { CommunityService, Community } from '../../services/community.services';

@Component({
  selector: 'app-communities-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './communities-page.component.html',
  styleUrls: ['./communities-page.component.scss'],
})
export class CommunitiesPageComponent implements OnInit {
  // Banner Animasyonu için
  heroMoveX = 0;
  heroMoveY = 0;

  // Veri Listeleri
  allCommunities: Community[] = [];
  filteredCommunities: Community[] = []; // Filtrelenmiş ham liste
  displayedCommunities: Community[] = []; // Sayfalanmış liste

  // Filtre Seçenekleri (Dinamik doldurulabilir)
  cities: string[] = [];
  categories: string[] = [];

  // Filtreleme Değişkenleri
  searchText: string = '';
  selectedCity: string = '';
  selectedCategory: string = '';
  sortOrder: 'default' | 'member_desc' | 'member_asc' = 'default';

  // Sayfalama
  currentPage: number = 1;
  itemsPerPage: number = 12; // Grid düzenine daha uygun
  totalPages: number = 0;
  pages: number[] = [];

  isLoading: boolean = true;

  constructor(
    private communityService: CommunityService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // SSR sırasında HTTP istekleri yapma, sadece browser'da yap
    if (isPlatformBrowser(this.platformId)) {
      this.fetchCommunities();
    } else {
      // SSR sırasında boş liste göster
      this.isLoading = false;
    }
  }

  fetchCommunities() {
    // Sadece browser'da çalıştığından emin ol
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;
    this.communityService.getAllCommunities().subscribe({
      next: (data) => {
        this.allCommunities = data;

        // Şehir ve Kategorileri veriden dinamik çıkaralım (Tekrarı önlemek için Set kullanıyoruz)
        // Eğer data içinde 'city' yoksa 'university'den şehir çıkarmayı deneyebiliriz ya da mocklayabiliriz.
        // Şimdilik data'da city olduğunu varsayıyoruz veya mockluyoruz.
        this.cities = [
          ...new Set(data.map((c) => c.city || 'Belirsiz').filter((c) => c !== 'Belirsiz')),
        ].sort();
        this.categories = [...new Set(data.map((c) => c.category))].sort();

        // İlk filtrelemeyi çalıştır (Tümünü gösterir)
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Topluluklar yüklenemedi:', err);
        this.isLoading = false;
      },
    });
  }

  // --- FİLTRELEME MANTIĞI ---
  applyFilters() {
    let temp = [...this.allCommunities];

    // 1. Arama Metni (Ad veya Üniversite içinde)
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(
        (c) => c.name.toLowerCase().includes(term) || c.university.toLowerCase().includes(term)
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
