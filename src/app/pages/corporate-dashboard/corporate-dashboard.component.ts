import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ImageUploadComponent } from '../../components/ui/image-upload/image-upload';
import { CommunityService, Community } from '../../services/community.services';
import { AnnouncementService } from '../../services/announcement.services';
import { EventService, EventItem } from '../../services/event.services';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { AfkDetectionService } from '../../services/afk-detection.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

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
// Community interface artık model dosyasından import ediliyor
// Eski interface kaldırıldı - yeni model kullanılıyor (id: string)
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
  communityId?: number | string; // Hem number (eski) hem string (Guid) destekle
  communityName: string;
  eventName: string;
  date: string;
  startDate?: string; // ISO formatında başlangıç tarihi
  endDate?: string; // ISO formatında bitiş tarihi
  location: string;
  imageUrl?: string;
  description?: string;
  shortDescription?: string; // Kısa açıklama
  status: 'Onaylandı' | 'Beklemede' | 'Reddedildi' | 'Revize';
  capacity?: string;
  rejectionReason?: string;
  city?: string; // Şehir bilgisi
}

interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
  targetTab?: string; // 'overview', 'communities', 'events', 'announcements', 'settings'
  targetRoute?: string; // '/some-route/id'
  type?: 'community' | 'event' | 'announcement' | 'other';
  action?: 'communities' | 'events' | 'announcements' | 'overview';
}

@Component({
  selector: 'app-corporate-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, ImageUploadComponent],
  templateUrl: './corporate-dashboard.component.html',
  styleUrls: ['./corporate-dashboard.component.scss'],
})
export class CorporateDashboardComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  activeTab = 'overview';
  showNotifications = false;
  isProfileOpen = false;
  isModalOpen = false;
  modalType: string | null = '';
  searchText = '';
  statusFilter: string = ''; // Aktif/Pasif filtre
  cityFilter: string = ''; // Şehir filtresi
  announcementSearchText = ''; // Duyuru arama metni
  eventSearchText = ''; // Etkinlik arama metni
  eventStatusFilter: string = ''; // Etkinlik durum filtresi
  filteredEvents: EventRequest[] = []; // Filtrelenmiş etkinlikler
  inspectedEvents: Set<number> = new Set();
  checkingSpamEvents: Set<number> = new Set(); // Spam kontrolü yapılan event'ler

  // Loading states
  isLoadingCommunities = false;
  isLoadingEvents = false;
  isLoadingAnnouncements = false;
  isLoadingOverview = false;
  isSavingCommunity = false; // Topluluk kaydetme loading state
  isSavingEvent = false; // Etkinlik kaydetme loading state
  isSavingAnnouncement = false; // Duyuru kaydetme loading state
  spamResults: Map<
    number,
    {
      clean: boolean;
      message: string;
      status?: string;
      reason?: string;
      analysis?: any;
      highlighted?: any;
      forbidden?: { count: number; words: string[] };
      spam?: { count: number; keywords: string[] };
      politics?: { count: number; keywords: string[] };
    }
  > = new Map();
  forbiddenWords: string[] = ['yasak', 'illegal', 'spam', 'kötü', 'bahis', 'kumar'];

  // Confirmation modal için
  isConfirmModalOpen = false;
  confirmMessage = '';
  confirmCallback: (() => void) | null = null;

  openConfirmModal(message: string, callback: () => void) {
    this.confirmMessage = message;
    this.confirmCallback = callback;
    this.isConfirmModalOpen = true;
  }

  closeConfirmModal() {
    this.isConfirmModalOpen = false;
    this.confirmCallback = null;
    this.confirmMessage = '';
  }

  onConfirmYes() {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.closeConfirmModal();
  }

  // Pagination için değişkenler
  currentPage = 1;
  itemsPerPage = 15;
  totalPages = 0;
  pages: number[] = [];
  displayedCommunities: Community[] = [];

  // Topluluk düzenleme için
  selectedCommunity: Community | null = null;
  editingCommunity: (Community & { presidentEmail?: string; shortDescription?: string }) | null =
    null;
  newCommunity: (Community & { presidentEmail?: string; shortDescription?: string }) | null = null;

  // Duyuru düzenleme için
  selectedAnnouncement: Announcement | null = null;
  editingAnnouncement: Announcement | null = null;

  corporateInfo = {
    name: 'UNIDES Kurumsal',
    logo: 'https://ui-avatars.com/api/?name=UNIDES&background=14d2cc&color=fff&size=128',
    email: 'admin@unides.com',
    username: 'unides_admin',
  };

  // stats dizisi ve ilgili HTML kullanımı kaldırıldı

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

  cities: string[] = [
    'Adana',
    'Adıyaman',
    'Afyonkarahisar',
    'Ağrı',
    'Amasya',
    'Ankara',
    'Antalya',
    'Artvin',
    'Aydın',
    'Balıkesir',
    'Bilecik',
    'Bingöl',
    'Bitlis',
    'Bolu',
    'Burdur',
    'Bursa',
    'Çanakkale',
    'Çankırı',
    'Çorum',
    'Denizli',
    'Diyarbakır',
    'Edirne',
    'Elazığ',
    'Erzincan',
    'Erzurum',
    'Eskişehir',
    'Gaziantep',
    'Giresun',
    'Gümüşhane',
    'Hakkari',
    'Hatay',
    'Isparta',
    'Mersin',
    'İstanbul',
    'İzmir',
    'Kars',
    'Kastamonu',
    'Kayseri',
    'Kırklareli',
    'Kırşehir',
    'Kocaeli',
    'Konya',
    'Kütahya',
    'Malatya',
    'Manisa',
    'Kahramanmaraş',
    'Mardin',
    'Muğla',
    'Muş',
    'Nevşehir',
    'Niğde',
    'Ordu',
    'Rize',
    'Sakarya',
    'Samsun',
    'Siirt',
    'Sinop',
    'Sivas',
    'Tekirdağ',
    'Tokat',
    'Trabzon',
    'Tunceli',
    'Şanlıurfa',
    'Uşak',
    'Van',
    'Yozgat',
    'Zonguldak',
    'Aksaray',
    'Bayburt',
    'Karaman',
    'Kırıkkale',
    'Batman',
    'Şırnak',
    'Bartın',
    'Ardahan',
    'Iğdır',
    'Yalova',
    'Karabük',
    'Kilis',
    'Osmaniye',
    'Düzce',
  ].sort();

  allCommunities: Community[] = [];

  communities: Community[] = [];
  filteredCommunities: Community[] = [];

  announcements: Announcement[] = [];
  filteredAnnouncements: Announcement[] = [];

  newAnnouncement: Partial<Announcement> = {
    title: '',
    shortDescription: '',
    content: '',
    image: '',
    link: '',
  };

  // Bekleyen görsel dosyaları - duyuru ID alındıktan sonra yüklenecek
  pendingNewAnnouncementImage: File | null = null;
  pendingEditAnnouncementImage: File | null = null;

  allEvents: EventRequest[] = [];
  selectedEvent: EventRequest | null = null;
  eventToReject: EventRequest | null = null;
  rejectionReason = '';
  newEvent: Partial<EventRequest> | null = null;

  notifications: Notification[] = [
    {
      id: 1,
      text: 'E-Spor topluluğu onay bekliyor',
      time: '10 dk önce',
      read: false,
      targetTab: 'communities',
    },
    {
      id: 2,
      text: 'AI Zirvesi bütçe onayı istiyor',
      time: '1 saat önce',
      read: false,
      targetTab: 'events',
    },
  ];

  // Router ve Service'leri inject ediyoruz
  constructor(
    private toastService: ToastService,
    private router: Router,
    private communityService: CommunityService,
    private announcementService: AnnouncementService,
    private eventService: EventService,
    private http: HttpClient,
    private afkDetectionService: AfkDetectionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    // SSR sırasında HTTP istekleri yapma, sadece browser'da yap
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // AFK Detection'ı başlat
    this.afkDetectionService.start();

    // LocalStorage'dan kullanıcı bilgilerini çek
    this.loadCorporateInfoFromStorage();

    // Query parametrelerini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const statusParam = urlParams.get('status');

    if (tabParam) {
      this.switchTab(tabParam);
    }

    if (statusParam) {
      this.statusFilter = statusParam;
      // Query parametresinden gelen status filtresine göre toplulukları yükle
      this.loadCommunitiesFromService(this.statusFilter);
    } else {
      // İlk yüklemede filtresiz (Tüm Durumlar) tüm toplulukları getir
      this.loadCommunitiesFromService('');
    }
    // Overview için loading state'i başlat
    this.isLoadingOverview = true;

    // AnnouncementService'ten duyuruları çek (announcements-page ile aynı kaynak)
    this.loadAnnouncementsFromService();
    // Events'i backend'den çek
    this.loadEventsFromService();

    // Overview loading state'ini kontrol et (tüm veriler yüklendikten sonra)
    // Her load metodu kendi loading state'ini yönetiyor, overview için ayrı kontrol gerekli
  }

  // LocalStorage'dan kurumsal kullanıcı bilgilerini yükle
  loadCorporateInfoFromStorage() {
    try {
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        this.corporateInfo.name = userInfo.name || 'UNIDES Kurumsal';
        this.corporateInfo.email = userInfo.email || 'admin@unides.com';
        this.corporateInfo.username = userInfo.email?.split('@')[0] || 'unides_admin';
        // Logo için ilk harfleri kullan
        if (userInfo.name) {
          const initials = userInfo.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
          this.corporateInfo.logo = `https://ui-avatars.com/api/?name=${initials}&background=14d2cc&color=fff&size=128`;
        }
      }
    } catch (error) {
      console.error('Corporate info yüklenirken hata:', error);
    }
  }

  loadCommunitiesFromService(statusFilter?: string) {
    // Sadece browser'da çalıştığından emin ol
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Loading state'i başlat
    this.isLoadingCommunities = true;

    // Dropdown'dan gelen filtreye göre backend'den toplulukları çağır
    // statusFilter: '' (Tüm Durumlar) -> 'all', 'Aktif' -> 'active', 'Pasif' -> 'passive'
    let backendStatus: 'all' | 'active' | 'aktif' | 'passive' | 'pasif' | undefined = 'all';

    if (statusFilter === 'Aktif') {
      backendStatus = 'active';
    } else if (statusFilter === 'Pasif') {
      backendStatus = 'passive';
    } else if (!statusFilter || statusFilter === '') {
      // Tüm Durumlar seçildiğinde veya filtre yoksa tüm toplulukları getir
      backendStatus = 'all';
    }
    // "Onay Bekleyen" durumu için backend'de status yok, bu durumda frontend'de filtreleme yapılacak

    // Corporate Dashboard'da seçilen filtreye göre toplulukları göster
    // Backend'de status parametresi ile istek atıyoruz
    // Not: 'all' ve 'passive' sadece GSB (RolId 2) yetkisi olan kullanıcılar için çalışır
    this.communityService.getAllCommunities({ status: backendStatus }).subscribe({
      next: (data) => {
        // CommunityService'ten gelen veriyi Corporate Dashboard formatına dönüştür
        // EXCLUSION: Website URL and Social Media Links are NOT displayed in Corporate Dashboard
        // Category is INCLUDED and will be shown with dropdown
        this.allCommunities = data.map((c) => {
          const { website, webSiteUrl, instagram, instagramUrl, socialMedia, ...rest } = c;
          // Backend'den gelen isActivity değerini direkt kullan (zaten doğru map edilmiş)
          // CommunityService.mapMiniDtoToCommunity içinde dto.isActivity doğru map ediliyor
          const isActivity = c.isActivity !== undefined ? c.isActivity : true;
          return {
            ...rest,
            about: c.description || c.about || '',
            banner: c.coverImage || c.banner || '',
            coverImage: c.coverImage || c.banner || '', // Her iki alanı da tut
            description: c.description || c.about || '', // Her iki alanı da tut
            city: c.city || '', // city undefined ise boş string
            category: c.category || 'Genel', // Category is included
            // Backend'den gelen email/comMail'i email'e map et
            email: c.email || c.comMail || '',
            comMail: c.comMail || c.email || '', // comMail'i de koru
            // Backend'den gelen miniAbout'u shortDescription'a map et
            miniAbout: c.miniAbout || '',
            shortDescription: c.miniAbout || (c as any).shortDescription || '',
            // Backend'den gelen isActivity değerini status'a çevir
            // CommunityService içinde zaten dto.isActivity doğru map ediliyor
            status: c.status || (isActivity ? 'Aktif' : 'Pasif'),
            isActivity: isActivity, // isActivity alanını da koru
            // Explicitly exclude these fields for Corporate Dashboard
            website: undefined,
            webSiteUrl: undefined,
            instagram: undefined,
            instagramUrl: undefined,
            socialMedia: undefined,
          } as Community;
        });

        // Extract unique categories from communities for dropdown
        const uniqueCategories = [
          ...new Set(
            this.allCommunities
              .map((c) => c.category)
              .filter((cat): cat is string => !!cat && cat !== 'Genel')
          ),
        ].sort();
        // Merge with existing categories, avoiding duplicates
        this.categories = [...new Set([...this.categories, ...uniqueCategories, 'Genel'])].sort();

        this.communities = [...this.allCommunities];
        // Filtreleri uygula (arama metni varsa ona göre filtreleme yapılacak)
        this.applyFilters();
        // Topluluk isimleri yüklendikten sonra etkinlikleri eşle
        this.attachCommunityNamesToEvents();
        // Loading state'i bitir
        this.isLoadingCommunities = false;
      },
      error: (err) => {
        // Eğer 403 hatası alırsak (GSB yetkisi yoksa), kullanıcıya uyarı göster ve aktif toplulukları göster
        if (err.status === 403) {
          this.showToast(
            'Pasif toplulukları görüntülemek için GSB yetkisi gereklidir. Şu anda sadece aktif topluluklar gösteriliyor.',
            'error'
          );
          this.communityService.getAllCommunities({ status: 'active' }).subscribe({
            next: (data) => {
              this.allCommunities = data.map((c) => {
                const { website, webSiteUrl, instagram, instagramUrl, socialMedia, ...rest } = c;
                const isActivity =
                  rest.isActivity !== undefined
                    ? rest.isActivity
                    : c.isActivity !== undefined
                      ? c.isActivity
                      : true;
                return {
                  ...rest,
                  about: c.description || c.about || '',
                  banner: c.coverImage || c.banner || '',
                  coverImage: c.coverImage || c.banner || '',
                  description: c.description || c.about || '',
                  city: c.city || '',
                  category: c.category || 'Genel',
                  email: c.email || c.comMail || '',
                  comMail: c.comMail || c.email || '',
                  miniAbout: c.miniAbout || '',
                  shortDescription: c.miniAbout || (c as any).shortDescription || '',
                  status: isActivity ? 'Aktif' : 'Pasif',
                  isActivity: isActivity,
                  website: undefined,
                  webSiteUrl: undefined,
                  instagram: undefined,
                  instagramUrl: undefined,
                  socialMedia: undefined,
                } as Community;
              });
              this.communities = [...this.allCommunities];
              // Filtreleri uygula
              this.applyFilters();
              this.attachCommunityNamesToEvents();
              this.isLoadingCommunities = false;
            },
            error: () => {
              this.communities = [...this.allCommunities];
              // Filtreleri uygula
              this.applyFilters();
              this.attachCommunityNamesToEvents();
              this.isLoadingCommunities = false;
            },
          });
        } else {
          // Diğer hatalar için mevcut veriyi kullan
          this.communities = [...this.allCommunities];
          // Filtreleri uygula
          this.applyFilters();
          this.attachCommunityNamesToEvents();
        }
        this.isLoadingCommunities = false;
      },
    });
  }

  // Üniversite kısaltması için yardımcı metod
  getUniversityAbbr(uniName: string): string {
    if (!uniName) return '';
    const lower = uniName.toLowerCase();
    if (lower.includes('istanbul teknik')) return 'İTÜ';
    if (lower.includes('yıldız teknik')) return 'YTÜ';
    if (lower.includes('orta doğu teknik')) return 'ODTÜ';
    if (lower.includes('boğaziçi')) return 'BOUN';
    if (lower.includes('hacettepe')) return 'HACETTEPE';
    if (lower.includes('ege')) return 'EGE';
    if (lower.includes('marmara')) return 'MARMARA';
    if (lower.includes('koç')) return 'KOÇ';
    if (lower.includes('sabancı')) return 'SABANCI';
    if (lower.includes('bilkent')) return 'BİLKENT';

    // Eğer bilinen bir kısaltma değilse ve "Üniversitesi" içeriyorsa, onu atıp kalanı döndür
    if (lower.includes('üniversitesi')) {
      return uniName
        .replace(/Üniversitesi/i, '')
        .trim()
        .toUpperCase();
    }

    return uniName.split(' ')[0].toUpperCase();
  }

  loadEventsFromService() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Loading state'i başlat
    this.isLoadingEvents = true;

    // Filtreye göre backend'den etkinlikleri çek
    let statusNumbers: number[] = [];

    if (this.eventStatusFilter === 'Onaylandı') {
      statusNumbers = [1]; // Onaylandı
    } else if (this.eventStatusFilter === 'Beklemede') {
      statusNumbers = [0]; // Beklemede
    } else if (this.eventStatusFilter === 'Reddedildi' || this.eventStatusFilter === 'Revize') {
      statusNumbers = [2]; // Reddedildi / Revize
    } else {
      // Tümü veya boş -> tüm status'leri çek
      statusNumbers = [0, 1, 2];
    }

    // Backend'den status'e göre etkinlikleri çek
    this.eventService.getByStatus(statusNumbers).subscribe({
      next: (data: EventItem[]) => {
        // Backend'den gelen etkinlikleri map et
        // EventService zaten EventConfirm (0,1,2) değerlerini 'Beklemede', 'Onaylandı', 'Reddedildi' olarak map ediyor
        if (!data || data.length === 0) {
          this.allEvents = [];
        } else {
          this.allEvents = data.map((e) => {
            // Community name'i bulmak için communities listesini kullan
            const community = this.allCommunities.find(
              (c) => String(c.id) === String(e.communityId)
            );

            return {
              id: e.id,
              communityId: e.communityId,
              communityName: community?.name || e.communityName || '',
              eventName: e.title,
              date: e.startDate || '',
              startDate: e.startDate,
              endDate: e.endDate,
              location: e.location || '',
              imageUrl: e.imageUrl || '',
              description: e.description || '',
              shortDescription: e.shortDescription || '',
              // EventService'ten gelen status değeri zaten doğru format: 'Beklemede', 'Onaylandı', 'Reddedildi'
              status: e.status || 'Beklemede',
              capacity: e.capacity || '',
              city: e.city || community?.city || '',
            };
          });
        }

        // Topluluk isimlerini eşleştir
        if (this.allCommunities?.length > 0) {
          this.attachCommunityNamesToEvents();
        }

        // Etkinlik filtrelerini uygula (metin araması için)
        // filterEvents() metodu filteredEvents'i güncelliyor
        this.filterEvents();
        // Loading state'i bitir
        this.isLoadingEvents = false;
      },
      error: (err) => {
        // Hata durumunda getAll() metodunu fallback olarak kullan
        this.eventService.getAll().subscribe({
          next: (data: EventItem[]) => {
            this.allEvents = data.map((e) => {
              const community = this.allCommunities.find(
                (c) => String(c.id) === String(e.communityId)
              );
              return {
                id: e.id,
                communityId: e.communityId,
                communityName: community?.name || e.communityName || '',
                eventName: e.title,
                date: e.startDate || '',
                startDate: e.startDate,
                endDate: e.endDate,
                location: e.location || '',
                imageUrl: e.imageUrl || '',
                description: e.description || '',
                shortDescription: e.shortDescription || '',
                status: e.status || 'Beklemede',
                capacity: e.capacity || '',
                city: e.city || community?.city || '',
              };
            });

            // Topluluk isimlerini eşleştir
            if (this.allCommunities?.length > 0) {
              this.attachCommunityNamesToEvents();
            }
            this.filterEvents();
            this.isLoadingEvents = false;
          },
          error: () => {
            // Hata durumunda boş liste
            this.allEvents = [];
            this.filteredEvents = [];
            this.isLoadingEvents = false;
          },
        });
      },
    });
  }


  attachCommunityNamesToEvents() {
    if (!this.allCommunities?.length || !this.allEvents?.length) return;
    this.allEvents = this.allEvents.map((ev) => {
      // Community id string (Guid), EventItem communityId number - String'e çevirip karşılaştır
      const found = this.allCommunities.find((c) => String(c.id) === String(ev.communityId));
      if (found) {
        return {
          ...ev,
          communityName: found.name || ev.communityName || '',
          city: ev.city || found.city || '',
        };
      }
      return ev;
    });
    // Topluluk isimleri eşleştirildikten sonra filtreleri tekrar uygula
    this.filterEvents();
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

  // Dropdown değiştiğinde backend'den toplulukları çağır
  onStatusFilterChange() {
    // "Tüm Durumlar", "Aktif", "Pasif" için backend'den yeni veri çek
    this.loadCommunitiesFromService(this.statusFilter);
  }

  // Arama ve filtreleme
  applyFilters() {
    let temp = [...this.communities];

    // Metin araması - isim, şehir, üniversite, kategori, email
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      temp = temp.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(term)) ||
          (c.city && c.city.toLowerCase().includes(term)) ||
          (c.university && c.university.toLowerCase().includes(term)) ||
          (c.category && c.category.toLowerCase().includes(term)) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.comMail && c.comMail.toLowerCase().includes(term)) ||
          (c.about && c.about.toLowerCase().includes(term)) ||
          (c.description && c.description.toLowerCase().includes(term)) ||
          (c.miniAbout && c.miniAbout.toLowerCase().includes(term))
      );
    }

    // Şehir filtresi
    if (this.cityFilter) {
      temp = temp.filter((c) => c.city && c.city === this.cityFilter);
    }

    // Durum filtresi - Backend'den zaten filtrelenmiş geliyor ama double-check için
    // Frontend'de de "Onay Bekleyen" gibi özel durumlar için filtreleme yapılabilir
    // Şu an backend'den 'all', 'active', 'passive' parametreleri ile geldiği için
    // burada sadece metin/şehir filtresi uygulanıyor

    this.filteredCommunities = temp;
    this.currentPage = 1;
    this.initPagination();
  }

  // Duyuru filtreleme
  filterAnnouncements() {
    if (!this.announcementSearchText.trim()) {
      this.filteredAnnouncements = [...this.announcements];
      return;
    }

    const term = this.announcementSearchText.toLowerCase();
    this.filteredAnnouncements = this.announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        a.shortDescription.toLowerCase().includes(term) ||
        (a.content && a.content.toLowerCase().includes(term))
    );
  }

  // Etkinlik filtreleme
  // Not: Durum filtresi artık backend'de yapılıyor (/api/Events/status endpoint'i ile)
  // Burada sadece metin araması yapılıyor
  filterEvents() {
    let temp = [...this.allEvents];

    // Status filtresi (Revize butonu için Reddedildi status'ünü göster)
    if (this.eventStatusFilter === 'Revize') {
      temp = temp.filter((e) => e.status === 'Reddedildi' || e.status === 'Revize');
    } else if (this.eventStatusFilter) {
      temp = temp.filter((e) => e.status === this.eventStatusFilter);
    }

    // Metin araması
    if (this.eventSearchText.trim()) {
      const term = this.eventSearchText.toLowerCase();
      temp = temp.filter(
        (e) =>
          (e.eventName && e.eventName.toLowerCase().includes(term)) ||
          (e.communityName && e.communityName.toLowerCase().includes(term)) ||
          (e.description && e.description.toLowerCase().includes(term)) ||
          (e.location && e.location.toLowerCase().includes(term)) ||
          (e.shortDescription && e.shortDescription.toLowerCase().includes(term))
      );
    }

    this.filteredEvents = temp;
  }

  // Etkinlik durum filtresi ayarla
  setEventStatusFilter(status: string) {
    this.eventStatusFilter = status;
    // Backend'den filtreye göre etkinlikleri çek
    this.loadEventsFromService();
  }

  // Topluluklar sayfasına onay bekleyen filtresiyle yönlendir
  goToCommunitiesWithPendingFilter() {
    this.router.navigate(['/corporate-dashboard'], {
      queryParams: { tab: 'communities', status: 'Onay Bekliyor' },
    });
    this.switchTab('communities');
    this.statusFilter = 'Onay Bekliyor';
    this.applyFilters();
  }

  // Topluluk detay ve güncelleme
  openCommunityDetail(community: Community) {
    this.selectedCommunity = community;

    // ÖNEMLİ: Backend'deki GET /api/Communities/{id} endpoint'i
    // SADECE AKTİF toplulukları (IsActivity = true) döndürüyor.
    // Pasif topluluklar için 404 hatası veriyor (CommunitiesController.cs satır 178).
    // 
    // Kurumsal Dashboard'da hem aktif hem pasif toplulukların detayını görmek için
    // backend'den gelen List verisini kullanıyoruz (zaten tüm veriyi çekmişiz).
    // List endpoint'i (GET /api/Communities?status=all) GSB için tüm toplulukları döndürüyor.
    
    // Mevcut listedeki (backend'den çekilmiş) veriyi kullan
    this.editingCommunity = {
      ...community,
      // Backend'den gelen tüm alanları kullan
      about: community.description || community.about || '',
      email: community.email || (community as any).comMail || '',
      presidentEmail: (community as any).comLeadMail || (community as any).presidentEmail || '',
      shortDescription: community.miniAbout || (community as any).shortDescription || '',
      miniAbout: community.miniAbout || (community as any).shortDescription || '',
      banner: community.coverImage || community.banner || '',
      coverImage: community.coverImage || community.banner || '',
      description: community.description || community.about || '',
      city: community.city || '',
      category: community.category || 'Genel',
      status:
        community.isActivity !== undefined
          ? community.isActivity
            ? 'Aktif'
            : 'Pasif'
          : community.status || 'Aktif',
      isActivity:
        community.isActivity !== undefined
          ? community.isActivity
          : community.status === 'Aktif',
    } as Community & { presidentEmail?: string; shortDescription?: string };
    
    this.modalType = 'edit-community';
    this.isModalOpen = true;
  }

  // Yeni topluluk ekleme
  openNewCommunityModal() {
    this.newCommunity = {
      id: '', // Yeni topluluk için boş string, kaydedilirken otomatik Guid atanacak
      name: '',
      about: '',
      shortDescription: '', // Kısa açıklama alanı
      city: '',
      university: '',
      website: '',
      email: '',
      category: '', // İlk açıldığında boş, "Kategori Seçin" seçeneğinde olsun
      logo: '',
      banner: '',
      status: 'Aktif',
      presidentEmail: '', // Topluluk başkanının email adresi (zorunlu)
    } as Community & { presidentEmail?: string; shortDescription?: string };
    this.modalType = 'new-community';
    this.isModalOpen = true;
  }

  saveCommunity() {
    if (this.editingCommunity) {
      // Çift tıklama engelle
      if (this.isSavingCommunity) {
        return;
      }

      // ID kontrolü - geçerli bir GUID olmalı
      if (!this.editingCommunity.id || this.editingCommunity.id === '' || this.editingCommunity.id.includes('mock')) {
        this.showToast('Topluluk ID\'si geçersiz. Lütfen sayfayı yenileyip tekrar deneyin.', 'error');
        return;
      }

      // PresidentEmail validasyonu - sadece @edu.tr kabul edilir
      const presidentEmail = (this.editingCommunity as any).presidentEmail || this.editingCommunity.comLeadMail || '';
      if (!presidentEmail || !presidentEmail.trim()) {
        this.showToast('Lütfen topluluk başkanının email adresini girin', 'error');
        return;
      }

      // Topluluk Başkanı e-posta validasyonu - sadece @edu.tr kabul edilir
      if (!presidentEmail.trim().toLowerCase().endsWith('@edu.tr')) {
        this.showToast('Topluluk başkanı e-posta adresi @edu.tr ile bitmelidir', 'error');
        return;
      }

      // Email format validasyonu (başkan e-postası)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(presidentEmail.trim())) {
        this.showToast('Geçerli bir başkan e-posta adresi girin', 'error');
        return;
      }

      // Loading state başlat
      this.isSavingCommunity = true;

      // CommunityService'e kaydet (communities-page'e otomatik eklenir)
      const communityForService = {
        ...this.editingCommunity,
        id: this.editingCommunity.id, // ID'yi açıkça ekle
        about: this.editingCommunity.about || this.editingCommunity.description || '', // Detaylı açıklama (backend ComAbout)
        description: this.editingCommunity.about || this.editingCommunity.description || '', // description da about'a eşit
        miniAbout: this.editingCommunity.miniAbout || (this.editingCommunity as any).shortDescription || '', // Kısa açıklama (backend MiniAbout)
        coverImage: this.editingCommunity.banner || this.editingCommunity.coverImage || '',
        banner: this.editingCommunity.banner || this.editingCommunity.coverImage || '',
        presidentEmail: (this.editingCommunity as any).presidentEmail || this.editingCommunity.comLeadMail || '', // Başkan e-postası (backend ComLeadMail)
        // Status alanını açıkça ekle (butonlardan gelen değer)
        status: this.editingCommunity.status || 'Aktif',
        // isActivity değerini status'a göre güncelle (status öncelikli)
        isActivity:
          this.editingCommunity.status === 'Pasif'
            ? false
            : this.editingCommunity.status === 'Aktif'
              ? true
              : undefined,
      };

      this.communityService.addOrUpdateCommunity(communityForService).subscribe({
        next: (updatedCommunity) => {
          // Güncellenmiş topluluğu direkt listeye ekle/güncelle
          const index = this.allCommunities.findIndex((c) => c.id === updatedCommunity.id);
          if (index !== -1) {
            // Mevcut topluluğu güncelle
            const { website, webSiteUrl, instagram, instagramUrl, socialMedia, ...rest } =
              updatedCommunity;
            this.allCommunities[index] = {
              ...rest,
              about: updatedCommunity.description || updatedCommunity.about || '',
              banner: updatedCommunity.coverImage || updatedCommunity.banner || '',
              coverImage: updatedCommunity.coverImage || updatedCommunity.banner || '',
              description: updatedCommunity.description || updatedCommunity.about || '',
              city: updatedCommunity.city || '',
              category: updatedCommunity.category || 'Genel',
              email: updatedCommunity.email || updatedCommunity.comMail || '',
              comMail: updatedCommunity.comMail || updatedCommunity.email || '',
              miniAbout: updatedCommunity.miniAbout || '',
              shortDescription: updatedCommunity.miniAbout || (updatedCommunity as any).shortDescription || '',
              status:
                updatedCommunity.isActivity !== undefined
                  ? updatedCommunity.isActivity
                    ? 'Aktif'
                    : 'Pasif'
                  : updatedCommunity.status || 'Aktif',
              isActivity:
                updatedCommunity.isActivity !== undefined
                  ? updatedCommunity.isActivity
                  : updatedCommunity.status === 'Aktif',
              website: undefined,
              webSiteUrl: undefined,
              instagram: undefined,
              instagramUrl: undefined,
              socialMedia: undefined,
            } as Community;

            // Filtered communities'i de güncelle
            const filteredIndex = this.filteredCommunities.findIndex(
              (c) => c.id === updatedCommunity.id
            );
            if (filteredIndex !== -1) {
              this.filteredCommunities[filteredIndex] = { ...this.allCommunities[index] };
            }

            // Communities listesini de güncelle
            const communitiesIndex = this.communities.findIndex(
              (c) => c.id === updatedCommunity.id
            );
            if (communitiesIndex !== -1) {
              this.communities[communitiesIndex] = { ...this.allCommunities[index] };
            }
          } else {
            // Yeni topluluk ise listeye ekle ve yeniden yükle
            this.loadCommunitiesFromService();
          }

          // Listeyi yenile ve filtreleri uygula
          this.applyFilters();
          this.loadCommunitiesFromService();

          this.showToast('Topluluk başarıyla güncellendi', 'success');
          this.closeModal();
          this.isSavingCommunity = false; // Loading bitir
        },
        error: (err) => {
          // Hata zaten toast ile gösteriliyor
          let errorMessage = 'Topluluk güncellenirken bir hata oluştu';

          if (err.status === 401) {
            errorMessage = 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.';
          } else if (err.status === 403) {
            errorMessage = err.error?.message || 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (err.status === 404) {
            errorMessage = 'Topluluk bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.';
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
          this.isSavingCommunity = false; // Loading bitir
        },
      });
    }
  }

  // Yeni topluluk kaydetme
  saveNewCommunity() {
    // Zaten kaydediliyor mu kontrol et
    if (this.isSavingCommunity) {
      return; // Çift tıklama engelle
    }

    if (this.newCommunity) {
      // Validasyon - Tüm zorunlu alanları kontrol et
      if (!this.newCommunity.name || !this.newCommunity.name.trim()) {
        this.showToast('Lütfen topluluk ismini girin', 'error');
        return;
      }

      if (!this.newCommunity.category) {
        this.showToast('Lütfen kategori seçin', 'error');
        return;
      }

      const shortDescription = (this.newCommunity as any).shortDescription;
      if (!shortDescription || !shortDescription.trim()) {
        this.showToast('Lütfen kısa açıklama girin', 'error');
        return;
      }

      if (!this.newCommunity.about || !this.newCommunity.about.trim()) {
        this.showToast('Lütfen topluluk hakkında bilgi girin', 'error');
        return;
      }

      if (!this.newCommunity.city) {
        this.showToast('Lütfen şehir seçin', 'error');
        return;
      }

      if (!this.newCommunity.university || !this.newCommunity.university.trim()) {
        this.showToast('Lütfen üniversite adını girin', 'error');
        return;
      }

      if (!this.newCommunity.email || !this.newCommunity.email.trim()) {
        this.showToast('Lütfen topluluk e-posta adresini girin', 'error');
        return;
      }

      // Email format validasyonu (topluluk e-postası)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.newCommunity.email.trim())) {
        this.showToast('Geçerli bir topluluk e-posta adresi girin', 'error');
        return;
      }

      // PresidentEmail validasyonu
      const presidentEmail = (this.newCommunity as any).presidentEmail;
      if (!presidentEmail || !presidentEmail.trim()) {
        this.showToast('Lütfen topluluk başkanının email adresini girin', 'error');
        return;
      }

      // Topluluk Başkanı e-posta validasyonu - sadece @edu.tr kabul edilir
      if (!presidentEmail.trim().toLowerCase().endsWith('@edu.tr')) {
        this.showToast('Topluluk başkanı e-posta adresi @edu.tr ile bitmelidir', 'error');
        return;
      }
      
      // Email format validasyonu (başkan e-postası)
      if (!emailRegex.test(presidentEmail.trim())) {
        this.showToast('Geçerli bir başkan e-posta adresi girin', 'error');
        return;
      }

      // Kaydetme işlemini başlat (loading state)
      this.isSavingCommunity = true;

      // CommunityService'e kaydet (communities-page'e otomatik eklenir)
      const communityForService = {
        ...this.newCommunity,
        id: '', // Service otomatik ID (Guid) atayacak - string olmalı
        miniAbout: (this.newCommunity as any).shortDescription || '', // Kısa açıklama miniAbout'a (backend MiniAbout)
        about: this.newCommunity.about || '', // Detaylı açıklama about'a (backend ComAbout)
        description: this.newCommunity.about || '', // description da about'a eşit
        coverImage: this.newCommunity.banner || '',
        banner: this.newCommunity.banner || '',
        presidentEmail: presidentEmail.trim(),
        status: this.newCommunity.status || 'Aktif', // Status'u ekle
      } as Community & { presidentEmail?: string; shortDescription?: string };

      this.communityService.addOrUpdateCommunity(communityForService).subscribe({
        next: (createdCommunity) => {
          // Backend'den dönen topluluğu listeye ekle
          if (createdCommunity) {
            const { website, webSiteUrl, instagram, instagramUrl, socialMedia, ...rest } = createdCommunity;
            const mappedCommunity = {
              ...rest,
              about: createdCommunity.description || createdCommunity.about || '',
              banner: createdCommunity.coverImage || createdCommunity.banner || '',
              coverImage: createdCommunity.coverImage || createdCommunity.banner || '',
              description: createdCommunity.description || createdCommunity.about || '',
              city: createdCommunity.city || '',
              category: createdCommunity.category || 'Genel',
              email: createdCommunity.email || createdCommunity.comMail || '',
              comMail: createdCommunity.comMail || createdCommunity.email || '',
              miniAbout: createdCommunity.miniAbout || '',
              shortDescription: createdCommunity.miniAbout || (createdCommunity as any).shortDescription || '',
              status:
                createdCommunity.isActivity !== undefined
                  ? createdCommunity.isActivity
                    ? 'Aktif'
                    : 'Pasif'
                  : createdCommunity.status || 'Aktif',
              isActivity:
                createdCommunity.isActivity !== undefined
                  ? createdCommunity.isActivity
                  : createdCommunity.status === 'Aktif',
              website: undefined,
              webSiteUrl: undefined,
              instagram: undefined,
              instagramUrl: undefined,
              socialMedia: undefined,
            } as Community;
            this.allCommunities.push(mappedCommunity);
            this.applyFilters();
          }
          // Service'ten güncel veriyi tekrar yükle ve listeyi yenile
          this.loadCommunitiesFromService();
          this.applyFilters();
          this.showToast('Topluluk başarıyla eklendi', 'success');
          this.closeModal();
          this.newCommunity = null;
          this.isSavingCommunity = false; // Loading'i bitir
        },
        error: (err) => {
          // Hata zaten toast ile gösteriliyor
          let errorMessage = 'Topluluk eklenirken bir hata oluştu';

          if (err.status === 401) {
            errorMessage = 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.';
          } else if (err.status === 403) {
            errorMessage = err.error?.message || 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (err.status === 404) {
            // Backend'de comLeadMail ile kullanıcı bulunamadı hatası
            errorMessage = err.error?.error || err.error?.message || 'Girilen email adresi ile kullanıcı bulunamadı. Lütfen geçerli bir topluluk başkanı email adresi girin.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.error?.error) {
            errorMessage = err.error.error;
          } else if (err.message) {
            errorMessage = err.message;
          }

          this.showToast(errorMessage, 'error');
          this.isSavingCommunity = false; // Loading'i bitir
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

      // Loading state başlat
      this.isLoadingCommunities = true;

      // CommunityService'ten sil (backend'e istek atılır)
      this.communityService.deleteCommunity(communityId).subscribe({
        next: () => {
          // Modal'ı hemen kapat ve editingCommunity'yi temizle
          this.closeModal();
          
          // Listeyi güncelle - silinen topluluğu çıkar
          this.allCommunities = this.allCommunities.filter(c => c.id !== communityId);
          this.communities = [...this.allCommunities];
          this.filteredCommunities = this.filteredCommunities.filter(c => c.id !== communityId);
          this.applyFilters();
          
          this.showToast('Topluluk başarıyla silindi', 'success');
          this.isLoadingCommunities = false;
          
          // Backend'den yeni veri çek (cache invalidation sayesinde fresh data gelecek)
          // Ama bu işlemi async olarak yap, modal zaten kapandı
          setTimeout(() => {
            this.loadCommunitiesFromService();
          }, 100);
        },
        error: (err) => {
          // Hata zaten toast ile gösteriliyor
          let errorMessage = 'Topluluk silinirken bir hata oluştu';

          if (err.status === 401) {
            errorMessage = 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.';
          } else if (err.status === 403) {
            errorMessage = err.error?.message || 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (err.status === 404) {
            errorMessage = 'Topluluk bulunamadı veya zaten silinmiş.';
            // Topluluk zaten silinmiş, UI'dan kaldır
            this.allCommunities = this.allCommunities.filter(c => c.id !== communityId);
            this.communities = [...this.allCommunities];
            this.filteredCommunities = this.filteredCommunities.filter(c => c.id !== communityId);
            this.applyFilters();
            this.closeModal();
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          }

          this.showToast(errorMessage, 'error');
          this.isLoadingCommunities = false;
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

  // Aktif/Pasif butonuna tıklandığında sadece UI'da değişiklik yap
  // Backend'e kaydetme işlemi "Kaydet" butonuna tıklandığında yapılacak
  toggleCommunityStatus(newStatus: 'Aktif' | 'Pasif') {
    if (!this.editingCommunity) {
      return;
    }

    // Zaten aynı status ise hiçbir şey yapma
    if (this.editingCommunity.status === newStatus) {
      return;
    }

    // Sadece UI'da güncelle (backend'e gitmesin)
    this.editingCommunity.status = newStatus;
    this.editingCommunity.isActivity = newStatus === 'Aktif';
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
  toggleNotifications(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.showNotifications = !this.showNotifications;
    this.isProfileOpen = false;
  }

  handleNotificationClick(notification: Notification) {
    // Bildirimi okundu olarak işaretle
    notification.read = true;

    // Dropdown'u kapat
    this.showNotifications = false;

    // Eğer targetTab varsa, o tab'a geç
    if (notification.targetTab) {
      this.switchTab(notification.targetTab);
    }
    // Eğer targetRoute varsa, o route'a git
    else if (notification.targetRoute) {
      this.router.navigate([notification.targetRoute]);
    }
  }

  toggleProfileDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.isProfileOpen = !this.isProfileOpen;
    this.showNotifications = false;
  }

  handleSettingsClick() {
    this.isProfileOpen = false;
    this.switchTab('settings');
  }

  handleLogoutClick() {
    this.isProfileOpen = false;
    this.logout();
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Buton tıklaması ise işlem yapma
    if (
      target.closest('.icon-btn.notification') ||
      target.closest('.notification-btn') ||
      target.closest('.profile-pic')
    ) {
      return;
    }

    // Profil dropdown kontrolü
    if (!target.closest('.profile-wrapper') && !target.closest('.profile-dropdown')) {
      this.isProfileOpen = false;
    }

    // Bildirimler dropdown kontrolü
    if (!target.closest('.dropdown-menu.notifications')) {
      this.showNotifications = false;
    }
  }

  logout() {
    this.showToast('Çıkış yapılıyor...', 'success');
    // AuthService'i kullanarak logout yap ve anasayfaya yönlendir
    setTimeout(() => {
      // Local storage'ı temizle
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_type');
      // Anasayfaya yönlendir
      this.router.navigate(['/']);
    }, 1500);
  }

  // Spam kontrolünü yapan metod (beklemede olan etkinlikler için)
  performSpamCheck(id: number) {
    const ev = this.allEvents.find((e) => e.id === id);
    if (!ev) return;

    // Spam kontrolü başladı
    this.checkingSpamEvents.add(id);
    // Beklemede olan etkinlikler için farklı toast mesajı
    if (ev.status === 'Beklemede') {
      this.showToast('İçerik kontrol ediliyor...', 'success');
    } else {
      this.showToast('Spam kontrolü yapılıyor...', 'success');
    }

    // Status'u backend formatına çevir
    let status = 'pending';
    if (ev.status === 'Onaylandı') {
      status = 'approved';
    } else if (ev.status === 'Reddedildi') {
      status = 'rejected';
    }

    // Body'yi oluştur (description + shortDescription birleşimi)
    const bodyParts: string[] = [];
    if (ev.shortDescription) {
      bodyParts.push(ev.shortDescription);
    }
    if (ev.description) {
      bodyParts.push(ev.description);
    }
    const body = bodyParts.join('\n\n');

    // Notes'u oluştur (ek bilgiler)
    const notesParts: string[] = [];
    if (ev.location) {
      notesParts.push(`Konum: ${ev.location}`);
    }
    if (ev.city) {
      notesParts.push(`Şehir: ${ev.city}`);
    }
    if (ev.capacity) {
      notesParts.push(`Kontenjan: ${ev.capacity}`);
    }
    if (ev.startDate) {
      notesParts.push(`Başlangıç: ${ev.startDate}`);
    }
    if (ev.endDate) {
      notesParts.push(`Bitiş: ${ev.endDate}`);
    }
    if (ev.communityName) {
      notesParts.push(`Topluluk: ${ev.communityName}`);
    }
    const notes = notesParts.join('\n');

    // Backend'in beklediği formata göre veriyi hazırla (Community Dashboard ile aynı format)
    const spamCheckData = {
      id: ev.id || 0,
      title: ev.eventName || '',
      body: body || '',
      category: ev.communityName || '',
      notes: notes || '',
      status: status,
      created_at: ev.startDate || new Date().toISOString(),
    };

    // API'ye istek gönder (unidesportal.com üzerinden)
    const apiUrl = environment.spamBotApiUrl || 'https://unidesportal.com/spam-check';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    this.http
      .post(apiUrl, spamCheckData, {
        headers,
        responseType: 'json',
      })
      .pipe(
        catchError((error) => {
          // Hata durumunda
          let errorMessage = 'Spam kontrolü sırasında bir hata oluştu.';

          if (error.error && typeof error.error === 'string' && error.error.includes('<!DOCTYPE')) {
            errorMessage = 'Backend bağlantı hatası. Lütfen daha sonra tekrar deneyin.';
          } else if (error.error && typeof error.error === 'object' && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'object' && error.error.error) {
            errorMessage = error.error.error;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }

          this.spamResults.set(id, { clean: false, message: errorMessage });
          this.showToast(errorMessage, 'error');
          this.checkingSpamEvents.delete(id);
          return of(null);
        })
      )
      .subscribe({
        next: (response: any) => {
          // Backend yanıtı yoksa veya boşsa
          if (!response || Object.keys(response).length === 0) {
            const errorMessage = 'Spam kontrolü yanıtı boş. Backend bağlantısını kontrol edin.';
            this.spamResults.set(id, { clean: false, message: errorMessage });
            this.showToast(errorMessage, 'error');
            this.checkingSpamEvents.delete(id);
            this.inspectedEvents.add(id);
            return;
          }

          // Backend formatı: { result: { status: "kabul" | "red" | "beklemede", reason: "..." }, ... }
          // veya eski format: { analysis: { forbidden: {...}, spam: {...}, politics: {...} }, ... }
          const result = response.result;
          let isClean = false;
          let message = '';
          let status = '';
          let reason = '';
          let forbiddenData: { count: number; words: string[] } | undefined;
          let spamData: { count: number; keywords: string[] } | undefined;
          let politicsData: { count: number; keywords: string[] } | undefined;

          if (result) {
            // Yeni format (Community Dashboard ile uyumlu)
            status = result.status || '';
            reason = result.reason || '';
            isClean = status === 'kabul' || status === 'accept' || status === 'approved';

            if (isClean) {
              message =
                reason || 'İçerik temizdir. Spam, yasak kelime veya siyasi içerik tespit edilmedi.';
            } else {
              message = reason || 'Spam içerik tespit edildi.';
            }
          } else if (response.analysis) {
            // Eski format (fallback)
            const analysis = response.analysis || {};
            forbiddenData = analysis.forbidden;
            spamData = analysis.spam;
            politicsData = analysis.politics;

            const forbiddenCount = forbiddenData?.count || 0;
            const spamCount = spamData?.count || 0;
            const politicsCount = politicsData?.count || 0;

            isClean = forbiddenCount === 0 && spamCount === 0 && politicsCount === 0;
            status = isClean ? 'kabul' : 'red';

            if (isClean) {
              message = 'İçerik temizdir. Spam, yasak kelime veya siyasi içerik tespit edilmedi.';
            } else {
              const issues: string[] = [];
              if (forbiddenCount > 0) {
                issues.push(`${forbiddenCount} yasak kelime`);
              }
              if (spamCount > 0) {
                issues.push(`${spamCount} spam kelimesi`);
              }
              if (politicsCount > 0) {
                issues.push(`${politicsCount} siyasi içerik`);
              }
              message = `İçerikte sorun tespit edildi: ${issues.join(', ')}.`;
            }
          } else {
            // Fallback: response.clean kontrolü
            isClean = response.clean !== false;
            status = isClean ? 'kabul' : 'red';
            message =
              response.message || (isClean ? 'İçerik temizdir.' : 'Spam içerik tespit edildi.');
          }

          // Spam sonuçlarını kaydet (tüm detayları sakla)
          this.spamResults.set(id, {
            clean: isClean,
            message: message,
            status: status,
            reason: reason,
            analysis: response.analysis || result,
            highlighted: response.highlighted,
            forbidden: forbiddenData,
            spam: spamData,
            politics: politicsData,
          });

          // Beklemede olan etkinlikler için farklı toast mesajı
          if (ev.status === 'Beklemede') {
            this.showToast('İçerik Kontrolü Tamamlandı', 'success');
          } else {
            this.showToast(message, isClean ? 'success' : 'error');
          }
          this.checkingSpamEvents.delete(id);
          this.inspectedEvents.add(id);
        },
        error: (error) => {
          // Bu durumda catchError zaten handle ediyor ama yine de buraya düşerse
          this.checkingSpamEvents.delete(id);
        },
      });
  }

  isEventClean(id: number): boolean {
    const result = this.spamResults.get(id);
    return result ? result.clean : false;
  }

  getSpamMessage(id: number): string {
    const result = this.spamResults.get(id);
    return result ? result.message : '';
  }

  getSpamReport(id: number): {
    clean: boolean;
    message: string;
    status?: string;
    reason?: string;
    reasons?: string[];
    details?: string[];
    forbidden?: { count: number; words: string[] };
    spam?: { count: number; keywords: string[] };
    politics?: { count: number; keywords: string[] };
  } | null {
    const result = this.spamResults.get(id);
    if (!result) {
      return null;
    }

    // Status'a göre detaylı bilgileri hazırla
    const reasons: string[] = [];
    const details: string[] = [];

    if (!result.clean) {
      // Yasak kelimeler
      if (result.forbidden && result.forbidden.count > 0) {
        reasons.push(`${result.forbidden.count} yasak kelime tespit edildi`);
        if (result.forbidden.words && result.forbidden.words.length > 0) {
          details.push(`Yasak kelimeler: ${result.forbidden.words.join(', ')}`);
        }
      }

      // Spam kelimeler
      if (result.spam && result.spam.count > 0) {
        reasons.push(`${result.spam.count} spam kelimesi tespit edildi`);
        if (result.spam.keywords && result.spam.keywords.length > 0) {
          details.push(`Spam kelimeler: ${result.spam.keywords.join(', ')}`);
        }
      }

      // Siyasi içerik
      if (result.politics && result.politics.count > 0) {
        reasons.push(`${result.politics.count} siyasi içerik tespit edildi`);
        if (result.politics.keywords && result.politics.keywords.length > 0) {
          details.push(`Siyasi içerik: ${result.politics.keywords.join(', ')}`);
        }
      }

      // Eğer hiçbir detay yoksa, genel mesajı kullan
      if (reasons.length === 0 && result.reason) {
        reasons.push(result.reason);
      }
    } else {
      // Temiz içerik için detaylar
      if (result.reason) {
        details.push(result.reason);
      } else {
        details.push('İçerik spam filtresinden başarıyla geçti.');
      }
    }

    return {
      clean: result.clean,
      message: result.message,
      status: result.status,
      reason: result.reason,
      reasons: reasons.length > 0 ? reasons : undefined,
      details: details.length > 0 ? details : undefined,
      forbidden: result.forbidden,
      spam: result.spam,
      politics: result.politics,
    };
  }

  openSpamReportModal(eventId: number) {
    // Önce spam kontrolü yapılmış mı kontrol et
    if (!this.spamResults.has(eventId)) {
      // Eğer spam kontrolü yapılmamışsa, önce kontrol et
      this.performSpamCheck(eventId);
      // Kontrol tamamlandığında modal açılacak (performSpamCheck içinde zaten toast gösteriliyor)
      // Modal açmak için bir callback ekleyebiliriz veya kullanıcı tekrar tıklayabilir
      this.showToast('Spam kontrolü tamamlandıktan sonra raporu görüntüleyebilirsiniz.', 'success');
      return;
    }

    // Spam kontrolü yapılmışsa, modalı aç
    this.selectedEvent = this.allEvents.find((e) => e.id === eventId) || null;
    this.modalType = 'spam-report';
    this.isModalOpen = true;
  }

  approveEvent(id: number) {
    const event = this.allEvents.find((e) => e.id === id);
    if (event) {
      // Backend'e onay isteği gönder
      this.eventService.approveEvent(id).subscribe({
        next: () => {
          // Backend'den başarılı yanıt geldi
          // LocalStorage'a onaylanan etkinlik ID'lerini kaydet (Anasayfa için)
          if (isPlatformBrowser(this.platformId)) {
            const approvedEvents = JSON.parse(localStorage.getItem('approved_events') || '[]');
            if (!approvedEvents.includes(id)) {
              approvedEvents.push(id);
              localStorage.setItem('approved_events', JSON.stringify(approvedEvents));
            }
          }

          this.showToast('Etkinlik onaylandı ve anasayfada görüntülenecek', 'success');
          this.closeModal(); // Detay modalını kapat

          // Backend'den güncel etkinlik listesini çek (mevcut filtreyi koru)
          // Bu sayede onaylanan etkinlik doğru filtreye göre görünecek
          this.loadEventsFromService();
        },
        error: (err: any) => {
          console.error('Etkinlik onaylanamadı:', err);
          let errorMessage = 'Etkinlik onaylanırken bir hata oluştu.';
          if (err.error && err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error && typeof err.error === 'string') {
            errorMessage = err.error;
          }
          this.showToast(errorMessage, 'error');
        },
      });
    }
  }

  rejectEvent(id: number) {
    this.executeReject(id);
  }

  executeReject(id: number) {
    const event = this.allEvents.find((e) => e.id === id);
    if (event) {
      this.eventToReject = event;
      this.rejectionReason = ''; // Reset reason
      this.modalType = 'reject-event'; // Set modal type for rejection
      this.isModalOpen = true;
    }
  }

  confirmRejection() {
    if (!this.eventToReject || !this.rejectionReason || !this.rejectionReason.trim()) {
      this.showToast('Lütfen revize nedenini belirtiniz', 'error');
      return;
    }

    // Backend'e reddetme isteği gönder
    this.eventService.rejectEvent(this.eventToReject.id, this.rejectionReason).subscribe({
      next: () => {
        // Backend'den başarılı yanıt geldi, local state'i güncelle
        this.eventToReject!.status = 'Reddedildi';
        this.eventToReject!.rejectionReason = this.rejectionReason;

        // Filtered events'i güncelle
        const filteredIndex = this.filteredEvents.findIndex((e) => e.id === this.eventToReject!.id);
        if (filteredIndex !== -1) {
          this.filteredEvents[filteredIndex].status = 'Reddedildi';
          this.filteredEvents[filteredIndex].rejectionReason = this.rejectionReason;
        }

        // AllEvents'i de güncelle
        const allEventsIndex = this.allEvents.findIndex((e) => e.id === this.eventToReject!.id);
        if (allEventsIndex !== -1) {
          this.allEvents[allEventsIndex].status = 'Reddedildi';
          this.allEvents[allEventsIndex].rejectionReason = this.rejectionReason;
        }

        this.showToast('Etkinlik reddedildi ve revizeye gönderildi', 'success');
        this.closeModal();
        this.eventToReject = null;
        this.rejectionReason = '';

        // Etkinlik listesini yeniden yükle (backend'den güncel veriyi al)
        this.loadEventsFromService();
      },
      error: (err) => {
        console.error('Etkinlik reddedilemedi:', err);
        let errorMessage = 'Etkinlik reddedilirken bir hata oluştu.';
        if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.error && typeof err.error === 'string') {
          errorMessage = err.error;
        }
        this.showToast(errorMessage, 'error');
      },
    });
  }

  openEventDetail(ev: EventRequest) {
    // Mevcut veriyi direkt kullan (backend'den çekmeye gerek yok, zaten listede var)
    this.selectedEvent = ev;
    this.modalType = 'event-detail';
    this.isModalOpen = true;
  }

  formatEventDate(dateString?: string): string {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  formatEventDateOnly(dateString?: string): string {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  formatEventTime(dateString?: string): string {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  openNewEventModal() {
    this.newEvent = {
      eventName: '',
      date: '',
      location: '',
      // Community id string (Guid), EventRequest communityId number bekliyor - undefined bırakıyoruz
      // Backend'e gönderilirken uygun formata çevrilecek
      communityId: undefined,
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
        this.allCommunities.find((c) => String(c.id) === String(this.newEvent?.communityId))
          ?.name ||
        this.newEvent.communityName ||
        '',
      imageUrl: this.newEvent.imageUrl || '',
      description: this.newEvent.description || '',
      status: this.newEvent.status || 'Beklemede',
      capacity: this.newEvent.capacity || '',
    };
    this.allEvents = [newItem, ...this.allEvents];
    this.showToast('Etkinlik eklendi', 'success');
    this.closeModal();
  }

  deleteEvent(id: number) {
    this.allEvents = this.allEvents.filter((e) => e.id !== id);
    this.showToast('Etkinlik silindi', 'success');
    this.closeModal();
  }

  openModal(type: string) {
    this.modalType = type;
    this.isModalOpen = true;
  }

  // Belirli modal tipleri için backdrop click ve ESC tuşu ile kapanmayı engelle
  private shouldPreventAutoClose(): boolean {
    const preventCloseTypes = [
      'new-community',
      'edit-community',
      'new-event',
      'event-detail',
      'new-announcement',
      'edit-announcement'
    ];
    return this.modalType ? preventCloseTypes.includes(this.modalType) : false;
  }

  // Backdrop'a tıklanınca çağrılır - belirli modal tipleri için kapanmayı engelle
  handleBackdropClick(event: MouseEvent) {
    if (this.shouldPreventAutoClose()) {
      // Belirli modal tipleri için backdrop click ile kapanmayı engelle
      event.stopPropagation();
      return;
    }
    // Diğer modal tipleri için normal kapanma davranışı
    this.closeModal();
  }

  // ESC tuşu ile kapanmayı engelle
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (this.isModalOpen && this.shouldPreventAutoClose()) {
      // Belirli modal tipleri için ESC tuşu ile kapanmayı engelle
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      return;
    }
    // Diğer modal tipleri için normal kapanma davranışı
    if (this.isModalOpen && !this.shouldPreventAutoClose()) {
      this.closeModal();
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalType = null;
    this.editingAnnouncement = null;
    this.selectedAnnouncement = null;
    this.editingCommunity = null; // Topluluk modal'ı temizle
    this.newCommunity = null; // Yeni topluluk modal'ı temizle
    this.selectedEvent = null; // Event modal'ı temizle
    this.selectedCommunity = null; // Seçili topluluk temizle
  }

  // Duyuru detay ve güncelleme
  openAnnouncementDetail(announcement: Announcement) {
    this.selectedAnnouncement = announcement;
    this.editingAnnouncement = { ...announcement };
    this.modalType = 'edit-announcement';
    this.isModalOpen = true;
  }

  saveAnnouncement() {
    // Çift tıklama engelle
    if (this.isSavingAnnouncement) {
      return;
    }

    // Validasyon
    if (!this.newAnnouncement.title || !this.newAnnouncement.title.trim()) {
      this.showToast('Lütfen duyuru başlığını giriniz', 'error');
      return;
    }

    // Loading state başlat
    this.isSavingAnnouncement = true;

    // API'ye istek at
    // Swagger'a göre annDate ISO 8601 formatında olmalı: 2025-12-06T16:49:01.554Z
    this.announcementService
      .createAnnouncement({
        title: this.newAnnouncement.title.trim(),
        shortDescription: this.newAnnouncement.shortDescription?.trim(),
        content: this.newAnnouncement.content?.trim(),
        image: '', // Görsel daha sonra yüklenecek
        link: this.newAnnouncement.link?.trim(),
        date: new Date().toISOString(), // ISO 8601 formatında tam tarih-saat
      })
      .subscribe({
        next: (announcementId) => {
          // Duyuru oluşturuldu, şimdi bekleyen görsel varsa yükle
          if (this.pendingNewAnnouncementImage) {
            this.announcementService.uploadImage(announcementId, this.pendingNewAnnouncementImage).subscribe({
              next: (imagePath) => {
                // Görsel yüklendi, duyuruları yeniden yükle
                this.loadAnnouncementsFromService();
                this.showToast('Duyuru ve görsel başarıyla yayınlandı', 'success');
                this.resetNewAnnouncementForm();
                this.closeModal();
                this.isSavingAnnouncement = false; // Loading bitir
              },
              error: (err) => {
                // Görsel yüklenemedi ama duyuru oluşturuldu
                console.error('Görsel yüklenemedi:', err);
                this.loadAnnouncementsFromService();
                this.showToast('Duyuru oluşturuldu ancak görsel yüklenemedi', 'error');
                this.resetNewAnnouncementForm();
                this.closeModal();
                this.isSavingAnnouncement = false; // Loading bitir
              }
            });
          } else {
            // Görsel yok, sadece duyuru oluşturuldu
            this.loadAnnouncementsFromService();
            this.showToast('Duyuru başarıyla yayınlandı', 'success');
            this.resetNewAnnouncementForm();
            this.closeModal();
            this.isSavingAnnouncement = false; // Loading bitir
          }
        },
        error: (error) => {
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
          this.isSavingAnnouncement = false; // Loading bitir
        },
      });
  }

  // Yeni duyuru formunu temizle
  private resetNewAnnouncementForm() {
    this.newAnnouncement = {
      title: '',
      shortDescription: '',
      content: '',
      image: '',
      link: '',
    };
    this.pendingNewAnnouncementImage = null;
  }

  // Duyuruları API'den yükle
  loadAnnouncementsFromService() {
    // Sadece browser'da çalıştığından emin ol
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Loading state'i başlat
    this.isLoadingAnnouncements = true;

    this.announcementService.getAllAnnouncements().subscribe({
      next: (data) => {
        this.announcements = data;
        this.filteredAnnouncements = [...data];
        this.applyAnnouncementFilters();
        // Loading state'i bitir
        this.isLoadingAnnouncements = false;
      },
      error: (err) => {
        // Hata durumunda boş array kullanılıyor
        // Hata durumunda boş liste kullan
        this.announcements = [];
        this.filteredAnnouncements = [];
        // Loading state'i bitir
        this.isLoadingAnnouncements = false;
      },
    });
  }

  applyAnnouncementFilters() {
    let temp = [...this.announcements];

    // Metin araması
    if (this.announcementSearchText.trim()) {
      const term = this.announcementSearchText.toLowerCase();
      temp = temp.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          (a.shortDescription && a.shortDescription.toLowerCase().includes(term)) ||
          (a.content && a.content.toLowerCase().includes(term))
      );
    }

    this.filteredAnnouncements = temp;
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
        image: this.pendingEditAnnouncementImage ? '' : this.editingAnnouncement.image, // Yeni görsel yüklenecekse boş bırak
        link: this.editingAnnouncement.link,
        date: dateValue, // ISO formatında veya undefined
      })
      .subscribe({
        next: () => {
          // Duyuru güncellendi, bekleyen görsel varsa yükle
          if (this.pendingEditAnnouncementImage) {
            this.announcementService.uploadImage(announcementId, this.pendingEditAnnouncementImage).subscribe({
              next: (imagePath) => {
                // Görsel yüklendi
                this.loadAnnouncementsFromService();
                this.showToast('Duyuru ve görsel başarıyla güncellendi', 'success');
                this.pendingEditAnnouncementImage = null;
                this.closeModal();
              },
              error: (err) => {
                // Görsel yüklenemedi ama duyuru güncellendi
                console.error('Görsel yüklenemedi:', err);
                this.loadAnnouncementsFromService();
                this.showToast('Duyuru güncellendi ancak görsel yüklenemedi', 'error');
                this.pendingEditAnnouncementImage = null;
                this.closeModal();
              }
            });
          } else {
            // Görsel yok, sadece duyuru güncellendi
            this.loadAnnouncementsFromService();
            this.showToast('Duyuru başarıyla güncellendi', 'success');
            this.closeModal();
          }
        },
        error: (error) => {
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
        // Hata zaten toast ile gösteriliyor

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
    // Dosyayı sakla, duyuru ID alındıktan sonra yüklenecek
    this.pendingNewAnnouncementImage = file;
    // Kullanıcıya önizleme göstermek için Base64'e çevir
    const reader = new FileReader();
    reader.onload = () => {
      this.newAnnouncement.image = reader.result as string;
    };
    reader.readAsDataURL(file);
    this.showToast('Görsel seçildi, duyuru kaydedildiğinde yüklenecek', 'success');
  }

  onAnnouncementFileSelected(file: File) {
    // Düzenleme modunda: Dosyayı sakla, güncelleme sırasında yüklenecek
    this.pendingEditAnnouncementImage = file;
    // Kullanıcıya önizleme göstermek için Base64'e çevir
    const reader = new FileReader();
    reader.onload = () => {
      if (this.editingAnnouncement) {
        this.editingAnnouncement.image = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
    this.showToast('Görsel seçildi, duyuru güncellendiğinde yüklenecek', 'success');
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
        return 'Profilim';
      default:
        return '';
    }
  }

  getShortDesc(description: string | undefined): string {
    const desc = description || 'Açıklama bulunmuyor.';
    const limit = 120;
    if (desc.length > limit) {
      return desc.substring(0, limit) + '...';
    }
    return desc;
  }

  ngOnDestroy(): void {
    // AFK Detection'ı durdur
    this.afkDetectionService.stop();
  }
}
