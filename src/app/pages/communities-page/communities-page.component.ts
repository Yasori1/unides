import { Component, OnInit, Inject, PLATFORM_ID, HostListener } from '@angular/core';
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

  // --- GÜNCELLEME: 81 İL LİSTESİ SABİT OLARAK EKLENDİ ---
  cities: string[] = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın',
    'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
    'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
    'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir',
    'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya',
    'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye',
    'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak',
    'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
  ];

  categories: string[] = [];

  // Yeni Tag Filtresi (Kullanıcı isteği)
  tags: string[] = ['Teknoloji', 'Sanat', 'Spor', 'Müzik', 'Bilim'];

  // Filtreleme Değişkenleri
  searchText: string = '';
  selectedCity: string = '';
  selectedCategory: string = '';
  selectedTag: string = ''; // Yeni tag seçimi
  sortOrder: 'default' | 'member_desc' | 'member_asc' = 'default';

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

  fetchCommunities() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;

    // URL Parametrelerini Kontrol Et ve backend'e query params olarak gönder
    const queryParams = this.route.snapshot.queryParams;
    const backendParams: {
      city?: string;
      university?: string;
      category?: string;
      name?: string;
    } = {};

    if (queryParams['search']) {
      this.searchText = queryParams['search'];
      backendParams.name = queryParams['search'];
    }

    if (queryParams['city']) {
      if (this.cities.includes(queryParams['city'])) {
        this.selectedCity = queryParams['city'];
        backendParams.city = queryParams['city'];
      }
    }

    if (queryParams['category']) {
      this.selectedCategory = queryParams['category'];
      backendParams.category = queryParams['category'];
    }

    if (queryParams['university']) {
      backendParams.university = queryParams['university'];
    }

    // Backend'e query parametreleriyle istek at
    // Anasayfada sadece aktif toplulukları göster
    this.communityService.getAllCommunities({
      ...backendParams,
      status: 'active', // Backend'de sadece aktif toplulukları getir
    }).subscribe({
      next: (data) => {
        this.allCommunities = data;

        // --- GÜNCELLEME: Şehirleri artık dinamik çekmiyoruz, yukarıdaki sabit listeyi kullanıyoruz. ---
        // Sadece kategorileri dinamik olarak veriden çekmeye devam ediyoruz.
        this.categories = [...new Set(this.allCommunities.map(c => c.category))].sort();

        // Backend'den zaten sadece aktif topluluklar geldiği için frontend'de ekstra filtreleme yapmaya gerek yok
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Topluluklar yüklenirken hata oluştu:', err);
        this.allCommunities = [];
        this.categories = [];
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

    // 2. Şehir Filtresi
    if (this.selectedCity) {
      temp = temp.filter((c) => c.city === this.selectedCity);
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
    this.selectedCategory = '';
    this.selectedTag = '';
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

  selectSort(order: 'default' | 'member_desc' | 'member_asc') {
    this.sortOrder = order;
    this.applyFilters();
    this.isSortDropdownOpen = false;
  }

  getSortLabel(order: string): string {
    switch (order) {
      case 'member_desc': return 'Üye Sayısı (Çoktan Az)';
      case 'member_asc': return 'Üye Sayısı (Azdan Çok)';
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
}
