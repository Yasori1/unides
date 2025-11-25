import {
  Component,
  HostListener,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  OnInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Router Eklendi
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger, group } from '@angular/animations';

import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';

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

  // Detay Modal & Üyelik Kontrolü
  selectedEvent: EventCard | null = null;
  isJoined: boolean = false;
  isLoggedIn: boolean = false; // Varsayılan olarak giriş yapılmamış

  // Sayfalama
  allEventsPool: EventCard[] = [];
  displayedEvents: EventCard[] = [];
  currentPage: number = 0;
  pageSize: number = 8;
  isLoadingMore: boolean = false;
  hasMoreData: boolean = true;

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;

  // Slider Görselleri
  sliderImages: string[] = [
    'https://images.unsplash.com/photo-1540575467063-178a50d2df87?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop',
  ];

  // --- VERİ SETİ ---
  baseEvents: EventCard[] = [
    {
      id: 1,
      title: 'Yapay Zeka Zirvesi',
      description: 'Geleceğin teknolojilerini sektör liderlerinden dinleyin.',
      category: 'Teknoloji',
      date: '25 Ekim',
      dateObj: new Date('2025-10-25'),
      time: '14:00',
      university: 'İstanbul Teknik Üniversitesi',
      club: 'Yapay Zeka Kulübü',
      semester: '1. Dönem',
      location: 'Süleyman Demirel Kültür Merkezi',
      quota: 150,
      status: 'active',
      imageUrl:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
      color: '#2563eb',
    },
    {
      id: 2,
      title: 'Bahar Festivali',
      description: 'Dev sahne, sürpriz sanatçılar ve gün boyu eğlence.',
      category: 'Müzik',
      date: '15 Mayıs',
      dateObj: new Date('2025-05-15'),
      time: '16:00',
      university: 'Boğaziçi Üniversitesi',
      club: 'Müzik Kulübü',
      semester: '2. Dönem',
      location: 'Güney Kampüs Meydan',
      quota: 5000,
      status: 'upcoming',
      imageUrl:
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
      color: '#4f46e5',
    },
    {
      id: 3,
      title: 'UI/UX Tasarım Atölyesi',
      description: 'Figma ile mobil uygulama arayüzü tasarlamayı öğrenin.',
      category: 'Sanat',
      date: '12 Kasım',
      dateObj: new Date('2025-11-12'),
      time: '10:00',
      university: 'Mimar Sinan Güzel Sanatlar',
      club: 'Tasarım Topluluğu',
      semester: '1. Dönem',
      location: 'Fındıklı Kampüsü',
      quota: 30,
      status: 'active',
      imageUrl:
        'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800&auto=format&fit=crop',
      color: '#0ea5e9',
    },
    {
      id: 4,
      title: 'Global Kariyer Fuarı',
      description: 'Global şirketlerle tanışma ve mülakat simülasyonları.',
      category: 'Kariyer',
      date: '05 Aralık',
      dateObj: new Date('2025-12-05'),
      time: '09:00',
      university: 'Yıldız Teknik Üniversitesi',
      club: 'Kariyer Kulübü',
      semester: '1. Dönem',
      location: 'Davutpaşa Kongre Merkezi',
      quota: 500,
      status: 'upcoming',
      imageUrl:
        'https://images.unsplash.com/photo-1511376777868-611b54f68947?q=80&w=800&auto=format&fit=crop',
      color: '#0f172a',
    },
    {
      id: 5,
      title: 'Valorant Turnuvası',
      description: '5 kişilik takımını kur, büyük ödül için yarış.',
      category: 'Spor',
      date: '20 Şubat',
      dateObj: new Date('2025-02-20'),
      time: '12:00',
      university: 'Bahçeşehir Üniversitesi',
      club: 'E-Spor Kulübü',
      semester: '2. Dönem',
      location: 'Galata Kampüsü',
      quota: 64,
      status: 'active',
      imageUrl:
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
      color: '#ef4444',
    },
    {
      id: 6,
      title: 'Doğa Yürüyüşü',
      description: "Belgrad Ormanı'nda trekking ve kahvaltı.",
      category: 'Gezi',
      date: '28 Eylül',
      dateObj: new Date('2025-09-28'),
      time: '07:30',
      university: 'İstanbul Üniversitesi',
      club: 'Doğa Sporları',
      semester: '1. Dönem',
      location: 'Belgrad Ormanı',
      quota: 40,
      status: 'upcoming',
      imageUrl:
        'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop',
      color: '#10b981',
    },
  ];

  // Router Inject Edildi
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router) {}

  ngOnInit() {
    this.allEventsPool = [...this.baseEvents];
    this.applyFiltersAndLoadFirstPage();
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

  // --- FİLTRELEME VE SIRALAMA ---
  getFilteredAndSortedPool(): EventCard[] {
    let filtered =
      this.activeCategory === 'Tümü'
        ? [...this.allEventsPool]
        : this.allEventsPool.filter((e) => e.category === this.activeCategory);

    // Ana Filtre
    if (this.currentFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === this.currentFilter);
    }

    // Arama
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
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
    this.isJoined = false;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }

  // YENİ: Giriş kontrolü yapan fonksiyon
  handleJoinClick() {
    if (!this.isLoggedIn) {
      this.closeModal(); // Modalı kapat
      this.router.navigate(['/login']); // Login sayfasına yönlendir
    } else {
      this.isJoined = true;
    }
  }

  // Eski fonksiyonu sadece mantık içinde kullandık
  joinEvent() {
    this.isJoined = true;
  }
}
