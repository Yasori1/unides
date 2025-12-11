import {
  Component,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  OnInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger, group } from '@angular/animations';

import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
// CommunityService import edildi
import { CommunityService } from '../../services/community.services';
import { EventService, EventItem } from '../../services/event.services';

interface EventCard {
  id: number;
  title: string;
  description: string;
  category: string;
  date: string;
  dateObj: Date;
  time: string;
  location: string;
  university: string;
  club: string;
  semester: string; // Topluluk İsmi
  quota: number;
  imageUrl: string;
  color: string;
  status: 'active' | 'upcoming';
  city?: string; // Arama için şehir bilgisi eklendi
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        group([
          query(
            ':leave',
            [animate('300ms ease-out', style({ opacity: 0, transform: 'scale(0.95)' }))],
            { optional: true }
          ),
          query(
            ':enter',
            [
              style({ opacity: 0, transform: 'translateY(20px)' }),
              stagger('40ms', [
                animate(
                  '400ms cubic-bezier(0.16, 1, 0.3, 1)',
                  style({ opacity: 1, transform: 'none' })
                ),
              ]),
            ],
            { optional: true }
          ),
        ]),
      ]),
    ]),
  ],
})
export class EventsComponent implements OnInit, AfterViewInit {
  // Hero Animasyonu
  heroMoveX: number = 0;
  heroMoveY: number = 0;

  // Filtreleme
  activeCategory: string = 'Tümü';
  categories: string[] = ['Tümü', 'Teknoloji', 'Sanat', 'Müzik', 'Kariyer', 'Spor', 'Gezi'];
  searchQuery: string = '';
  currentFilter: 'all' | 'active' | 'upcoming' = 'all';

  // Sıralama
  sortCriteria: 'date' | 'name' | 'semester' = 'date';
  sortAscending: boolean = true;

  // Detay Modal
  selectedEvent: EventCard | null = null;

  // Sayfalama
  allEventsPool: EventCard[] = [];
  displayedEvents: EventCard[] = [];
  currentPage: number = 0;
  pageSize: number = 8;
  isLoadingMore: boolean = false;
  hasMoreData: boolean = true;
  allCommunities: any[] = [];

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;

  // Slider Görselleri
  sliderImages: string[] = [
    'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop',
    'https://media.istockphoto.com/id/1486287149/tr/foto%C4%9Fraf/group-of-multiracial-asian-business-participants-casual-chat-after-successful-conference.jpg?s=612x612&w=0&k=20&c=UIA06kHeAHdKyPRyREEGmmkfyvi0RMyjbldymvolJiY=',
  ];

  // Base Events (backend gelir; yoksa boş kalır)
  baseEvents: EventCard[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private communityService: CommunityService,
    private eventService: EventService
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Toplulukları yükle, ardından etkinlikleri backend'den çek
    this.communityService.getAllCommunities().subscribe({
      next: (communities) => {
        this.allCommunities = communities || [];
        this.loadEventsFromBackend();
      },
      error: () => {
        this.allCommunities = [];
        this.loadEventsFromBackend();
      },
    });
  }

  private loadEventsFromBackend() {
    this.eventService.getAll().subscribe({
      next: (data: EventItem[]) => {
        if (data && data.length) {
          this.baseEvents = data.map((e) => this.mapToCard(e));
          this.attachCommunityNames();
        }
        this.allEventsPool = [...this.baseEvents];
        this.applyFiltersAndLoadFirstPage();
      },
      error: (err) => {
        console.error('Etkinlikler yüklenemedi:', err);
        // fallback mevcut baseEvents mock ile devam
        this.allEventsPool = [...this.baseEvents];
        this.applyFiltersAndLoadFirstPage();
      },
    });
  }

  private attachCommunityNames() {
    if (!this.allCommunities?.length || !this.baseEvents?.length) return;
    this.baseEvents = this.baseEvents.map((ev) => {
      if (!ev.club && (ev as any).communityId) {
        const found = this.allCommunities.find((c) => c.id === (ev as any).communityId);
        return {
          ...ev,
          club: found?.name || ev.club,
          university: found?.university || ev.university,
          city: found?.city || ev.city,
          location: ev.location || this.getVenueByCity(found?.city || ''),
        };
      }
      return ev;
    });
  }

  private mapToCard(e: EventItem): EventCard {
    const start = e.startDate ? new Date(e.startDate) : null;
    const formattedDate = start
      ? start.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    const formattedTime = start
      ? start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      : '';

    return {
      id: e.id,
      title: e.title || '',
      description: e.description || e.shortDescription || '',
      category: 'Etkinlik',
      date: formattedDate,
      dateObj: start || new Date(),
      time: formattedTime,
      university: '',
      club: e.communityName || '',
      semester: '',
      location: e.location || '',
      quota: 0,
      status: 'active',
      imageUrl: e.imageUrl || '',
      color: '#2563eb',
      city: '',
      // backend topluluk id'yi ileride kullanabilmek için taşıyalım
      // @ts-ignore
      communityId: e.communityId,
    } as any;
  }

  getVenueByCity(city: string): string {
    const venues: { [key: string]: string } = {
      Ankara: 'Congresium Ankara',
      İstanbul: 'Zorlu PSM',
      İzmir: 'Ahmed Adnan Saygun Sanat Merkezi',
      Eskişehir: 'Atatürk Kültür Sanat ve Kongre Merkezi',
      Antalya: 'Cam Piramit Kongre Merkezi',
      Adana: 'Çukurova Kongre Merkezi',
      Kayseri: 'Erciyes Kültür Merkezi',
      Trabzon: 'KTÜ Atatürk Kültür Merkezi',
      Bursa: 'Merinos AKKM',
      Konya: 'Selçuklu Kongre Merkezi',
    };
    return venues[city] || 'Merkez Kampüs Etkinlik Alanı';
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('reveal-active');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      this.animItems.forEach((item) => revealObserver.observe(item.nativeElement));
    }
  }

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - 200;
      this.heroMoveX = x / 30;
      this.heroMoveY = y / 30;
    }
  }

  // --- GÜNCELLENEN FİLTRELEME MANTIĞI ---
  getFilteredAndSortedPool(): EventCard[] {
    let filtered =
      this.activeCategory === 'Tümü'
        ? [...this.allEventsPool]
        : this.allEventsPool.filter((e) => e.category === this.activeCategory);

    // Ana Filtre
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === this.currentFilter);
    }

    // Arama (Genişletilmiş)
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.university.toLowerCase().includes(query) ||
          e.club.toLowerCase().includes(query) ||
          (e.location && e.location.toLowerCase().includes(query)) || // Mekan araması
          (e.city && e.city.toLowerCase().includes(query)) // Şehir araması
      );
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (this.sortCriteria === 'date') {
        comparison = a.dateObj.getTime() - b.dateObj.getTime();
      } else if (this.sortCriteria === 'name') {
        comparison = a.title.localeCompare(b.title, 'tr');
      } else if (this.sortCriteria === 'semester') {
        comparison = a.semester.localeCompare(b.semester, 'tr');
      }
      return this.sortAscending ? comparison : -comparison;
    });
  }

  applyFiltersAndLoadFirstPage() {
    this.currentPage = 0;
    this.displayedEvents = [];
    this.hasMoreData = true;
    this.loadMoreEvents();
  }

  loadMoreEvents() {
    if (this.isLoadingMore || !this.hasMoreData) return;

    this.isLoadingMore = true;

    setTimeout(() => {
      const filteredPool = this.getFilteredAndSortedPool();
      const startIndex = this.currentPage * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      const nextBatch = filteredPool.slice(startIndex, endIndex);

      this.displayedEvents = [...this.displayedEvents, ...nextBatch];
      this.currentPage++;
      this.isLoadingMore = false;

      if (this.displayedEvents.length >= filteredPool.length) {
        this.hasMoreData = false;
      }
    }, 600);
  }

  setFilter(filter: 'all' | 'active' | 'upcoming') {
    this.currentFilter = filter;
    this.applyFiltersAndLoadFirstPage();
  }

  setCategory(cat: string) {
    this.activeCategory = cat;
    this.applyFiltersAndLoadFirstPage();
  }

  onSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    this.applyFiltersAndLoadFirstPage();
  }

  changeSortCriteria(criteria: 'date' | 'name' | 'semester') {
    if (this.sortCriteria === criteria) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortCriteria = criteria;
      this.sortAscending = true;
    }
    this.applyFiltersAndLoadFirstPage();
  }

  trackByEventId(index: number, event: EventCard): number {
    return event.id;
  }

  // --- KART EFEKTLERİ ---
  cardTilt(event: MouseEvent, cardElement: HTMLElement) {
    const rect = cardElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
  }

  cardReset(cardElement: HTMLElement) {
    cardElement.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
  }

  // --- MODAL İŞLEMLERİ ---
  openEventDetail(event: EventCard) {
    this.selectedEvent = event;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }
}
