import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  HostListener,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
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
export class CommunitiesPageComponent implements OnInit, AfterViewInit, OnDestroy {
  // Banner Animasyonu için
  heroMoveX = 0;
  heroMoveY = 0;

  // Veri Listeleri
  allCommunities: Community[] = [];
  filteredCommunities: Community[] = [];
  displayedCommunities: Community[] = [];

  /** Türkiye illeri — tek kaynak: data/cities.json */
  cities: string[] = CITY_NAMES;
  /** Şehir açılır listesinde arama (Türkçe karakter uyumlu) */
  cityFilterSearch: string = '';

  get filteredCities(): string[] {
    const q = this.cityFilterSearch.trim().toLocaleLowerCase('tr-TR');
    if (!q) {
      return this.cities;
    }
    return this.cities.filter((city) => city.toLocaleLowerCase('tr-TR').includes(q));
  }

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

  // Sayfalama (backend'den gelen totalCount / totalPages kullanılır)
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 0;
  totalCount: number = 0;
  pages: number[] = [];

  isLoading: boolean = true;
  private marqueeMetaById: Record<string, { shift: number; duration: number }> = {};
  private marqueeChangesSub?: Subscription;
  @ViewChildren('communityNameEl') communityNameEls!: QueryList<ElementRef<HTMLElement>>;

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

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.marqueeChangesSub = this.communityNameEls.changes.subscribe(() => this.scheduleMarqueeMeasure());
    this.scheduleMarqueeMeasure();
  }

  ngOnDestroy(): void {
    this.marqueeChangesSub?.unsubscribe();
  }

  fetchCommunities(page?: number) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;
    const requestedPage = page ?? this.currentPage ?? 1;

    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['search']) this.searchText = queryParams['search'];
    if (queryParams['category']) this.selectedCategory = queryParams['category'];

    const backendParams: { name?: string; city?: string; category?: string; university?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {};
    if (this.searchText?.trim()) backendParams.name = this.searchText.trim();
    if (this.selectedCity?.trim()) backendParams.city = this.selectedCity.trim();
    if ((this.selectedTag || this.selectedCategory)?.trim()) backendParams.category = (this.selectedTag || this.selectedCategory)!.trim();
    if (this.sortOrder === 'name_asc') {
      backendParams.sortBy = 'name';
      backendParams.sortOrder = 'asc';
    } else if (this.sortOrder === 'name_desc') {
      backendParams.sortBy = 'name';
      backendParams.sortOrder = 'desc';
    }

    this.communityService.getCommunitiesPublicPage(requestedPage, this.itemsPerPage, backendParams).subscribe({
      next: (res) => {
        this.allCommunities = res.items;
        this.filteredCommunities = res.items;
        this.displayedCommunities = res.items;
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.totalCount = res.totalCount ?? res.items.length;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.isLoading = false;
        this.scheduleMarqueeMeasure();
      },
      error: (err) => {
        Logger.error('Topluluklar yüklenirken hata oluştu:', err);
        this.allCommunities = [];
        this.filteredCommunities = [];
        this.displayedCommunities = [];
        this.totalPages = 0;
        this.totalCount = 0;
        this.pages = [];
        this.isLoading = false;
        this.marqueeMetaById = {};
      }
    });
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.scheduleMarqueeMeasure();
  }

  /** Filtre/sıralama değişince sayfa 1 ile yeniden istek at (backend tüm filtrelemeyi yapar). */
  onFiltersOrSortChange() {
    this.fetchCommunities(1);
  }

  resetFilters() {
    this.searchText = '';
    this.cityFilterSearch = '';
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

  getVisiblePages(): number[] {
    if (this.totalPages <= 0) return [];
    const maxVisible = 5;
    const start = Math.max(1, Math.min(this.currentPage, this.totalPages - maxVisible + 1));
    const end = Math.min(this.totalPages, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  isCommunityNameMarquee(id: string): boolean {
    return (this.marqueeMetaById[id]?.shift || 0) > 0;
  }

  getCommunityNameMarqueeShift(id: string): number {
    return this.marqueeMetaById[id]?.shift || 0;
  }

  getCommunityNameMarqueeDuration(id: string): number {
    return this.marqueeMetaById[id]?.duration || 8;
  }

  private scheduleMarqueeMeasure(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => this.measureCommunityNameOverflow(), 0);
  }

  private measureCommunityNameOverflow(): void {
    if (!isPlatformBrowser(this.platformId) || !this.communityNameEls) return;

    const nextMeta: Record<string, { shift: number; duration: number }> = {};
    this.communityNameEls.forEach((ref) => {
      const textEl = ref.nativeElement;
      const id = textEl.dataset['communityId'] || '';
      if (!id) return;

      const container = textEl.closest('.title-wrapper') as HTMLElement | null;
      if (!container) return;

      const textWidth = this.measureSingleLineTextWidth(textEl);
      const visibleWidth = container.clientWidth;
      const singleLineShift = Math.max(0, textWidth - visibleWidth);
      const overflowsTwoLines = this.measureOverflowsTwoLines(textEl, visibleWidth);
      const shift = overflowsTwoLines ? singleLineShift : 0;
      // Hızı belirgin artır
      const duration = Math.max(1.1, Math.min(3.2, 1.1 + shift / 180));
      nextMeta[id] = { shift, duration };
    });

    this.marqueeMetaById = nextMeta;
  }

  private measureSingleLineTextWidth(textEl: HTMLElement): number {
    const text = (textEl.textContent || '').trim();
    if (!text) return 0;

    const computed = window.getComputedStyle(textEl);
    const probe = document.createElement('span');
    probe.textContent = text;
    probe.style.position = 'fixed';
    probe.style.visibility = 'hidden';
    probe.style.whiteSpace = 'nowrap';
    probe.style.pointerEvents = 'none';
    probe.style.fontFamily = computed.fontFamily;
    probe.style.fontSize = computed.fontSize;
    probe.style.fontWeight = computed.fontWeight;
    probe.style.letterSpacing = computed.letterSpacing;
    probe.style.textTransform = computed.textTransform;
    document.body.appendChild(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    return width;
  }

  private measureOverflowsTwoLines(textEl: HTMLElement, widthPx: number): boolean {
    const text = (textEl.textContent || '').trim();
    if (!text || widthPx <= 0) return false;

    const computed = window.getComputedStyle(textEl);
    const probe = document.createElement('span');
    probe.textContent = text;
    probe.style.position = 'fixed';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.whiteSpace = 'normal';
    probe.style.width = `${widthPx}px`;
    probe.style.fontFamily = computed.fontFamily;
    probe.style.fontSize = computed.fontSize;
    probe.style.fontWeight = computed.fontWeight;
    probe.style.letterSpacing = computed.letterSpacing;
    probe.style.lineHeight = computed.lineHeight;
    probe.style.textTransform = computed.textTransform;
    probe.style.wordBreak = 'break-word';
    probe.style.overflowWrap = 'break-word';
    document.body.appendChild(probe);

    const probeHeight = probe.getBoundingClientRect().height;
    probe.remove();

    const parsedLineHeight = parseFloat(computed.lineHeight);
    const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : parseFloat(computed.fontSize) * 1.3;
    const twoLineHeight = lineHeight * 2;
    return probeHeight > twoLineHeight + 1;
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
    this.cityFilterSearch = '';
    this.selectedCity = city;
    this.onFiltersOrSortChange();
    this.isCityDropdownOpen = false;
  }

  selectTag(tag: string) {
    this.selectedTag = tag;
    this.onFiltersOrSortChange();
    this.isTagDropdownOpen = false;
  }

  selectSort(order: 'default' | 'name_asc' | 'name_desc') {
    this.sortOrder = order;
    this.onFiltersOrSortChange();
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
