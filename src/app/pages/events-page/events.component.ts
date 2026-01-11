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

import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { CommunityService } from '../../services/community.services';
import { EventService, EventItem } from '../../services/event.services';

// EventCard arayüzü
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
  semester: string;
  quota: number;
  imageUrl: string;
  color: string;
  status: 'active' | 'upcoming';
  city?: string;
  communityId?: number; // Eklendi: mapToCard fonksiyonunda kullanılıyor
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        group([
          query(':enter', [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('40ms', [
              animate('400ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'none' })),
            ]),
          ], { optional: true }),
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
  categories: string[] = [
    'Tümü',
    'Afet Yönetimi ve Dayanıklılık',
    'Aile ve Değerler',
    'Bilim ve Teknoloji',
    'Çevre ve İklim',
    'Eğitim ve Hayat Boyu Öğrenme',
    'Gençlik Bilgilendirmesi',
    'Gençlik Sağlığı ve Spor',
    'Gönüllülük, Gençlik Katılımı ve Sivil Toplum',
    'İstihdam ve Girişimcilik',
    'Sosyal Kapsayıcılık',
    'Uluslararası Gençlik Çalışmaları'
  ];
  searchQuery: string = '';
  currentFilter: 'all' | 'active' | 'upcoming' = 'all';

  // Sıralama
  sortCriteria: 'date' | 'name' | 'semester' = 'date';
  sortAscending: boolean = true;

  // Sayfalama
  allEventsPool: EventCard[] = [];
  displayedEvents: EventCard[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 0;
  pages: number[] = [];
  allCommunities: any[] = [];

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;

  sliderImages: string[] = [
    'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop',
    'https://media.istockphoto.com/id/1486287149/tr/foto%C4%9Fraf/group-of-multiracial-asian-business-participants-casual-chat-after-successful-conference.jpg?s=612x612&w=0&k=20&c=UIA06kHeAHdKyPRyREEGmmkfyvi0RMyjbldymvolJiY=',
  ];

  // Servis gelmezse gösterilecek MOCK DATA
  baseEvents: EventCard[] = [
    {
      id: 101,
      title: 'Geleceğin Teknolojileri ve Yapay Zeka Zirvesi',
      description: 'Yapay zeka, blok zincir ve geleceğin teknolojilerinin tartışılacağı dev bir zirveye hazır olun. Sektörün öncüleri ile tanışma fırsatı.',
      category: 'Bilim ve Teknoloji',
      date: '25 Ekim 2025',
      dateObj: new Date('2025-10-25'),
      time: '10:00',
      location: 'İTÜ Süleyman Demirel Kültür Merkezi',
      university: 'İstanbul Teknik Üniversitesi',
      club: 'Yapay Zeka Kulübü',
      semester: 'Teknoloji Topluluğu',
      quota: 500,
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop',
      color: '#2563eb',
      status: 'upcoming',
      city: 'İstanbul'
    },
    // ... (Diğer mock datalar buraya gelecek) ...
    {
      id: 120,
      title: 'Kapadokya Turu',
      description: 'Peribacaları ve balon turu ile eşsiz bir hafta sonu gezisi.',
      category: 'Uluslararası Gençlik Çalışmaları',
      date: '20 Nisan 2026',
      dateObj: new Date('2026-04-20'),
      time: '06:00',
      location: 'Kampüs Ana Kapı',
      university: 'Nevşehir Hacı Bektaş Veli Üniversitesi',
      club: 'Gezi ve Kamp Kulübü',
      semester: 'Kültür Topluluğu',
      quota: 50,
      imageUrl: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?q=80&w=800&auto=format&fit=crop',
      color: '#0891b2',
      status: 'upcoming',
      city: 'Nevşehir'
    }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private communityService: CommunityService,
    private eventService: EventService
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

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
          const fetchedEvents = data.map((e) => this.mapToCard(e));
          this.baseEvents = [...this.baseEvents, ...fetchedEvents];
          this.attachCommunityNames();
        }
        this.allEventsPool = [...this.baseEvents];
        this.applyFiltersAndGoFirstPage();
      },
      error: (err) => {
        console.error('Etkinlikler yüklenemedi, mock data kullanılıyor:', err);
        this.allEventsPool = [...this.baseEvents];
        this.applyFiltersAndGoFirstPage();
      },
    });
  }

  private attachCommunityNames() {
    if (!this.allCommunities?.length || !this.baseEvents?.length) return;
    this.baseEvents = this.baseEvents.map((ev) => {
      if (!ev.club && ev.communityId) {
        const found = this.allCommunities.find((c) => c.id === ev.communityId);
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
      communityId: e.communityId,
    } as EventCard;
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

  // EKSİK OLAN FONKSİYON DOLDURULDU
  getUniversityAbbreviation(universityName: string): string {
    const abbreviations: { [key: string]: string } = {
      'Yıldız Teknik Üniversitesi': 'YTÜ',
      'İstanbul Teknik Üniversitesi': 'İTÜ',
      'Orta Doğu Teknik Üniversitesi': 'ODTÜ',
      'Boğaziçi Üniversitesi': 'BOUN',
      'Mimar Sinan Güzel Sanatlar Üniversitesi': 'MSGSÜ',
      'İstanbul Üniversitesi': 'İÜ',
      'Marmara Üniversitesi': 'MÜ',
      'Ege Üniversitesi': 'EÜ',
      'Dokuz Eylül Üniversitesi': 'DEÜ',
      'Hacettepe Üniversitesi': 'Hacettepe',
      'Bilkent Üniversitesi': 'Bilkent',
      'Koç Üniversitesi': 'Koç',
      'Sabancı Üniversitesi': 'Sabancı',
      'Galatasaray Üniversitesi': 'GSÜ',
      'Gebze Teknik Üniversitesi': 'GTÜ',
      'İzmir Yüksek Teknoloji Enstitüsü': 'İYTE',
      'Bursa Uludağ Üniversitesi': 'Uludağ',
      'Anadolu Üniversitesi': 'Anadolu',
      'Kocaeli Üniversitesi': 'KOÜ',
      'Nevşehir Hacı Bektaş Veli Üniversitesi': 'NEVÜ',
      'Bahçeşehir Üniversitesi': 'BAU',
    };
    return abbreviations[universityName] || universityName;
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

  // --- FİLTRELEME MANTIĞI ---
  getFilteredAndSortedPool(): EventCard[] {
    let filtered =
      this.activeCategory === 'Tümü'
        ? [...this.allEventsPool]
        : this.allEventsPool.filter((e) => e.category === this.activeCategory);

    if (this.currentFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === this.currentFilter);
    }

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.university.toLowerCase().includes(query) ||
          e.club.toLowerCase().includes(query) ||
          (e.location && e.location.toLowerCase().includes(query)) ||
          (e.city && e.city.toLowerCase().includes(query))
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

  applyFiltersAndGoFirstPage() {
    this.currentPage = 1;
    this.initPagination();
  }

  initPagination() {
    const filteredPool = this.getFilteredAndSortedPool();
    this.totalPages = Math.ceil(filteredPool.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const filteredPool = this.getFilteredAndSortedPool();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedEvents = filteredPool.slice(startIndex, endIndex);
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

  setFilter(filter: 'all' | 'active' | 'upcoming') {
    this.currentFilter = filter;
    this.applyFiltersAndGoFirstPage();
  }

  setCategory(cat: string) {
    this.activeCategory = cat;
    this.applyFiltersAndGoFirstPage();
  }

  onSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    this.applyFiltersAndGoFirstPage();
  }

  changeSortCriteria(criteria: 'date' | 'name' | 'semester') {
    if (this.sortCriteria === criteria) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortCriteria = criteria;
      this.sortAscending = true;
    }
    this.applyFiltersAndGoFirstPage();
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
    
    const rotateX = ((y - centerY) / centerY) * -10; 
    const rotateY = ((x - centerX) / centerX) * 10;

    cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }

  cardReset(cardElement: HTMLElement) {
    cardElement.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
  }

  openEventDetail(event: EventCard) {
    this.router.navigate(['/events', event.id]);
  }
}