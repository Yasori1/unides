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
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger, group } from '@angular/animations';

// ÖNEMLİ NOT:
// Header, Footer ve Banner componentleriniz "Standalone" değilse (bir NgModule içindelerse),
// onları burada doğrudan "imports" dizisine ekleyemezsiniz.
// Bunun yerine, bu componentlerin tanımlı olduğu modülü (Örn: SharedModule) import etmelisiniz.

// import { SharedModule } from 'src/app/common/shared/shared.module'; // <-- Örnek path

// Hata vermemesi için arayüz tanımları
interface EventCard {
  id: number;
  title: string;
  status: 'active' | 'upcoming';
  startDate: string;
  description: string;
  location?: string;
  image: string;
  category: string;
  dateObj: Date;
  quota: number;
  university: string;
  club: string;
  semester: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    // SharedModule // <--- BURASI ÖNEMLİ: HeaderComponent, FooterComponent vb. Standalone değilse buraya SharedModule'ü ekleyin ve yukarıdan import edin.
    // Eğer SharedModule eklemezseniz <app-header> html tarafında hata verebilir.
    // Şimdilik hata veren componentleri buradan kaldırdım.
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger('50ms', [animate('400ms ease-out', style({ opacity: 1, transform: 'none' }))]),
          ],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class EventsComponent implements AfterViewInit, OnInit {
  // Hero Animation Vars
  scrollPosition: number = 0;
  heroScale: number = 1;
  heroOpacity: number = 1;
  heroMoveX: number = 0;
  heroMoveY: number = 0;
  showScrollIndicator: boolean = true;

  // Filter & Search
  activeCategory: string = 'Tümü';
  currentFilter: 'all' | 'active' | 'upcoming' = 'all';
  searchQuery: string = '';
  sortCriteria: 'date' | 'name' = 'date';
  sortAscending: boolean = true;

  categories: string[] = ['Tümü', 'Teknoloji', 'Sanat', 'Müzik', 'Kariyer', 'Spor', 'Gezi'];

  // Data
  baseEvents: EventCard[] = [
    {
      id: 1,
      title: 'Yapay Zeka Zirvesi',
      description: 'Geleceğin teknolojilerini sektör liderlerinden dinleyin.',
      category: 'Teknoloji',
      startDate: '2025-10-25',
      dateObj: new Date('2025-10-25'),
      university: 'İTÜ',
      club: 'YZ Kulübü',
      semester: 'Güz',
      location: 'Merkez Kampüs',
      quota: 150,
      image: 'assets/images/events/event1.jpg',
      status: 'upcoming',
    },
    {
      id: 2,
      title: 'Bahar Festivali',
      description: 'Dev sahne, sürpriz sanatçılar ve gün boyu eğlence.',
      category: 'Müzik',
      startDate: '2025-05-15',
      dateObj: new Date('2025-05-15'),
      university: 'Boğaziçi',
      club: 'Müzik Kulübü',
      semester: 'Bahar',
      location: 'Güney Meydan',
      quota: 5000,
      image: 'assets/images/events/event2.jpg',
      status: 'upcoming',
    },
    {
      id: 3,
      title: 'UI/UX Tasarım Atölyesi',
      description: 'Figma ile mobil uygulama arayüzü tasarlamayı öğrenin.',
      category: 'Sanat',
      startDate: '2025-11-12',
      dateObj: new Date('2025-11-12'),
      university: 'MSGSÜ',
      club: 'Tasarım',
      semester: 'Güz',
      location: 'Fındıklı',
      quota: 30,
      image: 'assets/images/events/event3.jpg',
      status: 'active',
    },
    {
      id: 4,
      title: 'Start-Up 101',
      description: 'Kendi girişiminizi kurmanın yolları.',
      category: 'Kariyer',
      startDate: '2025-09-20',
      dateObj: new Date('2025-09-20'),
      university: 'ODTÜ',
      club: 'Girişimcilik',
      semester: 'Güz',
      location: 'Teknokent',
      quota: 100,
      image: 'assets/images/events/event4.jpg',
      status: 'active',
    },
  ];

  filteredEvents: EventCard[] = [];
  displayedEvents: EventCard[] = [];

  // Pagination / Load More
  currentPage: number = 0;
  pageSize: number = 6;
  hasMoreData: boolean = true;
  isLoadingMore: boolean = false;

  // Modals
  selectedEvent: EventCard | null = null;
  showAddModal: boolean = false;
  isJoined: boolean = false;

  // Form Model
  newProject: any = { title: '', status: 'active', category: 'Teknoloji', description: '' };

  // Slider
  sliderImages: string[] = [
    'assets/images/gallery/g1.jpg',
    'assets/images/gallery/g2.jpg',
    'assets/images/gallery/g3.jpg',
    'assets/images/gallery/g4.jpg',
  ];

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    this.applyFilters();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-fadeInUp');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      this.animItems.forEach((item) => observer.observe(item.nativeElement));
    }
  }

  // --- LOGIC ---

  applyFilters() {
    let result = [...this.baseEvents];

    // 1. Text Search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.university.toLowerCase().includes(q) ||
          e.club.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (this.activeCategory !== 'Tümü') {
      result = result.filter((e) => e.category === this.activeCategory);
    }

    // 3. Status Filter
    if (this.currentFilter !== 'all') {
      result = result.filter((e) => e.status === this.currentFilter);
    }

    // 4. Sort
    result.sort((a, b) => {
      if (this.sortCriteria === 'date') {
        return this.sortAscending
          ? a.dateObj.getTime() - b.dateObj.getTime()
          : b.dateObj.getTime() - a.dateObj.getTime();
      } else {
        return this.sortAscending ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
    });

    this.filteredEvents = result;
    this.currentPage = 0;
    this.displayedEvents = [];
    this.hasMoreData = true;
    this.loadMoreEvents();
  }

  loadMoreEvents() {
    if (this.isLoadingMore || !this.hasMoreData) return;
    this.isLoadingMore = true;

    // Simulate Network Delay
    setTimeout(() => {
      const start = this.currentPage * this.pageSize;
      const end = start + this.pageSize;
      const nextBatch = this.filteredEvents.slice(start, end);

      this.displayedEvents = [...this.displayedEvents, ...nextBatch];
      this.currentPage++;
      this.isLoadingMore = false;

      if (this.displayedEvents.length >= this.filteredEvents.length) {
        this.hasMoreData = false;
      }
    }, 500);
  }

  setCategory(cat: string) {
    this.activeCategory = cat;
    this.applyFilters();
  }

  setFilter(status: 'all' | 'active' | 'upcoming') {
    this.currentFilter = status;
    this.applyFilters();
  }

  changeSortCriteria(crit: 'date' | 'name') {
    if (this.sortCriteria === crit) this.sortAscending = !this.sortAscending;
    else {
      this.sortCriteria = crit;
      this.sortAscending = true;
    }
    this.applyFilters();
  }

  // --- HERO ANIMATION ---
  @HostListener('window:scroll')
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.scrollPosition = window.scrollY;
      this.showScrollIndicator = this.scrollPosition < 100;

      const limit = 600;
      if (this.scrollPosition < limit) {
        this.heroScale = 1 - this.scrollPosition / (limit * 3);
        this.heroOpacity = 1 - this.scrollPosition / limit;
      }
    }
  }

  onHeroMouseMove(e: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = e.clientX - window.innerWidth / 2;
      const y = e.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 20;
      this.heroMoveY = y / 20;
    }
  }

  // --- TILT EFFECT ---
  cardTilt(e: MouseEvent, card: HTMLElement) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
  }

  cardReset(card: HTMLElement) {
    card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
  }

  // --- MODAL ACTIONS ---
  openEventDetail(event: EventCard) {
    this.selectedEvent = event;
    this.isJoined = false;
    document.body.style.overflow = 'hidden';
  }

  closeDetail() {
    this.selectedEvent = null;
    document.body.style.overflow = 'auto';
  }

  joinEvent() {
    this.isJoined = true;
  }

  openAddModal() {
    this.showAddModal = true;
  }
  closeAddModal() {
    this.showAddModal = false;
  }
  saveProject() {
    // Mock save
    const newId = this.baseEvents.length + 1;
    this.baseEvents.unshift({
      ...this.newProject,
      id: newId,
      startDate: new Date().toISOString(),
      dateObj: new Date(),
      image: 'assets/images/page-title1.jpg',
      university: 'Ünides',
      club: 'Genel',
      semester: 'Güz',
      location: 'Online',
      quota: 100,
    });
    this.closeAddModal();
    this.applyFilters();
  }

  onFileSelected(event: any) {
    // File upload logic here
  }

  trackByEventId(index: number, item: EventCard) {
    return item.id;
  }
}
