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
          // REMOVED :leave animation to prevent items from fading out when navigating away
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
  sortOrder: 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc' = 'date_asc';
  // Removed old sort vars

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
    {
      id: 102,
      title: 'Kampüs Caz Festivali',
      description: 'Sonbaharın renkleri cazın büyüleyici ritimleriyle buluşuyor. Açık hava konserleri ve workshoplar sizi bekliyor.',
      category: 'Eğitim ve Hayat Boyu Öğrenme',
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
      category: 'Aile ve Değerler',
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
      category: 'İstihdam ve Girişimcilik',
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
      category: 'Gençlik Sağlığı ve Spor',
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
      category: 'Bilim ve Teknoloji',
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
      category: 'Aile ve Değerler',
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
      category: 'İstihdam ve Girişimcilik',
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
      category: 'Bilim ve Teknoloji',
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
      category: 'Eğitim ve Hayat Boyu Öğrenme',
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
      category: 'Aile ve Değerler',
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
      category: 'İstihdam ve Girişimcilik',
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
      category: 'Gençlik Sağlığı ve Spor',
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
      category: 'Uluslararası Gençlik Çalışmaları',
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
      category: 'Bilim ve Teknoloji',
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
      category: 'Eğitim ve Hayat Boyu Öğrenme',
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
      category: 'Aile ve Değerler',
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
      category: 'İstihdam ve Girişimcilik',
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
      category: 'Gençlik Sağlığı ve Spor',
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
        // Backend'den veri gelirse mock'un üzerine ekleyelim veya değiştirelim
        if (data && data.length) {
          const fetchedEvents = data.map((e) => this.mapToCard(e));
          // Mock data + Backend data birleşimi (Mock data en başta görünsün)
          this.baseEvents = [...this.baseEvents, ...fetchedEvents];
          this.attachCommunityNames();
        }
        this.allEventsPool = [...this.baseEvents];
        this.applyFiltersAndGoFirstPage();
      },
      error: (err) => {
        console.error('Etkinlikler yüklenemedi, mock data kullanılıyor:', err);
        // Hata durumunda sadece Mock Data göster
        this.allEventsPool = [...this.baseEvents];
        this.applyFiltersAndGoFirstPage();
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
      if (this.sortOrder === 'date_asc') {
        return a.dateObj.getTime() - b.dateObj.getTime();
      } else if (this.sortOrder === 'date_desc') {
        return b.dateObj.getTime() - a.dateObj.getTime();
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

  // Old changeSortCriteria removed
  
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

  // --- MODAL İŞLEMLERİ YERİNE DETAY SAYFASINA GİT ---
  openEventDetail(event: EventCard) {
    this.router.navigate(['/events', event.id]);
  }
}