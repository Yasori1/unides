import { Component, HostListener, ElementRef, ViewChildren, ViewChild, QueryList, AfterViewInit, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { trigger, transition, style, animate, query, stagger, group } from '@angular/animations';

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
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        group([
          query(':leave', [
            animate('300ms ease-out', style({ opacity: 0, transform: 'scale(0.9)' }))
          ], { optional: true }),
          query(':enter', [
             style({ opacity: 0, transform: 'translateY(30px)' }),
             stagger('50ms', [
               animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'none' }))
             ])
          ], { optional: true })
        ])
      ])
    ])
  ]
})
export class EventsComponent implements AfterViewInit, OnInit {
  
  // Hero & Görsel
  scrollPosition: number = 0;
  heroScale: number = 1;
  heroOpacity: number = 1;
  heroMoveX: number = 0;
  heroMoveY: number = 0;
  showScrollIndicator: boolean = true;

  // Filtreleme
  activeCategory: string = 'Tümü';
  categories: string[] = ['Tümü', 'Teknoloji', 'Sanat', 'Müzik', 'Kariyer', 'Spor', 'Gezi'];
  searchQuery: string = '';
  
  // Sıralama
  sortCriteria: 'date' | 'name' | 'semester' = 'date'; 
  sortAscending: boolean = true;

  // Modal
  selectedEvent: EventCard | null = null;
  isJoined: boolean = false;

  // Sayfalama
  allEventsPool: EventCard[] = [];
  displayedEvents: EventCard[] = [];
  currentPage: number = 0;
  pageSize: number = 8; 
  isLoadingMore: boolean = false;
  hasMoreData: boolean = true;

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;

  // Slider (Sabit Linkler)
  sliderImages: string[] = [
    'https://images.unsplash.com/photo-1540575467063-178a50d2df87?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop'
  ];

  // --- GÜNCELLENMİŞ VERİ SETİ (Görseller Düzeltildi) ---
  baseEvents: EventCard[] = [
    { 
      id: 1, title: 'Yapay Zeka Zirvesi', description: 'Geleceğin teknolojilerini sektör liderlerinden dinleyin.', category: 'Teknoloji', 
      date: '25 Ekim', dateObj: new Date('2025-10-25'), time: '14:00', university: 'İstanbul Teknik Üniversitesi', club: 'Yapay Zeka Kulübü', 
      semester: '1. Dönem', location: 'Süleyman Demirel Kültür Merkezi', quota: 150, 
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop', color: '#14d2cc' 
    },
    { 
      id: 2, title: 'Bahar Festivali', description: 'Dev sahne, sürpriz sanatçılar ve gün boyu eğlence.', category: 'Müzik', 
      date: '15 Mayıs', dateObj: new Date('2025-05-15'), time: '16:00', university: 'Boğaziçi Üniversitesi', club: 'Müzik Kulübü', 
      semester: '2. Dönem', location: 'Güney Kampüs Meydan', quota: 5000, 
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop', color: '#f472b6' 
    },
    { 
      id: 3, title: 'UI/UX Tasarım Atölyesi', description: 'Figma ile mobil uygulama arayüzü tasarlamayı öğrenin.', category: 'Sanat', 
      date: '12 Kasım', dateObj: new Date('2025-11-12'), time: '10:00', university: 'Mimar Sinan Güzel Sanatlar', club: 'Tasarım Topluluğu', 
      semester: '1. Dönem', location: 'Fındıklı Kampüsü', quota: 30, 
      imageUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800&auto=format&fit=crop', color: '#fbbf24' // GÜNCELLENDİ
    },
    { 
      id: 4, title: 'Global Kariyer Fuarı', description: 'Global şirketlerle tanışma ve mülakat simülasyonları.', category: 'Kariyer', 
      date: '05 Aralık', dateObj: new Date('2025-12-05'), time: '09:00', university: 'Yıldız Teknik Üniversitesi', club: 'Kariyer Kulübü', 
      semester: '1. Dönem', location: 'Davutpaşa Kongre Merkezi', quota: 500, 
      imageUrl: 'https://images.unsplash.com/photo-1511376777868-611b54f68947?q=80&w=800&auto=format&fit=crop', color: '#a78bfa' // GÜNCELLENDİ
    },
    { 
      id: 5, title: 'Valorant Turnuvası', description: '5 kişilik takımını kur, büyük ödül için yarış.', category: 'Spor', 
      date: '20 Şubat', dateObj: new Date('2025-02-20'), time: '12:00', university: 'Bahçeşehir Üniversitesi', club: 'E-Spor Kulübü', 
      semester: '2. Dönem', location: 'Galata Kampüsü', quota: 64, 
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop', color: '#ef4444' 
    },
    { 
      id: 6, title: 'Doğa Yürüyüşü', description: 'Belgrad Ormanı\'nda trekking ve kahvaltı.', category: 'Gezi', 
      date: '28 Eylül', dateObj: new Date('2025-09-28'), time: '07:30', university: 'İstanbul Üniversitesi', club: 'Doğa Sporları', 
      semester: '1. Dönem', location: 'Belgrad Ormanı', quota: 40, 
      imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop', color: '#10b981' 
    },
    { 
      id: 7, title: 'Kısa Film Gösterimi', description: 'Ödüllü kısa filmler ve yönetmen söyleşisi.', category: 'Sanat', 
      date: '03 Mart', dateObj: new Date('2025-03-03'), time: '19:00', university: 'Galatasaray Üniversitesi', club: 'Sinema Kulübü', 
      semester: '2. Dönem', location: 'Cep Sineması', quota: 80, 
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop', color: '#f97316' 
    },
    { 
      id: 8, title: 'Blockchain 101', description: 'Web3 teknolojilerinin temelleri ve sektör analizi.', category: 'Teknoloji', 
      date: '18 Ekim', dateObj: new Date('2025-10-18'), time: '15:00', university: 'Koç Üniversitesi', club: 'Blockchain Topluluğu', 
      semester: '1. Dönem', location: 'Sci-Tech Binası', quota: 100, 
      imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=800&auto=format&fit=crop', color: '#6366f1' 
    },
    { 
      id: 9, title: 'Satranç Turnuvası', description: 'Zekanı konuştur, hamleni yap. Ödüllü turnuva.', category: 'Spor', 
      date: '08 Nisan', dateObj: new Date('2025-04-08'), time: '10:00', university: 'Marmara Üniversitesi', club: 'Satranç Kulübü', 
      semester: '2. Dönem', location: 'Göztepe Kampüsü', quota: 120, 
      imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800&auto=format&fit=crop', color: '#3b82f6' 
    },
    { 
      id: 10, title: 'Girişimcilik Zirvesi', description: 'Startup dünyasına giriş ve melek yatırımcı buluşmaları.', category: 'Kariyer', 
      date: '14 Aralık', dateObj: new Date('2025-12-14'), time: '11:00', university: 'Özyeğin Üniversitesi', club: 'Girişimcilik Fabrikası', 
      semester: '1. Dönem', location: 'Forum Alanı', quota: 200, 
      imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop', color: '#8b5cf6' 
    },
    { 
      id: 11, title: 'Yoga & Meditasyon', description: 'Vize haftası öncesi stresi azaltmak için matını kap gel.', category: 'Spor', 
      date: '01 Mayıs', dateObj: new Date('2025-05-01'), time: '08:00', university: 'Sabancı Üniversitesi', club: 'Yaşam Kulübü', 
      semester: '2. Dönem', location: 'Çim Alan', quota: 50, 
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop', color: '#14b8a6' // GÜNCELLENDİ
    },
    { 
      id: 12, title: 'Kodlama Maratonu', description: '48 saat sürecek hackathon macerası.', category: 'Teknoloji', 
      date: '29 Kasım', dateObj: new Date('2025-11-29'), time: '18:00', university: 'Orta Doğu Teknik Üniversitesi', club: 'Bilgisayar Topluluğu', 
      semester: '1. Dönem', location: 'Teknokent', quota: 100, 
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop', color: '#ec4899' // GÜNCELLENDİ
    },
    {
      id: 13, title: 'Müze Gezisi', description: 'İstanbul Modern Sanat Müzesi\'ni rehber eşliğinde geziyoruz.', category: 'Gezi',
      date: '10 Ocak', dateObj: new Date('2025-01-10'), time: '13:00', university: 'İstanbul Bilgi Üniversitesi', club: 'Sanat Kulübü',
      semester: '1. Dönem', location: 'Karaköy', quota: 25,
      imageUrl: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?q=80&w=800&auto=format&fit=crop', color: '#e11d48' // GÜNCELLENDİ
    },
    {
      id: 14, title: 'Caz Gecesi', description: 'Kampüs bahçesinde açık hava caz konseri.', category: 'Müzik',
      date: '02 Haziran', dateObj: new Date('2025-06-02'), time: '20:00', university: 'Hacettepe Üniversitesi', club: 'Caz Topluluğu',
      semester: '2. Dönem', location: 'Beytepe Kampüsü', quota: 300,
      imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop', color: '#7c3aed'
    },
    {
      id: 15, title: 'Finans 101', description: 'Borsa ve yatırım araçlarına giriş eğitimi.', category: 'Kariyer',
      date: '22 Mart', dateObj: new Date('2025-03-22'), time: '14:30', university: 'İstanbul Üniversitesi', club: 'Ekonomi Kulübü',
      semester: '2. Dönem', location: 'İktisat Fakültesi', quota: 80,
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop', color: '#059669'
    },
    {
      id: 16, title: 'Robotik Yarışması', description: 'Kendi robotunu tasarla, arenada kapıştır.', category: 'Teknoloji',
      date: '18 Nisan', dateObj: new Date('2025-04-18'), time: '09:00', university: 'Gebze Teknik Üniversitesi', club: 'Robotik Kulübü',
      semester: '2. Dönem', location: 'Spor Salonu', quota: 60,
      imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop', color: '#dc2626'
    }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.allEventsPool = [...this.baseEvents];
    this.applyFiltersAndLoadFirstPage();
  }

  getFilteredAndSortedPool(): EventCard[] {
    let filtered = this.activeCategory === 'Tümü' 
      ? [...this.allEventsPool] 
      : this.allEventsPool.filter(e => e.category === this.activeCategory);

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) || 
        e.university.toLowerCase().includes(query) ||
        e.club.toLowerCase().includes(query)
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

  trackByEventId(index: number, event: EventCard): number {
    return event.id;
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

  openEventDetail(event: EventCard) {
    this.selectedEvent = event;
    this.isJoined = false;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }

  joinEvent() {
    this.isJoined = true;
  }

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 25; 
      this.heroMoveY = y / 25;
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      this.animItems.forEach(item => revealObserver.observe(item.nativeElement));
    }
  }

  @HostListener('window:scroll') 
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.scrollPosition = window.scrollY;
      
      if (this.scrollPosition > 100) {
        this.showScrollIndicator = false;
      } else {
        this.showScrollIndicator = true;
      }

      const limit = 800;
      if (this.scrollPosition < limit) {
        this.heroScale = 1 - (this.scrollPosition / (limit * 4)); 
        this.heroOpacity = 1 - (this.scrollPosition / limit);
      }
    }
  }

  cardTilt(event: MouseEvent, cardElement: HTMLElement) {
    const rect = cardElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15; 
    const rotateY = ((x - centerX) / centerX) * 15;
    cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }

  cardReset(cardElement: HTMLElement) {
    cardElement.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
  }
}