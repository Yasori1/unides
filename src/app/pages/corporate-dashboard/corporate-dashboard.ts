import { Component, OnInit, HostListener, Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ImageUploadComponent } from '../../components/ui/image-upload/image-upload';
import { CommunityService } from '../../services/community.services';
import { AnnouncementService } from '../../services/announcement.services';
import { EventService, EventItem } from '../../services/event.services';

// NOT: ToastService ve ToastComponent'i normalde ayrı dosyalardan import edersiniz.
// Burada örnek çalışabilsin diye aynı dosyada tuttum veya import edilmiş varsaydım.

// ==========================================
// MOCK TOAST SERVICE & COMPONENT (Dependencies)
// ==========================================
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private currentTimeout: any = null;

  show(message: string, type: 'success' | 'error' = 'success') {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    const newToast: Toast = { id: Date.now(), message, type };
    this.toastsSubject.next([newToast]);
    this.currentTimeout = setTimeout(() => {
      this.remove(newToast.id);
    }, 3000);
  }

  remove(id: number) {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter((t) => t.id !== id));
  }
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts$ | async"
        class="toast-notification"
        [class.error]="toast.type === 'error'"
      >
        <span class="material-symbols-outlined">{{
          toast.type === 'success' ? 'check_circle' : 'error'
        }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 3000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .toast-notification {
        background: white;
        padding: 16px 24px;
        border-radius: 14px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        border-left: 5px solid #10b981;
        animation: slideUp 0.3s ease-out;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #0f172a;
      }
      .toast-notification.error {
        border-left-color: #ef4444;
      }
      .toast-notification.error span:first-child {
        color: #ef4444;
      }
      .toast-notification span:first-child {
        color: #10b981;
        font-size: 1.5rem;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ToastComponent {
  toasts$;
  constructor(public toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }
}

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================

// Interfaces
interface Stat {
  label: string;
  value: any;
  icon: string;
  colorClass: string;
}
interface Community {
  id: number;
  name: string;
  about?: string;
  description?: string; // CommunityService'ten gelen veri için
  city?: string;
  university: string;
  memberCount: number;
  socialMedia?: string; // Eski uyumluluk için
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  email?: string;
  category: string;
  logo: string;
  banner?: string;
  coverImage?: string; // CommunityService'ten gelen veri için
  status?: 'Aktif' | 'Pasif';
}
interface Announcement {
  id: number;
  title: string;
  shortDescription: string;
  content: string;
  date: string;
  image: string;
  link: string;
}
interface EventRequest {
  id: number;
  communityId?: number;
  communityName: string;
  eventName: string;
  date: string;
  location: string;
  imageUrl?: string;
  description?: string;
  status: 'Onaylandı' | 'Beklemede' | 'Reddedildi';
  capacity?: string;
}

@Component({
  selector: 'app-corporate-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, ImageUploadComponent],
  templateUrl: './corporate-dashboard.html',
  styleUrls: ['./corporate-dashboard.scss'],
})
export class CorporateDashboardComponent implements OnInit {
  isSidebarCollapsed = false;
  activeTab = 'overview';
  showNotifications = false;
  isProfileOpen = false;
  isModalOpen = false;
  modalType = '';
  searchText = '';
  statusFilter: string = ''; // Aktif/Pasif filtre

  // Pagination için değişkenler
  currentPage = 1;
  itemsPerPage = 15;
  totalPages = 0;
  pages: number[] = [];
  displayedCommunities: Community[] = [];

  // Topluluk düzenleme için
  selectedCommunity: Community | null = null;
  editingCommunity: (Community & { presidentEmail?: string }) | null = null;
  newCommunity: (Community & { presidentEmail?: string }) | null = null;

  // Duyuru düzenleme için
  selectedAnnouncement: Announcement | null = null;
  editingAnnouncement: Announcement | null = null;

  corporateInfo = {
    name: 'İstanbul',
    logo: 'https://ui-avatars.com/api/?name=UNIDES&background=14d2cc&color=fff&size=128',
    email: 'admin@unides.com',
    username: 'unides_admin',
  };

  stats: Stat[] = [
    { label: 'Toplam Topluluk', value: 42, icon: 'groups', colorClass: 'blue' },
    { label: 'Aktif Etkinlik', value: 12, icon: 'event', colorClass: 'green' },
    { label: 'Bekleyen İstek', value: 5, icon: 'pending_actions', colorClass: 'orange' },
  ];

  // Kategori listesi
  categories: string[] = [
    'Teknoloji',
    'Sanat',
    'Spor',
    'Kariyer',
    'Kültür',
    'Bilim',
    'Sosyal',
    'Müzik',
  ];

  allCommunities: Community[] = [
    {
      id: 1,
      name: 'AI & Data Club',
      about:
        'Yapay zeka ve veri bilimi alanında çalışmalar yapan, workshop ve etkinlikler düzenleyen teknoloji topluluğu.',
      city: 'İstanbul',
      university: 'İstanbul Teknik Üniversitesi',
      memberCount: 156,
      socialMedia: 'https://instagram.com/aidataclub',
      website: 'https://aidataclub.com',
      email: 'ai.dataclub@unides.com',
      category: 'Teknoloji',
      logo: 'https://ui-avatars.com/api/?name=AI&background=0f172a&color=fff',
      banner: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      status: 'Aktif',
    },
    {
      id: 2,
      name: 'Dans Topluluğu',
      about:
        'Modern dans, salsa, hip-hop ve geleneksel danslar üzerine eğitimler veren sanat topluluğu.',
      city: 'Ankara',
      university: 'Hacettepe Üniversitesi',
      memberCount: 89,
      socialMedia: 'https://instagram.com/danstoplulugu',
      website: '',
      email: 'dans@unides.com',
      category: 'Sanat',
      logo: 'https://ui-avatars.com/api/?name=DT&background=f43f5e&color=fff',
      banner: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800',
      status: 'Aktif',
    },
    {
      id: 3,
      name: 'Girişimcilik Kulübü',
      about:
        'Startup ekosistemi, yatırım süreçleri ve girişimcilik üzerine etkinlikler düzenleyen kariyer odaklı topluluk.',
      city: 'İzmir',
      university: 'Ege Üniversitesi',
      memberCount: 210,
      socialMedia: 'https://linkedin.com/company/girisimcilik',
      website: 'https://girisimcilik.org',
      email: 'girisimcilik@unides.com',
      category: 'Kariyer',
      logo: 'https://ui-avatars.com/api/?name=GK&background=3b82f6&color=fff',
      banner: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
      status: 'Aktif',
    },
    {
      id: 4,
      name: 'E-Spor Topluluğu',
      about:
        'Profesyonel e-spor turnuvaları düzenleyen ve oyuncular yetiştiren rekabetçi oyun topluluğu.',
      city: 'Bursa',
      university: 'Uludağ Üniversitesi',
      memberCount: 340,
      socialMedia: 'https://twitter.com/espor_toplulugu',
      website: 'https://espor.gg',
      email: 'espor@unides.com',
      category: 'Spor',
      logo: 'https://ui-avatars.com/api/?name=ES&background=eab308&color=fff',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      status: 'Pasif',
    },
    {
      id: 5,
      name: 'Fotoğrafçılık Kulübü',
      about:
        'Fotoğrafçılık teknikleri, düzenleme ve kompozisyon üzerine eğitimler veren sanat topluluğu.',
      city: 'İstanbul',
      university: 'Mimar Sinan Güzel Sanatlar Üniversitesi',
      memberCount: 125,
      socialMedia: 'https://instagram.com/fotokulup',
      website: '',
      email: 'foto@unides.com',
      category: 'Sanat',
      logo: 'https://ui-avatars.com/api/?name=FK&background=10b981&color=fff',
      banner: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800',
      status: 'Aktif',
    },
    {
      id: 6,
      name: 'Müzik Topluluğu',
      about: 'Enstrüman eğitimi, konserler ve müzik teorisi üzerine çalışmalar yapan topluluk.',
      city: 'Ankara',
      university: 'Bilkent Üniversitesi',
      memberCount: 98,
      socialMedia: 'https://instagram.com/muziktoplulugu',
      website: 'https://muzik.bilkent.edu.tr',
      email: 'muzik@unides.com',
      category: 'Müzik',
      logo: 'https://ui-avatars.com/api/?name=MT&background=8b5cf6&color=fff',
      banner: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
      status: 'Aktif',
    },
    {
      id: 7,
      name: 'Tiyatro Kulübü',
      about:
        'Sahne sanatları, oyunculuk ve tiyatro prodüksiyonu üzerine çalışmalar yapan sanat topluluğu.',
      city: 'İzmir',
      university: 'Dokuz Eylül Üniversitesi',
      memberCount: 67,
      socialMedia: 'https://instagram.com/tiyatrokulup',
      website: '',
      email: 'tiyatro@unides.com',
      category: 'Sanat',
      logo: 'https://ui-avatars.com/api/?name=TK&background=ec4899&color=fff',
      banner: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800',
      status: 'Aktif',
    },
    {
      id: 8,
      name: 'Yazılım Geliştirme',
      about:
        'Web, mobil ve masaüstü uygulama geliştirme üzerine eğitimler ve hackathonlar düzenleyen teknoloji topluluğu.',
      city: 'Antalya',
      university: 'Akdeniz Üniversitesi',
      memberCount: 234,
      socialMedia: 'https://github.com/yazilimdev',
      website: 'https://yazilimdev.org',
      email: 'yazilim@unides.com',
      category: 'Teknoloji',
      logo: 'https://ui-avatars.com/api/?name=YG&background=06b6d4&color=fff',
      banner: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      status: 'Aktif',
    },
    {
      id: 9,
      name: 'Robotik Kulübü',
      about:
        'Robot tasarımı, otomasyon ve mekatronik sistemler üzerine projeler geliştiren teknoloji topluluğu.',
      city: 'Eskişehir',
      university: 'Anadolu Üniversitesi',
      memberCount: 145,
      socialMedia: 'https://instagram.com/robotikkulup',
      website: 'https://robotik.anadolu.edu.tr',
      email: 'robotik@unides.com',
      category: 'Teknoloji',
      logo: 'https://ui-avatars.com/api/?name=RK&background=f97316&color=fff',
      banner: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
      status: 'Pasif',
    },
    {
      id: 10,
      name: 'Doğa Sporları',
      about: 'Dağcılık, kamp, trekking ve outdoor aktiviteler düzenleyen spor topluluğu.',
      city: 'Trabzon',
      university: 'Karadeniz Teknik Üniversitesi',
      memberCount: 78,
      socialMedia: 'https://instagram.com/dogasporlari',
      website: '',
      email: 'dogasporlari@unides.com',
      category: 'Spor',
      logo: 'https://ui-avatars.com/api/?name=DS&background=22c55e&color=fff',
      banner: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
      status: 'Aktif',
    },
    {
      id: 11,
      name: 'Satranç Kulübü',
      about:
        'Satranç turnuvaları, eğitimler ve strateji oyunları üzerine çalışmalar yapan topluluk.',
      city: 'Konya',
      university: 'Selçuk Üniversitesi',
      memberCount: 56,
      socialMedia: 'https://instagram.com/satranckulup',
      website: '',
      email: 'satranc@unides.com',
      category: 'Spor',
      logo: 'https://ui-avatars.com/api/?name=SK&background=64748b&color=fff',
      banner: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
      status: 'Aktif',
    },
    {
      id: 12,
      name: 'Edebiyat Topluluğu',
      about:
        'Şiir, roman ve edebiyat eleştirisi üzerine söyleşiler ve okuma grupları düzenleyen kültür topluluğu.',
      city: 'Samsun',
      university: 'Ondokuz Mayıs Üniversitesi',
      memberCount: 43,
      socialMedia: 'https://instagram.com/edebiyattoplulugu',
      website: '',
      email: 'edebiyat@unides.com',
      category: 'Kültür',
      logo: 'https://ui-avatars.com/api/?name=ET&background=a855f7&color=fff',
      banner: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
      status: 'Aktif',
    },
    {
      id: 13,
      name: 'Sinema Kulübü',
      about:
        'Film gösterimleri, yönetmen söyleşileri ve sinema tarihi üzerine etkinlikler düzenleyen sanat topluluğu.',
      city: 'İstanbul',
      university: 'İstanbul Üniversitesi',
      memberCount: 112,
      socialMedia: 'https://instagram.com/sinemakulup',
      website: 'https://sinemakulup.ist',
      email: 'sinema@unides.com',
      category: 'Sanat',
      logo: 'https://ui-avatars.com/api/?name=SN&background=ef4444&color=fff',
      banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
      status: 'Aktif',
    },
    {
      id: 14,
      name: 'Astronomi Kulübü',
      about: 'Gök gözlemi, uzay bilimleri ve astrofizik üzerine çalışmalar yapan bilim topluluğu.',
      city: 'Ankara',
      university: 'ODTÜ',
      memberCount: 89,
      socialMedia: 'https://twitter.com/astronomikulup',
      website: 'https://astronomi.odtu.edu.tr',
      email: 'astronomi@unides.com',
      category: 'Bilim',
      logo: 'https://ui-avatars.com/api/?name=AK&background=1e3a8a&color=fff',
      banner: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
      status: 'Pasif',
    },
    {
      id: 15,
      name: 'Aşçılık Kulübü',
      about:
        'Mutfak sanatları, yemek kültürü ve gastronomi üzerine atölyeler düzenleyen sosyal topluluk.',
      city: 'Gaziantep',
      university: 'Gaziantep Üniversitesi',
      memberCount: 67,
      socialMedia: 'https://instagram.com/ascilikkulup',
      website: '',
      email: 'ascilik@unides.com',
      category: 'Sosyal',
      logo: 'https://ui-avatars.com/api/?name=AC&background=dc2626&color=fff',
      banner: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      status: 'Aktif',
    },
    {
      id: 16,
      name: 'Yoga & Meditasyon',
      about:
        'Yoga, meditasyon ve mindfulness üzerine seanslar ve workshoplar düzenleyen sağlık topluluğu.',
      city: 'Muğla',
      university: 'Muğla Sıtkı Koçman Üniversitesi',
      memberCount: 54,
      socialMedia: 'https://instagram.com/yogameditasyon',
      website: '',
      email: 'yoga@unides.com',
      category: 'Spor',
      logo: 'https://ui-avatars.com/api/?name=YM&background=14b8a6&color=fff',
      banner: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      status: 'Aktif',
    },
    {
      id: 17,
      name: 'Çevre Kulübü',
      about:
        'Çevre koruma, sürdürülebilirlik ve ekoloji üzerine projeler geliştiren sosyal sorumluluk topluluğu.',
      city: 'Kayseri',
      university: 'Erciyes Üniversitesi',
      memberCount: 98,
      socialMedia: 'https://instagram.com/cevrekulup',
      website: 'https://cevrekulup.org',
      email: 'cevre@unides.com',
      category: 'Sosyal',
      logo: 'https://ui-avatars.com/api/?name=CK&background=16a34a&color=fff',
      banner: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      status: 'Aktif',
    },
    {
      id: 18,
      name: 'Bisiklet Topluluğu',
      about:
        'Bisiklet turları, bakım eğitimleri ve şehir içi bisiklet kültürü üzerine etkinlikler düzenleyen spor topluluğu.',
      city: 'Mersin',
      university: 'Mersin Üniversitesi',
      memberCount: 76,
      socialMedia: 'https://instagram.com/bisiklettoplulugu',
      website: '',
      email: 'bisiklet@unides.com',
      category: 'Spor',
      logo: 'https://ui-avatars.com/api/?name=BT&background=eab308&color=fff',
      banner: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800',
      status: 'Aktif',
    },
  ];

  communities: Community[] = [];
  filteredCommunities: Community[] = [];

  // Duyurular API'den yüklenecek, mock data kaldırıldı
  announcements: Announcement[] = [];

  newAnnouncement: Partial<Announcement> = {
    title: '',
    shortDescription: '',
    content: '',
    image: '',
    link: '',
  };

  allEvents: EventRequest[] = [];
  selectedEvent: EventRequest | null = null;
  newEvent: Partial<EventRequest> | null = null;

  notifications = [
    { text: 'E-Spor topluluğu onay bekliyor', time: '10 dk önce' },
    { text: 'AI Zirvesi bütçe onayı istiyor', time: '1 saat önce' },
  ];

  // Router ve Service'leri inject ediyoruz
  constructor(
    private toastService: ToastService,
    private router: Router,
    private communityService: CommunityService,
    private announcementService: AnnouncementService,
    private eventService: EventService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // SSR sırasında HTTP istekleri yapma, sadece browser'da yap
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // CommunityService'ten toplulukları çek (communities-page ile aynı kaynak)
    this.loadCommunitiesFromService();
    // AnnouncementService'ten duyuruları çek (announcements-page ile aynı kaynak)
    this.loadAnnouncementsFromService();
    // Events'i backend'den çek
    this.loadEventsFromService();
  }

  loadCommunitiesFromService() {
    // Sadece browser'da çalıştığından emin ol
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.communityService.getAllCommunities().subscribe({
      next: (data) => {
        // CommunityService'ten gelen veriyi Corporate Dashboard formatına dönüştür
        this.allCommunities = data.map((c) => ({
          ...c,
          about: c.description || c.about || '',
          banner: c.coverImage || c.banner || '',
          coverImage: c.coverImage || c.banner || '', // Her iki alanı da tut
          description: c.description || c.about || '', // Her iki alanı da tut
          city: c.city || '', // city undefined ise boş string
          // Eğer status yoksa varsayılan olarak 'Aktif' yap
          status: c.status || 'Aktif',
        })) as Community[];

        this.communities = [...this.allCommunities];
        this.filteredCommunities = [...this.communities];
        this.initPagination();
        // Topluluk isimleri yüklendikten sonra etkinlikleri eşle
        this.attachCommunityNamesToEvents();
      },
      error: (err) => {
        console.error('Topluluklar yüklenemedi:', err);
        // Hata durumunda mock data kullan
        this.communities = [...this.allCommunities];
        this.filteredCommunities = [...this.communities];
        this.initPagination();
        this.attachCommunityNamesToEvents();
      },
    });
  }

  loadEventsFromService() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.eventService.getAll().subscribe({
      next: (data: EventItem[]) => {
        this.allEvents = data.map((e) => ({
          id: e.id,
          communityId: e.communityId,
          communityName: '',
          eventName: e.title,
          date: e.startDate || '',
          location: e.location || '',
          imageUrl: e.imageUrl || '',
          description: e.description || e.shortDescription || '',
          status: e.status || 'Beklemede',
          capacity: '',
        }));
        this.attachCommunityNamesToEvents();
      },
      error: (err) => {
        console.error('Etkinlikler yüklenemedi:', err);
      },
    });
  }

  attachCommunityNamesToEvents() {
    if (!this.allCommunities?.length || !this.allEvents?.length) return;
    this.allEvents = this.allEvents.map((ev) => {
      const found = this.allCommunities.find((c) => c.id === ev.communityId);
      return { ...ev, communityName: found?.name || ev.communityName };
    });
  }

  // Pagination metodları
  initPagination() {
    this.totalPages = Math.ceil(this.filteredCommunities.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedCommunities = this.filteredCommunities.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedData();
    }
  }

  // Arama ve filtreleme
  applyFilters() {
    let temp = [...this.communities];

    // Metin araması
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.city && c.city.toLowerCase().includes(term)) ||
          c.university.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term)
      );
    }

    // Durum filtresi
    if (this.statusFilter) {
      temp = temp.filter((c) => c.status === this.statusFilter);
    }

    this.filteredCommunities = temp;
    this.currentPage = 1;
    this.initPagination();
  }

  // Topluluk detay ve güncelleme
  openCommunityDetail(community: Community) {
    this.selectedCommunity = community;
    this.editingCommunity = { ...community };
    this.modalType = 'edit-community';
    this.isModalOpen = true;
  }

  // Yeni topluluk ekleme
  openNewCommunityModal() {
    this.newCommunity = {
      id: 0, // Yeni topluluk için 0, kaydedilirken otomatik ID atanacak
      name: '',
      about: '',
      city: '',
      university: '',
      memberCount: 0,
      website: '',
      email: '',
      category: this.categories[0] || 'Teknoloji',
      logo: '',
      banner: '',
      status: 'Aktif',
      presidentEmail: '', // Topluluk başkanının email adresi (zorunlu)
    } as Community & { presidentEmail?: string };
    this.modalType = 'new-community';
    this.isModalOpen = true;
  }

  saveCommunity() {
    if (this.editingCommunity) {
      // CommunityService'e kaydet (communities-page'e otomatik eklenir)
      const communityForService = {
        ...this.editingCommunity,
        description: this.editingCommunity.about || '',
        coverImage: this.editingCommunity.banner || '',
      };

      this.communityService.addOrUpdateCommunity(communityForService).subscribe({
        next: () => {
          // Service'ten güncel veriyi tekrar yükle
          this.loadCommunitiesFromService();
          this.showToast('Topluluk başarıyla güncellendi', 'success');
          this.closeModal();
        },
        error: (err) => {
          console.error('Topluluk güncellenirken hata:', err);
          console.error('Hata detayı:', err.error);
          let errorMessage = 'Topluluk güncellenirken bir hata oluştu';

          if (err.status === 401) {
            errorMessage = 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.';
          } else if (err.status === 403) {
            errorMessage = err.error?.message || 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (err.status === 500) {
            // Backend'den gelen hata mesajını göster
            const serverMessage = err.error?.message || err.error || 'Sunucu hatası oluştu.';
            errorMessage =
              typeof serverMessage === 'string'
                ? serverMessage
                : 'Sunucu hatası oluştu. Lütfen tekrar deneyin.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          }

          this.showToast(errorMessage, 'error');
        },
      });
    }
  }

  // Yeni topluluk kaydetme
  saveNewCommunity() {
    if (this.newCommunity) {
      // Validasyon
      if (!this.newCommunity.name || !this.newCommunity.university || !this.newCommunity.city) {
        this.showToast('Lütfen zorunlu alanları doldurun (İsim, Üniversite, Şehir)', 'error');
        return;
      }

      // PresidentEmail validasyonu
      const presidentEmail = (this.newCommunity as any).presidentEmail;
      if (!presidentEmail || !presidentEmail.trim()) {
        this.showToast('Lütfen topluluk başkanının email adresini girin', 'error');
        return;
      }

      // Email format validasyonu
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(presidentEmail.trim())) {
        this.showToast('Geçerli bir email adresi girin', 'error');
        return;
      }

      // CommunityService'e kaydet (communities-page'e otomatik eklenir)
      const communityForService = {
        ...this.newCommunity,
        id: 0, // Service otomatik ID atayacak
        description: this.newCommunity.about || this.newCommunity.description || '',
        coverImage: this.newCommunity.banner || '',
        presidentEmail: presidentEmail.trim(),
      } as Community & { presidentEmail?: string };

      this.communityService.addOrUpdateCommunity(communityForService).subscribe({
        next: () => {
          // Service'ten güncel veriyi tekrar yükle
          this.loadCommunitiesFromService();
          this.showToast('Topluluk başarıyla eklendi', 'success');
          this.closeModal();
          this.newCommunity = null;
        },
        error: (err) => {
          console.error('Topluluk eklenirken hata:', err);
          let errorMessage = 'Topluluk eklenirken bir hata oluştu';

          if (err.status === 401) {
            errorMessage = 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.';
          } else if (err.status === 403) {
            errorMessage = err.error?.message || 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          }

          this.showToast(errorMessage, 'error');
        },
      });
    }
  }

  deleteCommunity() {
    if (this.editingCommunity) {
      const communityId = this.editingCommunity.id;

      // Kullanıcıdan onay al
      if (!confirm('Bu topluluğu silmek istediğinizden emin misiniz?')) {
        return;
      }

      // CommunityService'ten sil (backend'e istek atılır)
      this.communityService.deleteCommunity(communityId).subscribe({
        next: () => {
          // Service'ten güncel veriyi tekrar yükle
          this.loadCommunitiesFromService();
          this.showToast('Topluluk başarıyla silindi', 'success');
          this.closeModal();
        },
        error: (err) => {
          console.error('Topluluk silinirken hata:', err);
          let errorMessage = 'Topluluk silinirken bir hata oluştu';

          if (err.status === 401) {
            errorMessage = 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.';
          } else if (err.status === 403) {
            errorMessage = err.error?.message || 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          }

          this.showToast(errorMessage, 'error');
        },
      });
    }
  }

  // Image upload handlers
  onLogoSelected(imageUrl: string) {
    if (this.editingCommunity) {
      this.editingCommunity.logo = imageUrl;
    }
  }

  onBannerSelected(imageUrl: string) {
    if (this.editingCommunity) {
      this.editingCommunity.banner = imageUrl;
    }
  }

  // Yeni topluluk için image upload handlers
  onNewLogoSelected(imageUrl: string) {
    if (this.newCommunity) {
      this.newCommunity.logo = imageUrl;
    }
  }

  onNewBannerSelected(imageUrl: string) {
    if (this.newCommunity) {
      this.newCommunity.banner = imageUrl;
    }
  }

  toggleCommunityStatus() {
    if (this.editingCommunity) {
      this.editingCommunity.status = this.editingCommunity.status === 'Aktif' ? 'Pasif' : 'Aktif';
    }
  }

  get pendingEvents() {
    return this.allEvents.filter((e) => e.status === 'Beklemede');
  }
  get pendingEventCount() {
    return this.pendingEvents.length;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  switchTab(tab: string) {
    this.activeTab = tab;
    this.isSidebarCollapsed = window.innerWidth < 768 ? true : this.isSidebarCollapsed;
  }
  toggleNotifications(e: Event) {
    e.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.isProfileOpen = false;
  }
  toggleProfileDropdown(e: Event) {
    e.stopPropagation();
    this.isProfileOpen = !this.isProfileOpen;
    this.showNotifications = false;
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.showNotifications = false;
    this.isProfileOpen = false;
  }

  logout() {
    this.showToast('Çıkış yapılıyor...', 'success');
    // Toast mesajının okunması için 1.5 saniye bekleyip anasayfaya yönlendiriyoruz
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 1500);
  }

  approveEvent(id: number) {
    const event = this.allEvents.find((e) => e.id === id);
    if (event) {
      event.status = 'Onaylandı';
      this.showToast('Etkinlik onaylandı', 'success');
    }
  }

  rejectEvent(id: number) {
    const event = this.allEvents.find((e) => e.id === id);
    if (event) {
      event.status = 'Reddedildi';
      this.showToast('Etkinlik reddedildi', 'error');
    }
  }

  openEventDetail(ev: EventRequest) {
    this.selectedEvent = ev;
    this.modalType = 'event-detail';
    this.isModalOpen = true;
  }

  openNewEventModal() {
    this.newEvent = {
      eventName: '',
      date: '',
      location: '',
      communityId: this.allCommunities[0]?.id || undefined,
      communityName: this.allCommunities[0]?.name || '',
      imageUrl: '',
      description: '',
      status: 'Beklemede',
      capacity: '',
    };
    this.modalType = 'new-event';
    this.isModalOpen = true;
  }

  saveNewEvent() {
    if (!this.newEvent?.eventName) {
      this.showToast('Etkinlik adı zorunlu', 'error');
      return;
    }
    const newItem: EventRequest = {
      id: Date.now(),
      eventName: this.newEvent.eventName,
      date: this.newEvent.date || '',
      location: this.newEvent.location || '',
      communityId: this.newEvent.communityId,
      communityName:
        this.allCommunities.find((c) => c.id === this.newEvent?.communityId)?.name ||
        this.newEvent.communityName ||
        '',
      imageUrl: this.newEvent.imageUrl || '',
      description: this.newEvent.description || '',
      status: this.newEvent.status || 'Beklemede',
      capacity: this.newEvent.capacity || '',
    };
    this.allEvents = [newItem, ...this.allEvents];
    this.showToast('Etkinlik eklendi (mock)', 'success');
    this.closeModal();
  }

  deleteEvent(id: number) {
    this.allEvents = this.allEvents.filter((e) => e.id !== id);
    this.showToast('Etkinlik silindi (mock)', 'success');
    this.closeModal();
  }

  openModal(type: string) {
    this.modalType = type;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingAnnouncement = null;
    this.selectedAnnouncement = null;
  }

  // Duyuru detay ve güncelleme
  openAnnouncementDetail(announcement: Announcement) {
    this.selectedAnnouncement = announcement;
    this.editingAnnouncement = { ...announcement };
    this.modalType = 'edit-announcement';
    this.isModalOpen = true;
  }

  saveAnnouncement() {
    // Validasyon
    if (!this.newAnnouncement.title || !this.newAnnouncement.title.trim()) {
      this.showToast('Lütfen duyuru başlığını giriniz', 'error');
      return;
    }

    // API'ye istek at
    // Swagger'a göre annDate ISO 8601 formatında olmalı: 2025-12-06T16:49:01.554Z
    this.announcementService
      .createAnnouncement({
        title: this.newAnnouncement.title.trim(),
        shortDescription: this.newAnnouncement.shortDescription?.trim(),
        content: this.newAnnouncement.content?.trim(),
        image: this.newAnnouncement.image?.trim(),
        link: this.newAnnouncement.link?.trim(),
        date: new Date().toISOString(), // ISO 8601 formatında tam tarih-saat
      })
      .subscribe({
        next: (announcementId) => {
          // Başarılı - Duyuruları yeniden yükle (announcements-page'e otomatik eklenir)
          this.loadAnnouncementsFromService();
          this.showToast('Duyuru başarıyla yayınlandı', 'success');

          // Formu temizle
          this.newAnnouncement = {
            title: '',
            shortDescription: '',
            content: '',
            image: '',
            link: '',
          };
          this.closeModal();
        },
        error: (error) => {
          console.error('Duyuru oluşturulurken hata:', error);
          console.error('Hata response:', error.error);

          // Daha detaylı hata mesajı
          let errorMessage = 'Duyuru oluşturulurken bir hata oluştu';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.status === 400) {
            errorMessage = 'Geçersiz veri gönderildi. Lütfen tüm alanları kontrol ediniz.';
          } else if (error.status === 401 || error.status === 403) {
            errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (error.status === 0) {
            errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
          }

          this.showToast(errorMessage, 'error');
        },
      });
  }

  // Duyuruları API'den yükle
  loadAnnouncementsFromService() {
    // Sadece browser'da çalıştığından emin ol
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.announcementService.getAllAnnouncements().subscribe({
      next: (data) => {
        this.announcements = data;
      },
      error: (err) => {
        console.error('Duyurular yüklenemedi:', err);
        // Hata durumunda boş liste kullan
        this.announcements = [];
      },
    });
  }

  updateAnnouncement() {
    if (!this.editingAnnouncement) {
      return;
    }

    // Validasyon
    if (!this.editingAnnouncement.title || !this.editingAnnouncement.title.trim()) {
      this.showToast('Lütfen duyuru başlığını giriniz', 'error');
      return;
    }

    const announcementId = this.editingAnnouncement.id;

    // API'ye istek at
    // Tarih formatını kontrol et - eğer ISO formatında değilse dönüştür
    let dateValue: string | undefined = undefined;
    if (this.editingAnnouncement.date) {
      // Eğer zaten ISO formatındaysa olduğu gibi kullan, değilse dönüştür
      try {
        const dateObj = new Date(this.editingAnnouncement.date);
        if (!isNaN(dateObj.getTime())) {
          dateValue = dateObj.toISOString();
        }
      } catch (e) {
        // Tarih parse edilemezse undefined gönder
        dateValue = undefined;
      }
    }

    this.announcementService
      .updateAnnouncement(announcementId, {
        title: this.editingAnnouncement.title,
        shortDescription: this.editingAnnouncement.shortDescription,
        content: this.editingAnnouncement.content,
        image: this.editingAnnouncement.image,
        link: this.editingAnnouncement.link,
        date: dateValue, // ISO formatında veya undefined
      })
      .subscribe({
        next: () => {
          // Başarılı - Duyuruları yeniden yükle (announcements-page'e otomatik güncellenir)
          this.loadAnnouncementsFromService();
          this.showToast('Duyuru başarıyla güncellendi', 'success');
          this.closeModal();
        },
        error: (error) => {
          console.error('Duyuru güncellenirken hata:', error);

          // Daha detaylı hata mesajı
          let errorMessage = 'Duyuru güncellenirken bir hata oluştu';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.status === 400) {
            errorMessage = 'Geçersiz veri gönderildi. Lütfen tüm alanları kontrol ediniz.';
          } else if (error.status === 401 || error.status === 403) {
            errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (error.status === 404) {
            errorMessage = 'Duyuru bulunamadı.';
          } else if (error.status === 0) {
            errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
          }

          this.showToast(errorMessage, 'error');
        },
      });
  }

  deleteAnnouncement() {
    if (!this.editingAnnouncement) {
      return;
    }

    // Onay iste
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    const announcementId = this.editingAnnouncement.id;

    // API'ye istek at
    this.announcementService.deleteAnnouncement(announcementId).subscribe({
      next: () => {
        // Başarılı - Duyuruları yeniden yükle (announcements-page'den de kaldırılır)
        this.loadAnnouncementsFromService();
        this.showToast('Duyuru başarıyla silindi', 'success');
        this.closeModal();
      },
      error: (error) => {
        console.error('Duyuru silinirken hata:', error);

        // Daha detaylı hata mesajı
        let errorMessage = 'Duyuru silinirken bir hata oluştu';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.status === 401 || error.status === 403) {
          errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
        } else if (error.status === 404) {
          errorMessage = 'Duyuru bulunamadı.';
        } else if (error.status === 0) {
          errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
        }

        this.showToast(errorMessage, 'error');
      },
    });
  }

  onAnnouncementImageSelected(imageUrl: string) {
    if (this.editingAnnouncement) {
      this.editingAnnouncement.image = imageUrl;
    }
  }

  onNewAnnouncementImageSelected(imageUrl: string) {
    this.newAnnouncement.image = imageUrl;
  }

  // Dosya yükleme handler'ları (backend'e upload için)
  onNewAnnouncementFileSelected(file: File) {
    this.uploadAnnouncementImage(file, (imagePath: string) => {
      this.newAnnouncement.image = imagePath;
    });
  }

  onAnnouncementFileSelected(file: File) {
    this.uploadAnnouncementImage(file, (imagePath: string) => {
      if (this.editingAnnouncement) {
        this.editingAnnouncement.image = imagePath;
      }
    });
  }

  private uploadAnnouncementImage(file: File, callback: (imagePath: string) => void) {
    this.announcementService.uploadImage(file).subscribe({
      next: (imagePath) => {
        callback(imagePath);
        this.showToast('Görsel başarıyla yüklendi', 'success');
      },
      error: (err) => {
        console.error('Görsel yüklenirken hata:', err);
        const errorMessage =
          err.error?.message || err.message || 'Görsel yüklenirken bir hata oluştu';
        this.showToast(errorMessage, 'error');
      },
    });
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.toastService.show(msg, type);
  }

  getTabTitle() {
    switch (this.activeTab) {
      case 'overview':
        return 'Genel Bakış';
      case 'communities':
        return 'Topluluk Yönetimi';
      case 'events':
        return 'Etkinlik Takvimi';
      case 'announcements':
        return 'Duyurular';
      // Mesajlar case'i silindi
      case 'settings':
        return 'Ayarlar';
      default:
        return '';
    }
  }
}
