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
          query(':leave', [animate('300ms ease-out', style({ opacity: 0, transform: 'scale(0.95)' }))], { optional: true }),
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
      category: 'Teknoloji',
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
    {
      id: 102,
      title: 'Kampüs Caz Festivali',
      description: 'Sonbaharın renkleri cazın büyüleyici ritimleriyle buluşuyor. Açık hava konserleri ve workshoplar sizi bekliyor.',
      category: 'Müzik',
      date: '15 Kasım 2025',
      dateObj: new Date('2025-11-15'),
      time: '18:30',
      location: 'ODTÜ Vişnelik',
      university: 'Orta Doğu Teknik Üniversitesi',
      club: 'Müzik Topluluğu',
      semester: 'Sanat Topluluğu',
      quota: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop',
      color: '#9333ea',
      status: 'upcoming',
      city: 'Ankara'
    },
    {
      id: 103,
      title: 'Modern Sanat ve Tasarım Bienali',
      description: 'Genç sanatçıların eserlerinin sergileneceği, interaktif enstalasyonların yer aldığı sanat dolu bir hafta.',
      category: 'Sanat',
      date: '01 Aralık 2025',
      dateObj: new Date('2025-12-01'),
      time: '09:00',
      location: 'Mimar Sinan GSÜ',
      university: 'Mimar Sinan Güzel Sanatlar Üniversitesi',
      club: 'Güzel Sanatlar Kulübü',
      semester: 'Kültür Topluluğu',
      quota: 300,
      imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3969105?q=80&w=800&auto=format&fit=crop',
      color: '#db2777',
      status: 'upcoming',
      city: 'İstanbul'
    },
    {
      id: 104,
      title: 'Kariyer ve Networking Günleri',
      description: 'Türkiye\'nin önde gelen firmalarının İK yöneticileri ile birebir görüşme şansı. Staj ve iş imkanlarını kaçırmayın.',
      category: 'Kariyer',
      date: '20 Eylül 2025',
      dateObj: new Date('2025-09-20'),
      time: '11:00',
      location: 'YTÜ Davutpaşa Kampüsü',
      university: 'Yıldız Teknik Üniversitesi',
      club: 'İşletme Kulübü',
      semester: 'Kariyer Topluluğu',
      quota: 800,
      imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop',
      color: '#ea580c',
      status: 'active',
      city: 'İstanbul'
    },
    {
      id: 105,
      title: 'Doğa Yürüyüşü ve Kamp',
      description: 'Şehrin gürültüsünden uzaklaşıp doğayla iç içe bir hafta sonu. Çadırını kap gel!',
      category: 'Spor',
      date: '05 Ekim 2025',
      dateObj: new Date('2025-10-05'),
      time: '07:00',
      location: 'Uludağ Milli Parkı',
      university: 'Bursa Uludağ Üniversitesi',
      club: 'Doğa Sporları Kulübü',
      semester: 'Spor Topluluğu',
      quota: 100,
      imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop',
      color: '#16a34a',
      status: 'upcoming',
      city: 'Bursa'
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
        // Backend'den veri gelirse mock'un üzerine ekleyelim veya değiştirelim
        if (data && data.length) {
          const fetchedEvents = data.map((e) => this.mapToCard(e));
          // Mock data + Backend data birleşimi (Mock data en başta görünsün)
          this.baseEvents = [...this.baseEvents, ...fetchedEvents];
          this.attachCommunityNames();
        }
        this.allEventsPool = [...this.baseEvents];
        this.applyFiltersAndLoadFirstPage();
      },
      error: (err) => {
        console.error('Etkinlikler yüklenemedi, mock data kullanılıyor:', err);
        // Hata durumunda sadece Mock Data göster
        this.allEventsPool = [...this.baseEvents];
        this.applyFiltersAndLoadFirstPage();
      },
    });
  }

  private attachCommunityNames() {
    if (!this.allCommunities?.length || !this.baseEvents?.length) return;
    this.baseEvents = this.baseEvents.map((ev) => {
      // Sadece ID'si olanlar için isim eşleştir (Mock dataların ID'si communityId ile çakışmaz)
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

  // --- KART BEND EFEKTLERİ ---
  cardTilt(event: MouseEvent, cardElement: HTMLElement) {
    const rect = cardElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Değerleri biraz artırdım ki "bend effect" daha belirgin olsun
    const rotateX = ((y - centerY) / centerY) * -10; 
    const rotateY = ((x - centerX) / centerX) * 10;

    cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }

  cardReset(cardElement: HTMLElement) {
    // Mouse ayrılınca sıfırla
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