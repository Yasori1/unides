import {
  Component,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  OnInit,
  HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { CommunityService } from '../../services/community.services';
import { EventService, EventItem } from '../../services/event.services';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';
import { CITY_NAMES } from '../../data/cities';

interface EventCard {
  id: number;
  title: string;
  description: string;
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
})
export class EventsComponent implements OnInit, AfterViewInit {
  // Hero Animasyonu
  heroMoveX: number = 0;
  heroMoveY: number = 0;

  // Filtreleme
  searchQuery: string = '';
  currentFilter: 'all' | 'active' | 'upcoming' = 'all';

  // Sıralama
  sortOrder: 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc' = 'date_asc';

  // Şehir filtresi
  cities: string[] = CITY_NAMES;
  /** Açılır listede şehir arama (Türkçe karakter uyumlu) */
  cityFilterSearch: string = '';
  selectedCityFilter: string = '';

  get filteredCities(): string[] {
    const q = this.cityFilterSearch.trim().toLocaleLowerCase('tr-TR');
    if (!q) {
      return this.cities;
    }
    return this.cities.filter((city) => city.toLocaleLowerCase('tr-TR').includes(q));
  }

  /** Kapalıyken yalnızca şu andan sonraki etkinlikler (Türkiye saatiyle anlık başlangıç). Açıkken geçmişler de listelenir. */
  showPastEvents: boolean = false;

  // Custom Dropdown States
  isSortDropdownOpen: boolean = false;
  isCityDropdownOpen: boolean = false;
  // Removed old sort vars

  // Lightbox
  lightboxOpen: boolean = false;
  selectedImage: string | null = null;

  // Detay Modal
  // selectedEvent removed

  // Yükleme (ilk açılışta spinner - Duyurular sayfası gibi)
  isLoading: boolean = true;

  // Sayfalama
  allEventsPool: EventCard[] = [];
  displayedEvents: EventCard[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 0;
  pages: number[] = [];
  allCommunities: any[] = [];
  filteredEventsCount: number = 0; // Added for result count display

  /**
   * Tarih sıralamasında (ve isim sıralamasında geçmiş gizliyken) API sayfa başına kronolojik
   * sıra verdiği için tüm kayıtlar çekilip İstanbul (UTC+3) mantığıyla sıralanıp sayfalanır.
   */
  private dateSortedEventsCache: EventCard[] | null = null;
  private readonly maxEventsFetchForClientDateSort = 5000;

  /** Backend yorumu: tarih sırası “bugüne göre”; gerçekte yalnızca takvim sırası. İstemci tarafında TR (UTC+3) ile hizalanır. */
  private readonly istanbulTz = 'Europe/Istanbul';

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
      date: '25 Ekim 2025',
      dateObj: new Date('2025-10-25'),
      time: '10:00',
      location: 'İTÜ Süleyman Demirel Kültür Merkezi',
      university: 'İstanbul Teknik Üniversitesi',
      club: 'Yapay Zeka Kulübü',
      semester: 'Teknoloji Topluluğu',
      quota: 500,
      imageUrl: 'assets/etkinlik.jpg',
      color: '#2563eb',
      status: 'upcoming',
      city: 'İstanbul'
    },
    {
      id: 102,
      title: 'Kampüs Caz Festivali',
      description: 'Sonbaharın renkleri cazın büyüleyici ritimleriyle buluşuyor. Açık hava konserleri ve workshoplar sizi bekliyor.',
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
      date: '01 Aralık 2025',
      dateObj: new Date('2025-12-01'),
      time: '09:00',
      location: 'Mimar Sinan GSÜ',
      university: 'Mimar Sinan Güzel Sanatlar Üniversitesi',
      club: 'Güzel Sanatlar Kulübü',
      semester: 'Kültür Topluluğu',
      quota: 300,
      imageUrl:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFBbo43qexwVoJjVSXp85WZuIEqVlu-_j0Yw&s',
      color: '#db2777',
      status: 'upcoming',
      city: 'İstanbul'
    },
    {
      id: 104,
      title: 'Kariyer ve Networking Günleri',
      description: 'Türkiye\'nin önde gelen firmalarının İK yöneticileri ile birebir görüşme şansı. Staj ve iş imkanlarını kaçırmayın.',
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
    },
    {
      id: 106,
      title: 'Siber Güvenlik Bootcamp',
      description: 'Uygulamalı laboratuvarlarla siber güvenliğin temellerini öğren. CTF mini yarışması da var.',
      date: '10 Ocak 2026',
      dateObj: new Date('2026-01-10'),
      time: '13:00',
      location: 'Teknopark Eğitim Salonu',
      university: 'İstanbul Teknik Üniversitesi',
      club: 'Siber Güvenlik Kulübü',
      semester: 'Teknoloji Topluluğu',
      quota: 200,
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
      color: '#2563eb',
      status: 'upcoming',
      city: 'İstanbul'
    },
    {
      id: 107,
      title: 'Fotoğrafçılık Şehir Turu',
      description: 'Şehir turunda sokak fotoğrafçılığı teknikleri, kompozisyon ve ışık kullanımı üzerine pratik.',
      date: '18 Ocak 2026',
      dateObj: new Date('2026-01-18'),
      time: '09:30',
      location: 'Merkez Kampüs Buluşma Noktası',
      university: 'Marmara Üniversitesi',
      club: 'Fotoğrafçılık Kulübü',
      semester: 'Kültür Topluluğu',
      quota: 80,
      imageUrl: 'https://images.unsplash.com/photo-1552168324-d612d77725e3?q=80&w=800&auto=format&fit=crop',
      color: '#db2777',
      status: 'upcoming',
      city: 'İstanbul'
    },
    {
      id: 108,
      title: 'Kariyer CV Atölyesi',
      description: 'CV ve LinkedIn profilini güçlendirmek için uygulamalı atölye. Örnek mülakat simülasyonu da yapılacak.',
      date: '28 Ocak 2026',
      dateObj: new Date('2026-01-28'),
      time: '16:00',
      location: 'Konferans Salonu',
      university: 'Orta Doğu Teknik Üniversitesi',
      club: 'Kariyer Kulübü',
      semester: 'Kariyer Topluluğu',
      quota: 300,
      imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop',
      color: '#ea580c',
      status: 'upcoming',
      city: 'Ankara'
    },
    {
      id: 109,
      title: 'Veri Bilimi ve R Atölyesi',
      description: 'Veri analizine giriş yapmak isteyenler için kapsamlı bir atölye. R dili ile uygulama yapılacak.',
      date: '05 Şubat 2026',
      dateObj: new Date('2026-02-05'),
      time: '14:00',
      location: 'Bilkent Kütüphane',
      university: 'Bilkent Üniversitesi',
      club: 'Veri Bilimi Topluluğu',
      semester: 'Teknoloji Topluluğu',
      quota: 50,
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
      color: '#2563eb',
      status: 'upcoming',
      city: 'Ankara'
    },
    {
      id: 110,
      title: 'Klasik Müzik Akşamı',
      description: 'Üniversite orkestrasından unutulmaz bir klasik müzik dinletisi.',
      date: '12 Şubat 2026',
      dateObj: new Date('2026-02-12'),
      time: '19:30',
      location: 'AKM Büyük Salon',
      university: 'İstanbul Üniversitesi',
      club: 'Müzik Kulübü',
      semester: 'Sanat Topluluğu',
      quota: 400,
      imageUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384ebd?q=80&w=800&auto=format&fit=crop',
      color: '#9333ea',
      status: 'upcoming',
      city: 'İstanbul'
    },
    {
      id: 111,
      title: 'Modern Dans Gösterisi',
      description: 'Dans topluluğunun hazırladığı modern dans koreografileri sahneleniyor.',
      date: '20 Şubat 2026',
      dateObj: new Date('2026-02-20'),
      time: '18:00',
      location: 'Ege Üniversitesi Kültür Merkezi',
      university: 'Ege Üniversitesi',
      club: 'Dans Topluluğu',
      semester: 'Sanat Topluluğu',
      quota: 350,
      imageUrl: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?q=80&w=800&auto=format&fit=crop',
      color: '#db2777',
      status: 'upcoming',
      city: 'İzmir'
    },
    {
      id: 112,
      title: 'Startup Pitching Day',
      description: 'Girişim fikirlerini yatırımcılara sunmak isteyen öğrenciler için büyük fırsat.',
      date: '25 Şubat 2026',
      dateObj: new Date('2026-02-25'),
      time: '10:00',
      location: 'Kolektif House',
      university: 'Boğaziçi Üniversitesi',
      club: 'Girişimcilik Kulübü',
      semester: 'Kariyer Topluluğu',
      quota: 150,
      imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop',
      color: '#ea580c',
      status: 'upcoming',
      city: 'İstanbul'
    },
    {
      id: 113,
      title: 'Kampüs Koşusu',
      description: 'Sağlıklı yaşam için kampüste 5K koşusu düzenliyoruz. Herkes davetli!',
      date: '01 Mart 2026',
      dateObj: new Date('2026-03-01'),
      time: '08:00',
      location: 'Anadolu Üniversitesi Stadyumu',
      university: 'Anadolu Üniversitesi',
      club: 'Spor Kulübü',
      semester: 'Spor Topluluğu',
      quota: 1000,
      imageUrl: 'https://images.unsplash.com/photo-1552674605-469523cc7043?q=80&w=800&auto=format&fit=crop',
      color: '#16a34a',
      status: 'upcoming',
      city: 'Eskişehir'
    },
    {
      id: 114,
      title: 'Ege Köyleri Gezisi',
      description: 'Ege\'nin saklı kalmış köylerini keşfetmeye gidiyoruz. Fotoğraf makinenizi unutmayın.',
      date: '10 Mart 2026',
      dateObj: new Date('2026-03-10'),
      time: '07:30',
      location: 'Bornova Metro Hareket',
      university: 'Dokuz Eylül Üniversitesi',
      club: 'Gezi Kulübü',
      semester: 'Kültür Topluluğu',
      quota: 45,
      imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
      color: '#0891b2',
      status: 'upcoming',
      city: 'İzmir'
    },
    {
      id: 115,
      title: 'Blockchain 101',
      description: 'Blokzincir teknolojisinin temelleri ve kripto varlıklar üzerine seminer.',
      date: '15 Mart 2026',
      dateObj: new Date('2026-03-15'),
      time: '13:00',
      location: 'Bahçeşehir Üniversitesi Güney Kampüs',
      university: 'Bahçeşehir Üniversitesi',
      club: 'Blockchain Kulübü',
      semester: 'Teknoloji Topluluğu',
      quota: 200,
      imageUrl: 'https://images.unsplash.com/photo-1621504450168-b8c4375c2b80?q=80&w=800&auto=format&fit=crop',
      color: '#2563eb',
      status: 'upcoming',
      city: 'İstanbul'
    },
    {
      id: 116,
      title: 'Rock Festivali',
      description: 'Amatör ve profesyonel rock gruplarının sahne alacağı müzik şöleni.',
      date: '22 Mart 2026',
      dateObj: new Date('2026-03-22'),
      time: '15:00',
      location: 'Hacettepe Beytepe Kampüsü',
      university: 'Hacettepe Üniversitesi',
      club: 'Rock Topluluğu',
      semester: 'Sanat Topluluğu',
      quota: 1500,
      imageUrl: 'https://images.unsplash.com/photo-1459749411177-0473ef7161a8?q=80&w=800&auto=format&fit=crop',
      color: '#9333ea',
      status: 'upcoming',
      city: 'Ankara'
    },
    {
      id: 117,
      title: 'Seramik Atölyesi',
      description: 'Kendi seramik kupanı tasarla ve üret. Malzemeler bizden!',
      date: '28 Mart 2026',
      dateObj: new Date('2026-03-28'),
      time: '11:00',
      location: 'Uludağ Üniversitesi Atölyeler',
      university: 'Bursa Uludağ Üniversitesi',
      club: 'El Sanatları Kulübü',
      semester: 'Sanat Topluluğu',
      quota: 20,
      imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=800&auto=format&fit=crop',
      color: '#db2777',
      status: 'upcoming',
      city: 'Bursa'
    },
    {
      id: 118,
      title: 'Staj Fuarı 2026',
      description: 'Yaz dönemi stajı için firmalarla buluşma noktası.',
      date: '05 Nisan 2026',
      dateObj: new Date('2026-04-05'),
      time: '10:00',
      location: 'Kocaeli Üniversitesi Kongre Merkezi',
      university: 'Kocaeli Üniversitesi',
      club: 'Kariyer Merkezi',
      semester: 'Kariyer Topluluğu',
      quota: 600,
      imageUrl: 'https://images.unsplash.com/photo-1558222218-b7b54eede3f3?q=80&w=800&auto=format&fit=crop',
      color: '#ea580c',
      status: 'upcoming',
      city: 'Kocaeli'
    },
    {
      id: 119,
      title: 'Voleybol Turnuvası',
      description: 'Fakülteler arası voleybol turnuvası final maçı.',
      date: '12 Nisan 2026',
      dateObj: new Date('2026-04-12'),
      time: '17:00',
      location: 'Burhan Felek Spor Salonu',
      university: 'Marmara Üniversitesi',
      club: 'Spor Birliği',
      semester: 'Spor Topluluğu',
      quota: 800,
      imageUrl: 'https://images.unsplash.com/photo-1612872087720-48ca556cd852?q=80&w=800&auto=format&fit=crop',
      color: '#16a34a',
      status: 'upcoming',
      city: 'İstanbul'
    },
    {
      id: 120,
      title: 'Kapadokya Turu',
      description: 'Peribacaları ve balon turu ile eşsiz bir hafta sonu gezisi.',
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
    private eventService: EventService,
    private imageErrorHandler: ImageErrorHandlerService
  ) { }

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

  private isClientSideDateSort(): boolean {
    return this.sortOrder === 'date_asc' || this.sortOrder === 'date_desc';
  }

  /** Tarih sıralaması veya isim sıralamasında geçmişleri gizlerken tam liste + istemci sayfalama gerekir. */
  private useClientSideListForCurrentSort(): boolean {
    if (this.isClientSideDateSort()) return true;
    if (!this.showPastEvents && (this.sortOrder === 'name_asc' || this.sortOrder === 'name_desc')) {
      return true;
    }
    return false;
  }

  /**
   * İstanbul takvim gününün başlangıcı (TR sabit UTC+3, yaz saati yok).
   * Yakın/Uzak bölünmesi backend’deki “bugüne göre” ifadesiyle uyum için kullanılır.
   */
  private startOfTodayIstanbulMs(ref: Date = new Date()): number {
    const ymd = ref.toLocaleDateString('en-CA', { timeZone: this.istanbulTz });
    const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
    return Date.UTC(y, m - 1, d, 0, 0, 0) - 3 * 60 * 60 * 1000;
  }

  private filterByPastVisibility(cards: EventCard[]): EventCard[] {
    if (this.showPastEvents) return cards;
    const now = Date.now();
    return cards.filter((e) => e.dateObj.getTime() >= now);
  }

  /**
   * Geçmiş kapalıyken liste zaten yalnızca gelecek içerir; sadece tarih sıralanır.
   * Geçmiş açıkken: Yakın–Uzak — önce İstanbul’daki bugün ve sonrası (artan), sonra geçmiş (en yakın geçmiş üstte).
   * Uzak–Yakın — tümü takvimde yeniden eskiye.
   */
  private sortEventsForDateMode(cards: EventCard[]): EventCard[] {
    const copy = [...cards];

    if (!this.showPastEvents) {
      if (this.sortOrder === 'date_asc') {
        return copy.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      }
      if (this.sortOrder === 'date_desc') {
        return copy.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
      }
      return copy;
    }

    const t0 = this.startOfTodayIstanbulMs();

    if (this.sortOrder === 'date_asc') {
      const future = copy
        .filter((e) => e.dateObj.getTime() >= t0)
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      const past = copy
        .filter((e) => e.dateObj.getTime() < t0)
        .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
      return [...future, ...past];
    }
    if (this.sortOrder === 'date_desc') {
      return copy.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    }
    return copy;
  }

  private applyCommunityNamesToEvents(list: EventCard[]): EventCard[] {
    if (!this.allCommunities?.length || !list?.length) return list;
    return list.map((ev) => {
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

  private loadEventsFromBackend(page?: number) {
    const requestedPage = page ?? this.currentPage ?? 1;

    if (this.useClientSideListForCurrentSort()) {
      this.isLoading = true;
      const filters: { search?: string; city?: string; sortBy?: 'name' | 'date'; sortOrder?: 'asc' | 'desc' } = {};
      const rawSearch = this.searchQuery?.trim();
      if (rawSearch) {
        filters.search = rawSearch.toLocaleUpperCase('tr-TR');
      }
      const city = this.selectedCityFilter?.trim();
      if (city) {
        filters.city = city;
      }
      if (this.isClientSideDateSort()) {
        filters.sortBy = 'name';
        filters.sortOrder = 'asc';
      } else if (this.sortOrder === 'name_asc') {
        filters.sortBy = 'name';
        filters.sortOrder = 'asc';
      } else {
        filters.sortBy = 'name';
        filters.sortOrder = 'desc';
      }

      this.eventService.getEventsPage(1, this.maxEventsFetchForClientDateSort, filters).subscribe({
        next: (res) => {
          const data = res.items || [];
          let cards = data.map((e) => this.mapToCard(e));
          cards = cards.filter((e) => {
            const eventItem = data.find((item) => item.id === e.id);
            return eventItem?.status === 'Onaylandı';
          });
          cards = this.applyCommunityNamesToEvents(cards);
          cards = this.filterByPastVisibility(cards);
          if (this.isClientSideDateSort()) {
            cards = this.sortEventsForDateMode(cards);
          }
          this.dateSortedEventsCache = cards;

          const total = cards.length;
          this.filteredEventsCount = total;
          this.totalPages = Math.max(1, Math.ceil(total / this.itemsPerPage) || 1);
          const safePage = Math.min(Math.max(1, requestedPage), this.totalPages);
          this.currentPage = safePage;
          this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

          const start = (safePage - 1) * this.itemsPerPage;
          this.baseEvents = cards.slice(start, start + this.itemsPerPage);
          this.displayedEvents = [...this.baseEvents];
          this.isLoading = false;
        },
        error: () => {
          this.baseEvents = [];
          this.displayedEvents = [];
          this.dateSortedEventsCache = null;
          this.currentPage = 1;
          this.totalPages = 0;
          this.pages = [];
          this.filteredEventsCount = 0;
          this.isLoading = false;
        },
      });
      return;
    }

    this.dateSortedEventsCache = null;
    const filters: { search?: string; city?: string; sortBy?: 'name' | 'date'; sortOrder?: 'asc' | 'desc' } = {};
    const rawSearch = this.searchQuery?.trim();
    if (rawSearch) {
      filters.search = rawSearch.toLocaleUpperCase('tr-TR');
    }
    const city = this.selectedCityFilter?.trim();
    if (city) {
      filters.city = city;
    }
    if (this.sortOrder === 'name_asc') {
      filters.sortBy = 'name';
      filters.sortOrder = 'asc';
    } else if (this.sortOrder === 'name_desc') {
      filters.sortBy = 'name';
      filters.sortOrder = 'desc';
    }

    this.eventService.getEventsPage(requestedPage, this.itemsPerPage, filters).subscribe({
      next: (res) => {
        const data = res.items || [];
        const fetchedEvents = data.map((e) => this.mapToCard(e));
        const approvedEventsList = fetchedEvents.filter((e) => {
          const eventItem = data.find((item) => item.id === e.id);
          return eventItem?.status === 'Onaylandı';
        });
        this.baseEvents = approvedEventsList;
        this.baseEvents = this.applyCommunityNamesToEvents(this.baseEvents);
        this.displayedEvents = [...this.baseEvents];
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.filteredEventsCount = res.totalCount ?? 0;
        this.isLoading = false;
      },
      error: () => {
        this.baseEvents = [];
        this.displayedEvents = [];
        this.currentPage = 1;
        this.totalPages = 0;
        this.pages = [];
        this.filteredEventsCount = 0;
        this.isLoading = false;
      },
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
      date: formattedDate,
      dateObj: start || new Date(),
      time: formattedTime,
      university: e.university || '',
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
    let filtered = [...this.allEventsPool];

    if (this.currentFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === this.currentFilter);
    }

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.trim().toLocaleLowerCase('tr-TR');
      filtered = filtered.filter(
        (e) =>
          (e.title || '').toLocaleLowerCase('tr-TR').includes(query) ||
          (e.university || '').toLocaleLowerCase('tr-TR').includes(query) ||
          (e.club || '').toLocaleLowerCase('tr-TR').includes(query) ||
          (e.location && e.location.toLocaleLowerCase('tr-TR').includes(query)) ||
          (e.city && e.city.toLocaleLowerCase('tr-TR').includes(query))
      );
    }

    const anchor = this.startOfTodayIstanbulMs();

    return filtered.sort((a, b) => {
      if (this.sortOrder === 'date_asc') {
        const diffA = Math.abs(a.dateObj.getTime() - anchor);
        const diffB = Math.abs(b.dateObj.getTime() - anchor);
        return diffA - diffB;
      } else if (this.sortOrder === 'date_desc') {
        const diffA = Math.abs(a.dateObj.getTime() - anchor);
        const diffB = Math.abs(b.dateObj.getTime() - anchor);
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
    this.loadEventsFromBackend(1);
  }

  onCityFilterChange(city: string) {
    this.selectedCityFilter = city;
    this.applyFiltersAndGoFirstPage();
  }

  initPagination() {
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;

    if (this.useClientSideListForCurrentSort() && this.dateSortedEventsCache?.length) {
      this.currentPage = page;
      const start = (page - 1) * this.itemsPerPage;
      const cards = this.dateSortedEventsCache;
      this.baseEvents = cards.slice(start, start + this.itemsPerPage);
      this.displayedEvents = [...this.baseEvents];
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    this.loadEventsFromBackend(page);
  }

  getVisiblePages(): number[] {
    if (this.totalPages <= 0) return [];
    const maxVisible = 5;
    const start = Math.max(1, Math.min(this.currentPage, this.totalPages - maxVisible + 1));
    const end = Math.min(this.totalPages, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  setFilter(filter: 'all' | 'active' | 'upcoming') {
    this.currentFilter = filter;
    this.applyFiltersAndGoFirstPage();
  }

  onSearch(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    this.applyFiltersAndGoFirstPage();
  }

  // --- CUSTOM DROPDOWN MANTIĞI ---
  toggleCityDropdown(event: Event) {
    event.stopPropagation();
    this.isCityDropdownOpen = !this.isCityDropdownOpen;
    if (this.isCityDropdownOpen) this.isSortDropdownOpen = false;
  }

  toggleSortDropdown(event: Event) {
    event.stopPropagation();
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
    if (this.isSortDropdownOpen) this.isCityDropdownOpen = false;
  }

  // Image error handler - Placeholder görsellerin sürekli istek atmasını engeller
  onImageError(event: Event): void {
    this.imageErrorHandler.handleImageError(event, 'event');
  }

  selectSort(order: 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc') {
    this.sortOrder = order;
    this.applyFiltersAndGoFirstPage();
    this.isSortDropdownOpen = false;
  }

  selectCity(city: string) {
    this.cityFilterSearch = '';
    this.onCityFilterChange(city);
    this.isCityDropdownOpen = false;
  }

  getSortLabel(order: string): string {
    switch (order) {
      case 'date_asc': return 'Tarih (Yakın-Uzak)';
      case 'date_desc': return 'Tarih (Uzak-Yakın)';
      case 'name_asc': return 'İsim (A-Z)';
      case 'name_desc': return 'İsim (Z-A)';
      default: return 'Gelişmiş Sıralama';
    }
  }

  getCityLabel(city: string): string {
    const value = (city || '').trim();
    return value ? value : 'Tüm Şehirler';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.isSortDropdownOpen = false;
    this.isCityDropdownOpen = false;
  }

  // Old changeSortCriteria removed

  trackByEventId(index: number, event: EventCard): number {
    return event.id;
  }

  // --- MODAL İŞLEMLERİ YERİNE DETAY SAYFASINA GİT ---
  openEventDetail(event: EventCard) {
    this.router.navigate(['/events', event.id]);
  }

  // --- LIGHTBOX İŞLEMLERİ ---
  openLightbox(imageUrl: string) {
    this.selectedImage = imageUrl;
    this.lightboxOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeLightbox() {
    this.lightboxOpen = false;
    this.selectedImage = null;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }
}