import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngFor, *ngIf, ngClass için
import { RouterModule } from '@angular/router'; // routerLink için

import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';

interface Project {
  id: number;
  title: string;
  category: string;
  date: string;
  description: string;
  image: string;
  status: 'active' | 'upcoming'; // active: Devam Eden, upcoming: Yakında
  location?: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    PageBannerComponent
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  currentFilter: 'all' | 'active' | 'upcoming' = 'all';

<<<<<<< Updated upstream
  // Örnek veriler (görselleri assets/images/events içine eklemeyi unutma)
  projects: Project[] = [
    {
      id: 1,
      title: 'Kampüs Kodluyor Hackathonu',
      category: 'Yazılım & Teknoloji',
      date: '25 Kasım 2025 - 27 Kasım 2025',
      description: '48 saat sürecek maratonda takımlar en iyi dijital çözümü üretmek için yarışıyor.',
      image: 'assets/images/events/event1.jpg',
      status: 'active',
      location: 'İstanbul Kampüs'
    },
    {
      id: 2,
      title: 'Sürdürülebilir Kampüs Zirvesi',
      category: 'Sosyal Sorumluluk',
      date: '10 Aralık 2025',
      description: 'Yeşil bir gelecek için üniversiteler arası işbirliği projeleri konuşuluyor.',
      image: 'assets/images/events/event2.jpg',
      status: 'upcoming',
      location: 'Ankara'
    },
    {
      id: 3,
      title: 'Dijital Girişimcilik Akademisi',
      category: 'Kariyer & Eğitim',
      date: 'Her Cumartesi',
      description: 'Fikrini girişime dönüştürmek isteyenler için 8 haftalık eğitim programı devam ediyor.',
      image: 'assets/images/events/event3.jpg',
      status: 'active',
      location: 'Online'
    },
    {
      id: 4,
      title: 'Yapay Zeka ve Sanat Sergisi',
      category: 'Kültür & Sanat',
      date: 'Ocak 2026',
      description: 'Yapay zeka araçlarıyla üretilen eserlerin sergileneceği büyük buluşma.',
      image: 'assets/images/events/event4.jpg',
      status: 'upcoming',
      location: 'İzmir'
    }
  ];
=======
  // Sıralama
  sortOrder: 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc' = 'date_asc';
  // Removed old sort vars

  // Lightbox
  lightboxOpen: boolean = false;
  selectedImage: string | null = null;

  // Detay Modal
  // selectedEvent removed

  // Sayfalama
  allEventsPool: EventCard[] = [];
  displayedEvents: EventCard[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 0;
  pages: number[] = [];
  allCommunities: any[] = [];
  filteredEventsCount: number = 0; // Added for result count display

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;

  sliderImages: string[] = [
    'https://images.unsplash.com/photo-1544531586-fde5298cdd40?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=800&auto=format&fit=crop',
    'https://media.istockphoto.com/id/1486287149/tr/foto%C4%9Fraf/group-of-multiracial-asian-business-participants-casual-chat-after-successful-conference.jpg?s=612x612&w=0&k=20&c=UIA06kHeAHdKyPRyREEGmmkfyvi0RMyjbldymvolJiY=',
  ];

  // Backend'den gelen veriler
  baseEvents: EventCard[] = [];
>>>>>>> Stashed changes

  constructor() { }

<<<<<<< Updated upstream
  ngOnInit(): void {}
=======
  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Events Page'de sadece aktif toplulukları göster
    this.communityService.getAllCommunities({ status: 'active' }).subscribe({
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
        // Backend'den gelen tüm etkinlikleri map et
        if (data && data.length) {
          const fetchedEvents = data.map((e) => this.mapToCard(e));
          
          // Sadece onaylanan etkinlikleri göster (status === 'Onaylandı')
          // EventService zaten eventConfirm: 1 değerini 'Onaylandı' olarak map ediyor
          const approvedEventsList = fetchedEvents.filter((e) => {
            // EventItem'dan gelen status değerini kontrol et
            const eventItem = data.find((item) => item.id === e.id);
            return eventItem?.status === 'Onaylandı';
          });
          
          // Sadece backend'den gelen ve onaylanan verileri kullan
          this.baseEvents = approvedEventsList;
          this.attachCommunityNames();
        } else {
          // Backend'den veri gelmezse boş array
          this.baseEvents = [];
        }
        this.allEventsPool = [...this.baseEvents];
        this.applyFiltersAndGoFirstPage();
      },
      error: (err) => {
        // Hata durumunda boş array
        this.baseEvents = [];
        this.allEventsPool = [];
        this.applyFiltersAndGoFirstPage();
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
      quota: e.capacity ? parseInt(e.capacity, 10) : 0,
      status: 'active',
      imageUrl: e.imageUrl || '',
      color: '#2563eb',
      city: e.city || '',
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

    // Bugünün tarihini al (sadece tarih, saat olmadan)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    return filtered.sort((a, b) => {
      if (this.sortOrder === 'date_asc') {
        // Yakın-Uzak: Bugüne en yakın tarihten en uzağa
        const diffA = Math.abs(a.dateObj.getTime() - todayTime);
        const diffB = Math.abs(b.dateObj.getTime() - todayTime);
        return diffA - diffB;
      } else if (this.sortOrder === 'date_desc') {
        // Uzak-Yakın: Bugünden en uzak tarihten en yakına
        const diffA = Math.abs(a.dateObj.getTime() - todayTime);
        const diffB = Math.abs(b.dateObj.getTime() - todayTime);
        return diffB - diffA;
      } else if (this.sortOrder === 'name_asc') {
        return a.title.localeCompare(b.title, 'tr');
      } else if (this.sortOrder === 'name_desc') {
        return b.title.localeCompare(a.title, 'tr');
      }
      return 0;
    });
  }

  applyFiltersAndGoFirstPage() {
    this.currentPage = 1;
    this.initPagination();
  }

  initPagination() {
    const filteredPool = this.getFilteredAndSortedPool();
    this.filteredEventsCount = filteredPool.length;
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
>>>>>>> Stashed changes

  setFilter(filter: 'all' | 'active' | 'upcoming') {
    this.currentFilter = filter;
  }

  get filteredProjects(): Project[] {
    if (this.currentFilter === 'all') {
      return this.projects;
    }
    return this.projects.filter(project => project.status === this.currentFilter);
  }
}
