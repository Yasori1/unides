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
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';
import { AuthService } from '../../services/auth.services';
import { SpamService } from '../../services/spam.service';
import { Logger } from '../../utils/logger.util';

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
  category?: string; // Kategori bilgisi
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
  imports: [CommonModule, FormsModule, ToastComponent, ImageUploadComponent, LumaSpinComponent],
  templateUrl: './corporate-dashboard.component.html',
  styleUrls: ['./corporate-dashboard.component.scss'],
})
export class CorporateDashboardComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  activeTab = 'overview';
  showNotifications = false;
  isProfileOpen = false;

  // Unified Profile Dropdown Identity
  userRole: string = 'corporate';
  userName: string = '';
  userEmail: string = '';
  displayName: string = '';
  userInitial: string = '';
  isModalOpen = false;
  modalType = '';
  searchText = '';
  statusFilter: string = ''; // Aktif/Pasif filtre ('' = Tüm Durumlar sadece Bartın için)
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
  spamResults: Map<
    number,
    {
      clean: boolean;
      message: string;
      status?: string;
      reason?: string;
      analysis?: any;
      moderation?: any;
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
    name: 'İstanbul',
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

  // Duyurular API'den yüklenecek, mock data kaldırıldı
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

  // Bekleyen görsel dosyaları - etkinlik ID alındıktan sonra yüklenecek
  pendingNewEventImage: File | null = null;
  pendingEditEventImage: File | null = null;

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
    private imageErrorHandler: ImageErrorHandlerService,
    private authService: AuthService,
    private spamService: SpamService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // SSR sırasında HTTP istekleri yapma, sadece browser'da yap
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // AFK Detection'ı başlat
    this.afkDetectionService.start();

    // Query parametrelerini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const statusParam = urlParams.get('status');

    if (tabParam) {
      this.switchTab(tabParam);
    }

    if (statusParam) {
      this.statusFilter = statusParam;
      this.loadCommunitiesFromService(this.statusFilter);
    } else {
      // Topluluklar sekmesine her girişte varsayılan "Tüm Durumlar"
      this.statusFilter = '';
      this.loadCommunitiesFromService('');
    }
    // Overview için loading state'i başlat
    this.isLoadingOverview = true;

    // AnnouncementService'ten duyuruları çek (announcements-page ile aynı kaynak)
    this.loadAnnouncementsFromService();
    // Events'i backend'den çek
    this.loadEventsFromService();

    // Unified Profile Dropdown Initialization - AuthService'den kullanıcı adını ve email'ini çek
    const userInfo = this.authService.getUser();
    if (userInfo) {
      if (userInfo.name) {
        this.userName = userInfo.name;
        this.displayName = userInfo.name;
        this.userInitial = userInfo.name.charAt(0).toUpperCase();
      }
      if (userInfo.email) {
        this.userEmail = userInfo.email;
      }
    } else {
      // Fallback: corporateInfo veya varsayılan değer
      this.userName = this.corporateInfo.name || 'Kurumsal';
      this.displayName = this.userName;
      this.userInitial = this.userName.charAt(0).toUpperCase();
    }
  }

  /** API'den gelen topluluk listesini işleyip ekrana yansıtır. Backend: active | passive | pending | all. Reddedilen/Silinmiş = all + client filter. */
  private handleCommunitiesLoaded(communities: Community[], statusFilter?: string): void {
    let mapped = communities;
    if (statusFilter === 'Reddedilen') {
      mapped = mapped.filter((c) => c.status === 'Reddedilen');
    } else if (statusFilter === 'Silinmiş') {
      mapped = mapped.filter((c) => c.deletedAt != null && c.deletedAt !== '');
    }
    // #region agent log
    if (statusFilter === 'Silinmiş' && mapped.length > 0) {
      const s0 = mapped[0];
      fetch('http://127.0.0.1:7242/ingest/e6794e23-5632-4fdd-a837-2f9289c5988e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'corporate-dashboard:handleCommunitiesLoaded',message:'Silinmiş list after filter',data:{statusFilter, displayStatus: s0?.status, displayDeletedAt: s0?.deletedAt, count: mapped.length},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    }
    if (statusFilter === 'Reddedilen' && mapped.length > 0) {
      const s0 = mapped[0];
      fetch('http://127.0.0.1:7242/ingest/e6794e23-5632-4fdd-a837-2f9289c5988e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'corporate-dashboard:handleCommunitiesLoaded',message:'Reddedilen list after filter',data:{statusFilter, displayStatus: s0?.status, count: mapped.length},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    }
    // #endregion
    this.allCommunities = mapped;
    const uniqueCategories = [
      ...new Set(
        this.allCommunities
          .map((c) => c.category)
          .filter((cat): cat is string => !!cat && cat !== 'Genel')
      ),
    ].sort();
    this.categories = [...new Set([...this.categories, ...uniqueCategories, 'Genel'])].sort();
    this.communities = [...this.allCommunities];
    this.applyFilters();
    this.attachCommunityNamesToEvents();
    this.isLoadingCommunities = false;
  }

  /** Topluluklar yükleme hatası: 403 ise aktif topluluklara düş, değilse mevcut listeyi koru */
  private handleCommunitiesError(err: any): void {
    if (err?.status === 403) {
      this.showToast(
        'Pasif toplulukları görüntülemek için GSB yetkisi gereklidir. Şu anda sadece aktif topluluklar gösteriliyor.',
        'error'
      );
      this.communityService.getAllCommunities({ status: 'active' }).subscribe({
        next: (data) => {
          const mapped = (data || []).map((c) => {
            const { website, webSiteUrl, instagram, instagramUrl, socialMedia, ...rest } = c;
            const isActivity = c.isActivity !== undefined ? c.isActivity : true;
            const coverUrl =
              (c.coverImage && String(c.coverImage).trim()) || (c.banner && String(c.banner).trim())
                ? c.coverImage || c.banner
                : '';
            const logoUrl = c.logo && String(c.logo).trim() ? c.logo : '';
            return {
              ...rest,
              about: c.description || c.about || '',
              banner: coverUrl || 'assets/img/placeholder-cover.svg',
              coverImage: coverUrl || 'assets/img/placeholder-cover.svg',
              logo: logoUrl || 'assets/img/placeholder-logo.svg',
              description: c.description || c.about || '',
              city: c.city || '',
              category: c.category || 'Genel',
              email: c.email || c.comMail || '',
              comMail: c.comMail || c.email || '',
              miniAbout: c.miniAbout || '',
              shortDescription: c.miniAbout || (c as any).shortDescription || '',
              status: c.status ?? (isActivity ? 'Aktif' : 'Pasif'),
              isActivity,
              website: undefined,
              webSiteUrl: undefined,
              instagram: undefined,
              instagramUrl: undefined,
              socialMedia: undefined,
            } as Community;
          });
          this.handleCommunitiesLoaded(mapped);
        },
        error: () => {
          this.communities = [...this.allCommunities];
          this.applyFilters();
          this.attachCommunityNamesToEvents();
          this.isLoadingCommunities = false;
        },
      });
    } else {
      this.communities = [...this.allCommunities];
      this.applyFilters();
      this.attachCommunityNamesToEvents();
      this.isLoadingCommunities = false;
    }
  }

  /** Bartın hesabı ile giriş yapılmış mı (şehir/üniversite adı Bartın içeriyorsa) */
  isBartinUser(): boolean {
    const user = this.authService.getUser();
    if (!user) return false;
    const city = (user.city ?? user.City ?? '').toString().toLowerCase();
    const university = (user.university ?? user.University ?? '').toString().toLowerCase();
    const normalizedCity = city.normalize('NFD').replace(/\u0131/g, 'i').replace(/[\u0300-\u036f]/g, '');
    const normalizedUni = university.normalize('NFD').replace(/\u0131/g, 'i').replace(/[\u0300-\u036f]/g, '');
    return /bartin/.test(normalizedCity) || /bartin/.test(normalizedUni);
  }

  /** Giriş yapan kurumsal kullanıcının şehrini döndürür (Aktif/Pasif/Onay Bekleyen filtresinde sadece o şehir listelenir) */
  getUserCity(): string | undefined {
    const user = this.authService.getUser();
    if (!user) return undefined;
    const rawCity = (
      (user as any).city ??
      (user as any).City ??
      (user as any).userCity ??
      (user as any).officeCity ??
      (user as any).selectedCity ??
      (user as any).il ??
      ''
    )
      .toString()
      .trim();
    if (rawCity) return rawCity;
    if (this.isBartinUser()) return 'Bartın';
    return undefined;
  }

  /** İki şehir adının eşleşip eşleşmediğini Türkçe karakterlere duyarlı şekilde karşılaştırır */
  private cityMatches(communityCity: string | undefined, userCity: string): boolean {
    if (!communityCity || !userCity) return false;
    const n = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/\u0131/g, 'i')
        .replace(/[\u0300-\u036f]/g, '');
    return n(communityCity.trim()) === n(userCity.trim());
  }

  loadCommunitiesFromService(statusFilter?: string) {
    // Sadece browser'da çalıştığından emin ol
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Loading state'i başlat; önceki filtre verisini kaldır ki yanlış liste görünmesin
    this.isLoadingCommunities = true;
    this.allCommunities = [];
    this.communities = [];
    this.filteredCommunities = [];
    this.displayedCommunities = [];
    this.currentPage = 1;
    this.totalPages = 0;

    // Backend GET /api/Communities: status = active | passive | pending | rejected | deleted | all
    let backendStatus:
      | 'all'
      | 'active'
      | 'passive'
      | 'pending'
      | 'rejected'
      | 'deleted' = 'all';
    let backendCity: string | undefined = this.getUserCity();

    if (statusFilter === 'Aktif') {
      backendStatus = 'active';
    } else if (statusFilter === 'Onay Bekleyen') {
      backendStatus = 'pending';
    } else if (statusFilter === 'Pasif') {
      backendStatus = 'passive';
    } else if (statusFilter === 'Reddedilen') {
      backendStatus = 'rejected';
    } else if (statusFilter === 'Silinmiş') {
      backendStatus = 'deleted';
    } else if (!statusFilter || statusFilter === '') {
      backendStatus = 'all';
      if (this.isBartinUser()) backendCity = 'Bartın';
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e6794e23-5632-4fdd-a837-2f9289c5988e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'corporate-dashboard:loadCommunitiesFromService',
        message: 'Request',
        data: { statusFilter, backendStatus },
        timestamp: Date.now(),
        hypothesisId: 'H1',
      }),
    }).catch(() => {});
    // #endregion

    const mapApiDataToCommunities = (data: any[]) => {
      return (data || []).map((c) => {
        const { website, webSiteUrl, instagram, instagramUrl, socialMedia, ...rest } = c;
        const isActivity = c.isActivity !== undefined ? c.isActivity : true;
        const deletedAt = c.deletedAt ?? (c as any).DeletedAt ?? rest.deletedAt ?? null;
        const isDeleted = deletedAt != null && String(deletedAt).trim() !== '';
        const coverUrl =
          (c.coverImage && String(c.coverImage).trim()) || (c.banner && String(c.banner).trim())
            ? c.coverImage || c.banner
            : '';
        const logoUrl = c.logo && String(c.logo).trim() ? c.logo : '';
        const status: Community['status'] = isDeleted
          ? 'Silinmiş'
          : (c.status ?? (isActivity ? 'Aktif' : 'Pasif'));
        return {
          ...rest,
          about: c.description || c.about || '',
          banner: coverUrl || 'assets/img/placeholder-cover.svg',
          coverImage: coverUrl || 'assets/img/placeholder-cover.svg',
          logo: logoUrl || 'assets/img/placeholder-logo.svg',
          description: c.description || c.about || '',
          city: c.city || '',
          category: c.category || 'Genel',
          email: c.email || c.comMail || '',
          comMail: c.comMail || c.email || '',
          miniAbout: c.miniAbout || '',
          shortDescription: c.miniAbout || (c as any).shortDescription || '',
          status,
          deletedAt: isDeleted ? deletedAt : undefined,
          isActivity: isActivity,
          website: undefined,
          webSiteUrl: undefined,
          instagram: undefined,
          instagramUrl: undefined,
          socialMedia: undefined,
        } as Community;
      });
    };

    const apiParams: { status: typeof backendStatus; city?: string } = { status: backendStatus };
    if (backendCity) apiParams.city = backendCity;
    this.communityService.getAllCommunities(apiParams).subscribe({
      next: (data) => {
        const mapped = mapApiDataToCommunities(data || []);
        // #region agent log
        if (statusFilter === 'Silinmiş' && mapped.length > 0) {
          const first = mapped[0];
          fetch('http://127.0.0.1:7242/ingest/e6794e23-5632-4fdd-a837-2f9289c5988e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'corporate-dashboard:afterMap',message:'After mapApiDataToCommunities',data:{statusFilter, firstStatus: first?.status, firstDeletedAt: first?.deletedAt, firstComConfirm: (first as any)?.comConfirm, total: mapped.length},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        }
        if (statusFilter === 'Reddedilen' && mapped.length > 0) {
          const first = mapped[0];
          fetch('http://127.0.0.1:7242/ingest/e6794e23-5632-4fdd-a837-2f9289c5988e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'corporate-dashboard:afterMap',message:'Reddedilen filter first item',data:{statusFilter, firstStatus: first?.status, firstDeletedAt: first?.deletedAt},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        }
        // #endregion
        this.handleCommunitiesLoaded(mapped, statusFilter);
      },
      error: (err) => this.handleCommunitiesError(err),
    });
  }

  /** ngFor trackBy: her topluluk kartının doğru görselle eşleşmesi için (yanlış görsel göstermeyi önler) */
  trackByCommunityId(_index: number, item: Community): string {
    return item?.id ?? '';
  }

  /** Topluluk logosu URL'si; null/boş ise placeholder kullanılır (veritabanında LogoUrl null olabilir) */
  getCommunityLogo(item: Community): string | null {
    const url = item?.logo;
    return url && String(url).trim() ? url : null;
  }

  /** Topluluk kapak görseli URL'si; null/boş ise placeholder kullanılır (veritabanında BannerUrl null olabilir) */
  getCommunityCover(item: Community): string | null {
    const url = item?.coverImage || item?.banner;
    return url && String(url).trim() ? url : null;
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
              category: (e as any).category || community?.category || '',
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
                category: (e as any).category || community?.category || '',
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
    this.loadCommunitiesFromService(this.statusFilter);
  }

  /** Chip tıklanınca durum filtresini ayarla ve backend'den ilgili endpoint ile veri çek */
  setCommunityStatusFilter(status: string) {
    this.statusFilter = status;
    this.loadCommunitiesFromService(this.statusFilter);
  }

  /** Kart üzerindeki durum rozeti için CSS sınıfı (Aktif, Pasif, Onay Bekleyen, Reddedilen, Silinmiş) */
  getCommunityStatusClass(item: Community): string {
    const s = (item?.status || '').toLowerCase();
    if (s === 'aktif') return 'aktif';
    if (s === 'pasif') return 'pasif';
    if (s === 'onay bekleyen') return 'onay-bekleyen';
    if (s === 'reddedilen') return 'reddedilen';
    if (s === 'silinmiş') return 'silinmis';
    return 'aktif';
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

    // Şehir filtresi
    if (this.cityFilter) {
      temp = temp.filter((c) => c.city && c.city === this.cityFilter);
    }

    // Aktif / Pasif / Onay Bekleyen seçiliyse sadece giriş yapan kullanıcının şehrindeki topluluklar (backend city desteklemiyorsa client-side yedek)
    const userCity = this.getUserCity();
    if (userCity && (this.statusFilter === 'Aktif' || this.statusFilter === 'Pasif' || this.statusFilter === 'Onay Bekleyen' || this.statusFilter === 'Reddedilen' || this.statusFilter === 'Silinmiş')) {
      temp = temp.filter((c) => this.cityMatches(c.city, userCity));
    }

    // Pasif filtresinde reddedilen toplulukları gösterme (reddedilenler artık direkt siliniyor, yine de listede çıkarsa elenecek)
    if (this.statusFilter === 'Pasif') {
      temp = temp.filter((c) => c.status !== 'Reddedilen');
    }

    // Durum filtresi - sadece "Onay Bekleyen" için frontend'de filtreleme yap
    // "Aktif" ve "Pasif" filtreleri backend'den geliyor, burada sadece "Onay Bekleyen" kontrolü yapılıyor
    // if (this.statusFilter === 'Onay Bekleyen') {
    //   // Onay bekleyen topluluklar için özel kontrol
    //   temp = temp.filter((c) => !c.status || c.status === 'Onay Bekleyen');
    // }
    // "Aktif" ve "Pasif" filtreleri backend'den zaten filtrelenmiş olarak geliyor

    // Kurumsal Dashboard: Onay Bekleyen → Reddedilen → Pasif → Aktif → Silinmiş sırası
    const statusOrder = (status: string | undefined): number => {
      if (!status || status === 'Onay Bekleyen') return 0;
      if (status === 'Reddedilen') return 1;
      if (status === 'Pasif') return 2;
      if (status === 'Aktif') return 3;
      if (status === 'Silinmiş') return 4;
      return 5;
    };
    temp.sort((a, b) => statusOrder(a.status) - statusOrder(b.status));

    this.filteredCommunities = temp;
    // #region agent log
    const citiesFiltered = [
      ...new Set(this.filteredCommunities.map((c) => c.city).filter(Boolean)),
    ];
    fetch('http://127.0.0.1:7242/ingest/e6794e23-5632-4fdd-a837-2f9289c5988e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'corporate-dashboard:applyFilters',
        message: 'After filters',
        data: {
          cityFilter: this.cityFilter,
          searchText: this.searchText,
          filteredCount: this.filteredCommunities.length,
          cities: citiesFiltered,
          hasBartin: citiesFiltered.some(
            (x) =>
              typeof x === 'string' && /bartin/i.test(x.normalize('NFD').replace(/\u0131/g, 'i'))
          ),
        },
        timestamp: Date.now(),
        hypothesisId: 'H2',
      }),
    }).catch(() => {});
    // #endregion
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

    // Tümü seçiliyken sıra: Bekleyen → Reddedilen → Onaylanan
    if (!this.eventStatusFilter) {
      const statusOrder = (status: string) => {
        if (status === 'Beklemede') return 0;
        if (status === 'Reddedildi' || status === 'Revize') return 1;
        if (status === 'Onaylandı') return 2;
        return 0;
      };
      temp.sort((a, b) => statusOrder(a.status) - statusOrder(b.status));
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
      queryParams: { tab: 'communities', status: 'Onay Bekleyen' },
    });
    this.switchTab('communities');
    this.statusFilter = 'Onay Bekleyen';
    this.loadCommunitiesFromService(this.statusFilter);
  }

  // Etkinlikler sekmesine beklemede filtresiyle yönlendir
  goToPendingEvents() {
    this.switchTab('events');
    this.setEventStatusFilter('Beklemede');
  }

  // --- TOPLULUK ONAY/RED (GSB) ---
  rejectionReasonCommunity = '';
  communityToReject: Community | null = null;
  communityToApprove: Community | null = null;
  /** Backend liste ConfirmAbout dönmediği için: reddederken girilen neden burada tutulur, detay popup'ta gösterilir. */
  rejectedCommunityReasons: Map<string, string> = new Map();

  openApproveCommunityModal(community: Community): void {
    this.communityToApprove = community;
    this.modalType = 'approveCommunity';
    this.isModalOpen = true;
  }

  confirmApproveCommunity(): void {
    if (!this.communityToApprove) return;
    const community = this.communityToApprove;
    this.communityService.reviewCommunity(community.id, 1).subscribe({
      next: () => {
        this.toastService.show(`${community.name} topluluğu onaylandı.`, 'success');
        this.isModalOpen = false;
        this.communityToApprove = null;
        this.loadCommunitiesFromService(this.statusFilter);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || 'Onaylama sırasında bir hata oluştu.';
        this.toastService.show(typeof msg === 'string' ? msg : 'Onaylama hatası.', 'error');
      },
    });
  }

  openRejectCommunityModal(community: Community): void {
    this.communityToReject = community;
    this.rejectionReasonCommunity = '';
    this.modalType = 'rejectCommunity';
    this.isModalOpen = true;
  }

  confirmRejectCommunity(): void {
    if (!this.communityToReject) return;
    const reason = this.rejectionReasonCommunity?.trim() || '';
    if (!reason) {
      this.toastService.show('Lütfen reddetme nedenini giriniz.', 'error');
      return;
    }
    const community = this.communityToReject;
    this.communityService.reviewCommunity(community.id, 2, reason).subscribe({
      next: () => {
        this.rejectedCommunityReasons.set(community.id, reason);
        this.toastService.show(`${community.name} topluluğu reddedildi.`, 'success');
        this.isModalOpen = false;
        this.communityToReject = null;
        this.rejectionReasonCommunity = '';
        this.loadCommunitiesFromService(this.statusFilter);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || 'Red işlemi sırasında bir hata oluştu.';
        this.toastService.show(typeof msg === 'string' ? msg : 'Red hatası.', 'error');
      },
    });
  }

  // Topluluk detay ve güncelleme
  openCommunityDetail(community: Community) {
    this.selectedCommunity = community;

    // Önce mevcut veriyi editingCommunity'ye set et (silme işlemi için gerekli)
    // Backend'den detay çekmeye çalışırken bile mevcut veriyi kullanabiliriz
    // CommunityMiniDto'dan gelen miniAbout'u kullan
    const miniAboutValue =
      community.miniAbout || (community as any).MiniAbout || (community as any).miniAbout || '';
    const isRejected = community.status === 'Reddedilen' || (community as any).comConfirm === 2;
    const cachedRejectionReason = isRejected ? this.rejectedCommunityReasons.get(community.id) : undefined;
    this.editingCommunity = {
      ...community,
      about: community.description || community.about || '',
      email: community.email || (community as any).comMail || '',
      presidentEmail: (community as any).comLeadMail || (community as any).presidentEmail || '',
      shortDescription: miniAboutValue || (community as any).shortDescription || '',
      miniAbout: miniAboutValue || (community as any).shortDescription || '',
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
        community.isActivity !== undefined ? community.isActivity : community.status === 'Aktif',
      confirmAbout: (community.confirmAbout && community.confirmAbout.trim()) || cachedRejectionReason || community.confirmAbout || '',
    } as Community & { presidentEmail?: string; shortDescription?: string };

    // Modal'ı aç
    this.modalType = 'edit-community';
    this.isModalOpen = true;

    // Backend'den detay çek (aktif/pasif durumuna göre)
    // Aktif topluluklar için: GET /api/Communities/{id}
    // Pasif topluluklar için: GET /api/Communities?status=passive (liste endpoint'inden ID'ye göre filtrele)
    if (community.id && community.id !== '' && !community.id.includes('mock')) {
      // Topluluğun aktif/pasif durumunu kontrol et
      const isActive =
        community.isActivity !== undefined ? community.isActivity : community.status === 'Aktif';

      this.communityService.getCommunityById(community.id, isActive).subscribe({
        next: (detailedCommunity) => {
          // Backend'den gelen tüm detayları editingCommunity'ye map et
          this.editingCommunity = {
            ...detailedCommunity,
            // Açıklama alanları
            about:
              detailedCommunity.description ||
              detailedCommunity.about ||
              (detailedCommunity as any).comAbout ||
              '',
            description:
              detailedCommunity.description ||
              detailedCommunity.about ||
              (detailedCommunity as any).comAbout ||
              '',
            // Email alanları - backend'den gelen tüm email alanlarını kontrol et
            email:
              detailedCommunity.email ||
              detailedCommunity.comMail ||
              (detailedCommunity as any).comMail ||
              '',
            comMail:
              detailedCommunity.comMail ||
              detailedCommunity.email ||
              (detailedCommunity as any).comMail ||
              '',
            // Topluluk başkanı email - backend'den gelen tüm alanları kontrol et
            presidentEmail:
              detailedCommunity.comLeadMail ||
              detailedCommunity.presidentEmail ||
              (detailedCommunity as any).comLeadMail ||
              (detailedCommunity as any).presidentEmail ||
              '',
            comLeadMail:
              detailedCommunity.comLeadMail ||
              detailedCommunity.presidentEmail ||
              (detailedCommunity as any).comLeadMail ||
              (detailedCommunity as any).presidentEmail ||
              '',
            // Kısa açıklama
            shortDescription:
              detailedCommunity.miniAbout ||
              (detailedCommunity as any).shortDescription ||
              (detailedCommunity as any).miniAbout ||
              '',
            miniAbout:
              detailedCommunity.miniAbout ||
              (detailedCommunity as any).shortDescription ||
              (detailedCommunity as any).miniAbout ||
              '',
            // Görsel alanları
            banner: detailedCommunity.coverImage || detailedCommunity.banner || '',
            coverImage: detailedCommunity.coverImage || detailedCommunity.banner || '',
            logo: detailedCommunity.logo || '',
            // Diğer alanlar
            city: detailedCommunity.city || '',
            university: detailedCommunity.university || '',
            category: detailedCommunity.category || 'Genel',
            // Durum ve reddetme nedeni (backend detay/liste ConfirmAbout dönmeyebilir; frontend cache kullanılır)
            status: detailedCommunity.status || (detailedCommunity.isActivity ? 'Aktif' : 'Pasif'),
            confirmAbout:
              (detailedCommunity.confirmAbout && detailedCommunity.confirmAbout.trim()) ||
              (detailedCommunity as any).confirmAbout ||
              (detailedCommunity as any).ConfirmAbout ||
              this.rejectedCommunityReasons.get(community.id) ||
              this.editingCommunity?.confirmAbout ||
              '',
            isActivity:
              detailedCommunity.isActivity !== undefined
                ? detailedCommunity.isActivity
                : detailedCommunity.status === 'Aktif',
          } as Community & { presidentEmail?: string; shortDescription?: string };

          Logger.log('Topluluk detayı başarıyla yüklendi:', {
            id: detailedCommunity.id,
            name: detailedCommunity.name,
            email: this.editingCommunity.email,
            presidentEmail: this.editingCommunity.presidentEmail,
          });
        },
        error: (err) => {
          // Hata durumunda mevcut (liste) verisini kullanmaya devam et
          // editingCommunity zaten set edildi, bu yüzden kullanıcı formu görebilir
          if (err.status === 404) {
            Logger.warn(
              'Topluluk detayı alınamadı (404), mevcut liste verisi kullanılıyor:',
              community.id
            );
            // editingCommunity zaten set edildi, ek bir işlem gerekmez
          } else {
            Logger.error('Topluluk detayı yüklenirken hata:', err);
            // editingCommunity zaten set edildi, ek bir işlem gerekmez
          }
        },
      });
    }
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
      category: this.categories[0] || 'Teknoloji',
      logo: '',
      banner: '',
      status: 'Aktif',
      isActivity: true, // Varsayılan olarak aktif
      presidentEmail: '', // Topluluk başkanının email adresi (zorunlu)
    } as Community & { presidentEmail?: string; shortDescription?: string };
    this.modalType = 'new-community';
    this.isModalOpen = true;
  }

  saveCommunity() {
    if (this.editingCommunity) {
      // ID kontrolü - geçerli bir GUID olmalı
      if (
        !this.editingCommunity.id ||
        this.editingCommunity.id === '' ||
        this.editingCommunity.id.includes('mock')
      ) {
        this.showToast(
          "Topluluk ID'si geçersiz. Lütfen sayfayı yenileyip tekrar deneyin.",
          'error'
        );
        return;
      }

      // Logo ve Banner dosyalarını kontrol et
      const logoFile = (this.editingCommunity as any)?.logoFile;
      const bannerFile = (this.editingCommunity as any)?.bannerFile;

      // Base64 data URI'leri kaldır - backend bunları kabul etmiyor
      // Sadece dosya yükleme endpoint'lerini kullanacağız
      let logoUrl = this.editingCommunity.logo;
      let bannerUrl = this.editingCommunity.banner;

      // Eğer base64 data URI ise, boş string yap (dosya yükleme endpoint'i kullanılacak)
      if (logoUrl && logoUrl.startsWith('data:')) {
        logoUrl = '';
      }
      if (bannerUrl && bannerUrl.startsWith('data:')) {
        bannerUrl = '';
      }

      // CommunityService'e kaydet (communities-page'e otomatik eklenir)
      // DEBUG: editingCommunity'nin değerlerini kontrol et
      Logger.log('=== saveCommunity DEBUG ===');
      Logger.log('editingCommunity.status:', this.editingCommunity.status);
      Logger.log('editingCommunity.isActivity:', this.editingCommunity.isActivity);
      Logger.log('editingCommunity.email:', this.editingCommunity.email);
      Logger.log('editingCommunity.presidentEmail:', this.editingCommunity.presidentEmail);
      Logger.log('editingCommunity.comMail:', (this.editingCommunity as any).comMail);
      Logger.log('editingCommunity.comLeadMail:', (this.editingCommunity as any).comLeadMail);
      Logger.log('editingCommunity.miniAbout:', this.editingCommunity.miniAbout);
      Logger.log(
        'editingCommunity.shortDescription:',
        (this.editingCommunity as any).shortDescription
      );
      Logger.log('Full editingCommunity:', JSON.stringify(this.editingCommunity, null, 2));

      const communityForService = {
        ...this.editingCommunity,
        id: this.editingCommunity.id, // ID'yi açıkça ekle
        about: this.editingCommunity.about || this.editingCommunity.description || '', // Detaylı açıklama (backend ComAbout)
        description: this.editingCommunity.about || this.editingCommunity.description || '', // description da about'a eşit
        miniAbout:
          this.editingCommunity.miniAbout !== undefined && this.editingCommunity.miniAbout !== null
            ? String(this.editingCommunity.miniAbout).trim()
            : (this.editingCommunity as any).shortDescription !== undefined &&
              (this.editingCommunity as any).shortDescription !== null
            ? String((this.editingCommunity as any).shortDescription).trim()
            : '', // Kısa açıklama (backend MiniAbout)
        coverImage: bannerUrl || this.editingCommunity.coverImage || '',
        banner: bannerUrl || this.editingCommunity.coverImage || '',
        logo: logoUrl || '',
        // Email alanları - form'dan gelen değerleri kullan
        email: this.editingCommunity.email || '',
        comMail: this.editingCommunity.email || '',
        presidentEmail:
          this.editingCommunity.presidentEmail || this.editingCommunity.comLeadMail || '',
        comLeadMail:
          this.editingCommunity.presidentEmail || this.editingCommunity.comLeadMail || '',
        // Status alanını açıkça ekle (butonlardan gelen değer)
        status: this.editingCommunity.status || 'Aktif',
        // isActivity değerini doğrudan kullan (butonlar artık hem status hem isActivity'yi set ediyor)
        isActivity:
          this.editingCommunity.isActivity !== undefined
            ? this.editingCommunity.isActivity
            : this.editingCommunity.status === 'Aktif',
      };

      this.communityService.addOrUpdateCommunity(communityForService).subscribe({
        next: (updatedCommunity) => {
          const communityId = updatedCommunity.id;

          // Logo ve Banner yükleme işlemleri - forkJoin ile bekle
          const logoFile = (this.editingCommunity as any)?.logoFile;
          const bannerFile = (this.editingCommunity as any)?.bannerFile;

          // Yüklenecek görseller varsa, tamamlanmasını bekle
          const uploadTasks: any[] = [];

          if (logoFile && communityId) {
            uploadTasks.push(
              this.communityService.uploadLogo(communityId, logoFile).pipe(
                catchError((err) => {
                  Logger.error('Logo yüklenirken hata:', err);
                  return of(null); // Hata durumunda null döndür, devam et
                })
              )
            );
          }

          if (bannerFile && communityId) {
            uploadTasks.push(
              this.communityService.uploadBanner(communityId, bannerFile).pipe(
                catchError((err) => {
                  Logger.error('Banner yüklenirken hata:', err);
                  return of(null); // Hata durumunda null döndür, devam et
                })
              )
            );
          }

          // Görsel yükleme varsa bekle, yoksa direkt listeyi güncelle
          if (uploadTasks.length > 0) {
            forkJoin(uploadTasks).subscribe({
              next: (results) => {
                Logger.log('Tüm görseller yüklendi:', results);
                // Görseller yüklendikten sonra listeyi mevcut durum filtresiyle yeniden çek
                this.loadCommunitiesFromService(this.statusFilter);
                this.showToast('Topluluk ve görseller başarıyla güncellendi', 'success');
                this.closeModal();
              },
              error: (err) => {
                Logger.error('Görsel yükleme hatası:', err);
                // Hata olsa bile listeyi güncelle
                this.loadCommunitiesFromService(this.statusFilter);
                this.showToast('Topluluk güncellendi ancak bazı görseller yüklenemedi', 'error');
                this.closeModal();
              },
            });
          } else {
            // Görsel yok, sadece topluluk güncellendi
            this.loadCommunitiesFromService(this.statusFilter);
            this.showToast('Topluluk başarıyla güncellendi', 'success');
            this.closeModal();
          }
        },
        error: (error: any) => {
          // Backend'den gelen hata mesajlarını göster
          let errorMessage = 'Topluluk güncellenirken bir hata oluştu';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.status === 400) {
            // Backend validasyon hataları
            if (error.error?.message?.includes('öğrenci')) {
              errorMessage =
                'Topluluk başkanı sadece öğrenci olabilir. Lütfen öğrenci e-postası girin.';
            } else if (error.error?.message?.includes('başka bir topluluğa başkan')) {
              errorMessage = 'Bu e-posta adresi zaten başka bir topluluğa başkan olarak atanmış.';
            } else {
              errorMessage =
                error.error?.message ||
                'Geçersiz veri gönderildi. Lütfen tüm alanları kontrol ediniz.';
            }
          } else if (error.status === 404) {
            if (error.error?.message?.includes('kullanıcı bulunamadı')) {
              errorMessage =
                'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı. Lütfen geçerli bir öğrenci e-postası girin.';
            } else {
              errorMessage = 'Topluluk bulunamadı.';
            }
          } else if (error.status === 401 || error.status === 403) {
            errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (error.status === 0) {
            errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
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

      // Logo ve Banner yüklemesi zorunlu
      const logoFile = (this.newCommunity as any)?.logoFile;
      const bannerFile = (this.newCommunity as any)?.bannerFile;
      if (!logoFile) {
        this.showToast('Lütfen topluluk logosu yükleyin.', 'error');
        return;
      }
      if (!bannerFile) {
        this.showToast('Lütfen topluluk kapak görseli (banner) yükleyin.', 'error');
        return;
      }

      // Base64 data URI'leri kaldır - backend bunları kabul etmiyor
      // Sadece dosya yükleme endpoint'lerini kullanacağız
      let logoUrl = this.newCommunity.logo;
      let bannerUrl = this.newCommunity.banner;

      // Eğer base64 data URI ise, boş string yap (dosya yükleme endpoint'i kullanılacak)
      if (logoUrl && logoUrl.startsWith('data:')) {
        logoUrl = '';
      }
      if (bannerUrl && bannerUrl.startsWith('data:')) {
        bannerUrl = '';
      }

      // CommunityService'e kaydet (communities-page'e otomatik eklenir)
      const communityForService = {
        ...this.newCommunity,
        id: '', // Service otomatik ID (Guid) atayacak - string olmalı
        miniAbout: (this.newCommunity as any).shortDescription || '', // Kısa açıklama miniAbout'a (backend MiniAbout)
        about: this.newCommunity.about || '', // Detaylı açıklama about'a (backend ComAbout)
        description: this.newCommunity.about || '', // description da about'a eşit
        coverImage: bannerUrl || '',
        banner: bannerUrl || '',
        logo: logoUrl || '',
        presidentEmail: presidentEmail.trim(),
        status: this.newCommunity.status || 'Aktif', // Status'u ekle
      } as Community & { presidentEmail?: string; shortDescription?: string };

      this.communityService.addOrUpdateCommunity(communityForService).subscribe({
        next: (createdCommunity) => {
          const communityId = createdCommunity.id;

          // Logo ve Banner yükleme işlemleri - forkJoin ile bekle
          const logoFile = (this.newCommunity as any)?.logoFile;
          const bannerFile = (this.newCommunity as any)?.bannerFile;

          // Yüklenecek görseller varsa, tamamlanmasını bekle
          const uploadTasks: any[] = [];

          if (logoFile && communityId) {
            uploadTasks.push(
              this.communityService.uploadLogo(communityId, logoFile).pipe(
                catchError((err) => {
                  Logger.error('Logo yüklenirken hata:', err);
                  return of(null);
                })
              )
            );
          }

          if (bannerFile && communityId) {
            uploadTasks.push(
              this.communityService.uploadBanner(communityId, bannerFile).pipe(
                catchError((err) => {
                  Logger.error('Banner yüklenirken hata:', err);
                  return of(null);
                })
              )
            );
          }

          // Görsel yükleme varsa bekle, yoksa direkt tamamla
          if (uploadTasks.length > 0) {
            forkJoin(uploadTasks).subscribe({
              next: (results) => {
                Logger.log('Tüm görseller yüklendi:', results);
                this.loadCommunitiesFromService(this.statusFilter);
                this.showToast('Topluluk ve görseller başarıyla eklendi', 'success');
                this.closeModal();
                this.newCommunity = null;
              },
              error: (err) => {
                Logger.error('Görsel yükleme hatası:', err);
                this.loadCommunitiesFromService(this.statusFilter);
                this.showToast('Topluluk eklendi ancak bazı görseller yüklenemedi', 'error');
                this.closeModal();
                this.newCommunity = null;
              },
            });
          } else {
            // Görsel yok, sadece topluluk eklendi
            this.loadCommunitiesFromService(this.statusFilter);
            this.showToast('Topluluk başarıyla eklendi', 'success');
            this.closeModal();
            this.newCommunity = null;
          }
        },
        error: (error: any) => {
          // Backend'den gelen hata mesajlarını göster
          let errorMessage = 'Topluluk oluşturulurken bir hata oluştu';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.status === 400) {
            // Backend validasyon hataları
            if (error.error?.message?.includes('öğrenci')) {
              errorMessage =
                'Topluluk başkanı sadece öğrenci olabilir. Lütfen öğrenci e-postası girin.';
            } else if (error.error?.message?.includes('başka bir topluluğa başkan')) {
              errorMessage = 'Bu e-posta adresi zaten başka bir topluluğa başkan olarak atanmış.';
            } else {
              errorMessage =
                error.error?.message ||
                'Geçersiz veri gönderildi. Lütfen tüm alanları kontrol ediniz.';
            }
          } else if (error.status === 404) {
            if (error.error?.message?.includes('kullanıcı bulunamadı')) {
              errorMessage =
                'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı. Lütfen geçerli bir öğrenci e-postası girin.';
            } else {
              errorMessage = 'Topluluk bulunamadı.';
            }
          } else if (error.status === 401 || error.status === 403) {
            errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (error.status === 0) {
            errorMessage = 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol ediniz.';
          }

          this.showToast(errorMessage, 'error');
        },
      });
    }
  }

  // Topluluk silme modalı (silme nedeni zorunlu)
  isDeleteCommunityModalOpen = false;
  communityToDelete: { id: string; name: string } | null = null;
  deleteReasonCommunity = '';

  deleteCommunity() {
    if (!this.editingCommunity) {
      this.showToast('Silinecek topluluk bulunamadı.', 'error');
      return;
    }
    const communityId = this.editingCommunity.id;
    if (!communityId || communityId === '' || communityId.includes('mock')) {
      this.showToast("Topluluk ID'si geçersiz. Lütfen sayfayı yenileyip tekrar deneyin.", 'error');
      return;
    }
    this.communityToDelete = { id: communityId, name: this.editingCommunity.name || 'bu topluluk' };
    this.deleteReasonCommunity = '';
    this.isDeleteCommunityModalOpen = true;
  }

  closeDeleteCommunityModal() {
    this.isDeleteCommunityModalOpen = false;
    this.communityToDelete = null;
    this.deleteReasonCommunity = '';
  }

  /** Silinmiş topluluk detayında sadece Kapat gösterilir; Kaydet/Sil gösterilmez. */
  isEditingCommunityDeleted(): boolean {
    return (this.editingCommunity?.status as string) === 'Silinmiş';
  }

  confirmDeleteCommunity() {
    if (!this.communityToDelete) return;
    const reason = this.deleteReasonCommunity?.trim() || '';
    if (!reason) {
      this.showToast('Lütfen topluluğu silme nedenini yazınız.', 'error');
      return;
    }
    const communityId = this.communityToDelete.id;
    this.closeDeleteCommunityModal();
    this.performDeleteCommunity(communityId, reason);
  }

  private performDeleteCommunity(communityId: string, reason: string) {
    this.communityService.deleteCommunity(communityId, reason).subscribe({
      next: (response) => {
        Logger.log('Topluluk başarıyla silindi - ID:', communityId);
        Logger.log('Response (204 No Content):', response);

        // Önce editingCommunity, selectedCommunity ve reddetme state'ini temizle
        this.editingCommunity = null;
        this.selectedCommunity = null;
        this.communityToReject = null;
        this.rejectionReasonCommunity = '';

        // Modal'ı kapat
        this.closeModal();

        // Listelerden topluluğu kaldır
        const index = this.allCommunities.findIndex((c) => c.id === communityId);
        if (index !== -1) {
          this.allCommunities.splice(index, 1);
          Logger.log('allCommunities listesinden kaldırıldı');
        }

        const filteredIndex = this.filteredCommunities.findIndex((c) => c.id === communityId);
        if (filteredIndex !== -1) {
          this.filteredCommunities.splice(filteredIndex, 1);
          Logger.log('filteredCommunities listesinden kaldırıldı');
        }

        const communitiesIndex = this.communities.findIndex((c) => c.id === communityId);
        if (communitiesIndex !== -1) {
          this.communities.splice(communitiesIndex, 1);
          Logger.log('communities listesinden kaldırıldı');
        }

        // Filtreleri uygula (liste güncellenmiş olacak)
        this.applyFilters();

        // Listeyi mevcut durum filtresiyle yeniden yükle. status != "all" iken backend DeletedAt==null
        // döndürür; böylece silinen topluluk listede görünmez. status=all (Tüm Durumlar) ise silinenler de gelir.
        this.loadCommunitiesFromService(this.statusFilter);

        this.showToast('Topluluk başarıyla silindi', 'success');
      },
      error: (err) => {
        Logger.error('Topluluk silme hatası:', err);
        Logger.error('Error status:', err.status);
        Logger.error('Error message:', err.message);
        Logger.error('Error object:', err);

        let errorMessage = 'Topluluk silinirken bir hata oluştu';

        if (err.status === 401) {
          errorMessage = 'Oturum açmanız gerekiyor. Lütfen tekrar giriş yapın.';
        } else if (err.status === 403) {
          errorMessage = err.error?.message || 'Bu işlem için yetkiniz bulunmamaktadır.';
        } else if (err.status === 404) {
          errorMessage = 'Topluluk bulunamadı. Zaten silinmiş olabilir.';
        } else if (err.status === 500) {
          errorMessage = err.error?.message || 'Sunucu hatası oluştu. Lütfen tekrar deneyin.';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        this.showToast(errorMessage, 'error');
      },
    });
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

  // Güncelleme için file upload handlers (backend'e yükleme için)
  onLogoFileSelected(file: File) {
    if (this.editingCommunity) {
      // File'ı sakla, topluluk güncellendikten sonra yüklenecek
      (this.editingCommunity as any).logoFile = file;
      // Preview için base64 oku
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.editingCommunity) {
          this.editingCommunity.logo = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onBannerFileSelected(file: File) {
    if (this.editingCommunity) {
      // File'ı sakla, topluluk güncellendikten sonra yüklenecek
      (this.editingCommunity as any).bannerFile = file;
      // Preview için base64 oku
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.editingCommunity) {
          this.editingCommunity.banner = e.target.result;
        }
      };
      reader.readAsDataURL(file);
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

  // Yeni topluluk için file upload handlers (backend'e yükleme için)
  onNewLogoFileSelected(file: File) {
    if (this.newCommunity) {
      // File'ı sakla, topluluk oluşturulduktan sonra yüklenecek
      (this.newCommunity as any).logoFile = file;
      // Preview için base64 oku
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.newCommunity) {
          this.newCommunity.logo = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onNewBannerFileSelected(file: File) {
    if (this.newCommunity) {
      // File'ı sakla, topluluk oluşturulduktan sonra yüklenecek
      (this.newCommunity as any).bannerFile = file;
      // Preview için base64 oku
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.newCommunity) {
          this.newCommunity.banner = e.target.result;
        }
      };
      reader.readAsDataURL(file);
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
  }

  handleSettingsClick() {
    this.isProfileOpen = false;
    this.switchTab('settings');
  }

  handleLogoutClick() {
    this.isProfileOpen = false;
    this.logout();
  }

  // Image error handler - Placeholder görsellerin sürekli istek atmasını engeller
  onImageError(
    event: Event,
    type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar' = 'event'
  ): void {
    this.imageErrorHandler.handleImageError(event, type);
  }

  /** Kartlarda banner/logo yoksa veya 404'te kullanılacak güvenli placeholder URL */
  getPlaceholderCoverUrl(): string {
    return this.imageErrorHandler.getPlaceholderUrl('cover');
  }
  getPlaceholderLogoUrl(): string {
    return this.imageErrorHandler.getPlaceholderUrl('logo');
  }

  logout() {
    // Local storage'ı temizle
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('user_type');
    localStorage.removeItem('community_info');

    // Anasayfaya yönlendir
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Buton tıklaması ise işlem yapma
    if (
      target.closest('.icon-btn.notification') ||
      target.closest('.notification-btn') ||
      target.closest('.profile-pic') ||
      target.closest('.profile-info')
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

  // Unified Profile Dropdown Helpers
  navigateToDashboard() {
    this.isProfileOpen = false;
    this.activeTab = 'overview';
    this.switchTab('overview');
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  getRoleDisplayName(): string {
    return 'Kurumsal Hesap';
  }

  getDashboardLabel(): string {
    return 'Panelim';
  }

  getDashboardIcon(): string {
    return 'business';
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

    // Tüm içeriği birleştir - ETKİNLİK DETAYINDAKİ TÜM VERİLER
    const fullText = [
      // Başlık
      ev.eventName || '',
      // Açıklamalar
      body || '',
      // Kategori
      ev.category ? `Kategori: ${ev.category}` : '',
      // Konum bilgileri
      ev.location ? `Konum: ${ev.location}` : '',
      ev.city ? `Şehir: ${ev.city}` : '',
      // Kapasite
      ev.capacity ? `Kontenjan: ${ev.capacity}` : '',
      // Topluluk bilgisi
      ev.communityName ? `Topluluk: ${ev.communityName}` : '',
      // Notlar (eğer varsa)
      (ev as any).notes ? `Notlar: ${(ev as any).notes}` : '',
      // Tarih bilgileri
      ev.startDate ? `Başlangıç: ${ev.startDate}` : '',
      ev.endDate ? `Bitiş: ${ev.endDate}` : '',
      ev.date ? `Tarih: ${ev.date}` : '',
      // Diğer alanlar
      (ev as any).title ? `Başlık: ${(ev as any).title}` : '',
      (ev as any).eventType ? `Etkinlik Tipi: ${(ev as any).eventType}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    // Debug: Gönderilen veriyi logla
    Logger.log('[Spam Check] Sending full event data:', {
      eventId: id,
      eventName: ev.eventName,
      fullText: fullText.substring(0, 200) + '...', // İlk 200 karakter
      fullTextLength: fullText.length,
    });

    // SpamService kullanarak spam kontrolü yap
    this.spamService
      .checkSpam(fullText)
      .pipe(
        catchError((error) => {
          // Hata durumunda
          let errorMessage = 'Spam kontrolü sırasında bir hata oluştu.';

          // CORS hatası ve SSL sertifika hatası kontrolü
          if (error.name === 'HttpErrorResponse' && error.status === 0) {
            const errorMsg = error.message || '';
            if (errorMsg.includes('CORS') || errorMsg.includes('Access-Control')) {
              errorMessage =
                'Spam filter servisi CORS hatası veriyor. Sunucu yöneticisiyle iletişime geçin.';
            } else if (
              errorMsg.includes('SSL') ||
              errorMsg.includes('certificate') ||
              errorMsg.includes('ERR_CERT')
            ) {
              errorMessage =
                'Spam filter servisinde SSL sertifika hatası var. Sunucu yöneticisiyle iletişime geçin.';
            } else {
              errorMessage =
                'Spam filter servisine bağlanılamıyor. Lütfen daha sonra tekrar deneyin.';
            }
          } else if (
            error.error &&
            typeof error.error === 'string' &&
            error.error.includes('<!DOCTYPE')
          ) {
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
          if (!response) {
            const errorMessage = 'Backend yanıtı boş.';
            this.spamResults.set(id, { clean: false, message: errorMessage });
            this.showToast(errorMessage, 'error');
            this.checkingSpamEvents.delete(id);
            this.inspectedEvents.add(id);
            return;
          }

          // Backend formatı:
          // {
          //   "analysis": { "forbidden": {...}, "spam": {...}, "politics": {...} },
          //   "moderation": { "status": "yeniden_admin_kontrolu_politics" | "kabul" | ..., "reason": [], "scores": {...}, "politics_keywords": [...] },
          //   "highlighted": {...}
          // }
          const analysis = response.analysis || {};
          const moderation = response.moderation || {};

          // Analysis'den verileri al
          let forbiddenData = analysis.forbidden || { count: 0, words: [] };
          let spamData = analysis.spam || { count: 0, keywords: [] };
          let politicsData = analysis.politics || { count: 0, keywords: [] };

          // Veri yapısını normalize et (array garantisi)
          forbiddenData = {
            count: forbiddenData.count || 0,
            words: Array.isArray(forbiddenData.words) ? forbiddenData.words : [],
          };
          spamData = {
            count: spamData.count || 0,
            keywords: Array.isArray(spamData.keywords) ? spamData.keywords : [],
          };
          politicsData = {
            count: politicsData.count || 0,
            keywords: Array.isArray(politicsData.keywords) ? politicsData.keywords : [],
          };

          // Eğer analysis'de keywords yoksa, moderation'dan al
          // Backend bazen keywords'leri moderation içinde gönderiyor
          if (
            moderation.politics_keywords &&
            Array.isArray(moderation.politics_keywords) &&
            moderation.politics_keywords.length > 0
          ) {
            // Moderation'dan gelen keywords'leri politics'e ekle
            politicsData = {
              ...politicsData,
              keywords: moderation.politics_keywords,
              count: moderation.politics_keywords.length,
            };
          }

          // Forbidden words için de kontrol et (eğer moderation'da varsa)
          if (
            moderation.forbidden_keywords &&
            Array.isArray(moderation.forbidden_keywords) &&
            moderation.forbidden_keywords.length > 0
          ) {
            forbiddenData = {
              ...forbiddenData,
              words: moderation.forbidden_keywords,
              count: moderation.forbidden_keywords.length,
            };
          }

          // Spam keywords için de kontrol et
          if (
            moderation.spam_keywords &&
            Array.isArray(moderation.spam_keywords) &&
            moderation.spam_keywords.length > 0
          ) {
            spamData = {
              ...spamData,
              keywords: moderation.spam_keywords,
              count: moderation.spam_keywords.length,
            };
          }

          // Debug: Backend'den gelen veriyi logla
          Logger.log('[Spam Check] Backend Response:', {
            analysis,
            moderation,
            forbiddenData,
            spamData,
            politicsData,
            forbiddenWords: forbiddenData?.words,
            spamKeywords: spamData?.keywords,
            politicsKeywords: politicsData?.keywords,
            moderationPoliticsKeywords: moderation.politics_keywords,
          });

          const forbiddenCount = forbiddenData?.count || 0;
          const spamCount = spamData?.count || 0;
          const politicsCount = politicsData?.count || 0;
          const moderationStatus = moderation.status || '';

          // Eğer status'ta "politics" veya "forbidden" veya "spam" geçiyorsa ama keywords yoksa,
          // count'u 1 yap (backend keywords döndürmüyor olabilir ama sorun var)
          // ÖNEMLİ: Backend bazen status'ta sorun belirtiyor ama keywords döndürmüyor
          if (moderationStatus && moderationStatus.includes('politics')) {
            // Status'ta "politics" geçiyorsa ama keywords yoksa, yine de sorunlu olarak işaretle
            if (politicsData.count === 0 && politicsData.keywords.length === 0) {
              politicsData.count = 1;
            }
            // Eğer count > 0 ama keywords boşsa, bu da bir sorun (backend keywords döndürmemiş)
            // Bu durumda keywords'i status'tan çıkarabiliriz veya genel bir mesaj gösterebiliriz
          }
          if (moderationStatus && moderationStatus.includes('forbidden')) {
            if (forbiddenData.count === 0 && forbiddenData.words.length === 0) {
              forbiddenData.count = 1;
            }
          }
          if (moderationStatus && moderationStatus.includes('spam')) {
            if (spamData.count === 0 && spamData.keywords.length === 0) {
              spamData.count = 1;
            }
          }

          // ÖZEL DURUM: Status'ta "admin_kontrolu" geçiyorsa (politics, forbidden, spam ile birlikte)
          // ama ilgili kategori için count 0 ve keywords boşsa, yine de sorunlu olarak işaretle
          if (moderationStatus.includes('admin_kontrolu')) {
            if (
              moderationStatus.includes('politics') &&
              politicsData.count === 0 &&
              politicsData.keywords.length === 0
            ) {
              politicsData.count = 1;
            }
            if (
              moderationStatus.includes('forbidden') &&
              forbiddenData.count === 0 &&
              forbiddenData.words.length === 0
            ) {
              forbiddenData.count = 1;
            }
            if (
              moderationStatus.includes('spam') &&
              spamData.count === 0 &&
              spamData.keywords.length === 0
            ) {
              spamData.count = 1;
            }
          }

          // Status kontrolü: "kabul" veya hiç sorun yoksa temiz
          // "yeniden_admin_kontrolu_politics", "red" gibi değerler sorunlu
          const isClean =
            moderationStatus === 'kabul' ||
            moderationStatus === 'accept' ||
            moderationStatus === 'approved' ||
            (forbiddenCount === 0 &&
              spamCount === 0 &&
              politicsCount === 0 &&
              !moderationStatus.includes('admin_kontrolu') &&
              !moderationStatus.includes('red'));

          const status = moderationStatus || (isClean ? 'kabul' : 'red');

          // Reason array'ini string'e çevir
          const reasonArray = moderation.reason || [];
          const reason = Array.isArray(reasonArray) ? reasonArray.join(', ') : reasonArray || '';

          let message = '';
          if (isClean) {
            message =
              reason || 'İçerik temizdir. Spam, yasak kelime veya siyasi içerik tespit edilmedi.';
          } else {
            const issues: string[] = [];
            if (forbiddenCount > 0) {
              const forbiddenWords = forbiddenData?.words || [];
              if (forbiddenWords.length > 0) {
                issues.push(
                  `${forbiddenCount} yasak kelime: ${forbiddenWords.slice(0, 5).join(', ')}${
                    forbiddenWords.length > 5 ? '...' : ''
                  }`
                );
              } else {
                issues.push(`${forbiddenCount} yasak kelime`);
              }
            }
            if (spamCount > 0) {
              const spamKeywords = spamData?.keywords || [];
              if (spamKeywords.length > 0) {
                issues.push(
                  `${spamCount} spam kelimesi: ${spamKeywords.slice(0, 5).join(', ')}${
                    spamKeywords.length > 5 ? '...' : ''
                  }`
                );
              } else {
                issues.push(`${spamCount} spam kelimesi`);
              }
            }
            if (politicsCount > 0) {
              const politicsKeywords = politicsData?.keywords || [];
              if (politicsKeywords.length > 0) {
                issues.push(
                  `${politicsCount} siyasi içerik: ${politicsKeywords.slice(0, 5).join(', ')}${
                    politicsKeywords.length > 5 ? '...' : ''
                  }`
                );
              } else {
                // Keywords boş ama status'ta "politics" geçiyorsa, backend algılamış ama keywords döndürmemiş
                issues.push(
                  `${politicsCount} siyasi içerik tespit edildi (detaylar backend'de mevcut değil)`
                );
              }
            }
            message =
              issues.length > 0
                ? `İçerikte sorun tespit edildi: ${issues.join('; ')}.`
                : 'İçerik kontrol edilmeli.';
          }

          // Spam sonuçlarını kaydet (tüm detayları sakla)
          this.spamResults.set(id, {
            clean: isClean,
            message: message,
            status: status,
            reason: reason,
            analysis: response.analysis,
            moderation: response.moderation,
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
        error: (error: any) => {
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
    moderation?: any;
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

    // Veri yapısını garanti altına al
    const report = {
      clean: result.clean,
      message: result.message,
      status: result.status,
      reason: result.reason,
      reasons: reasons.length > 0 ? reasons : undefined,
      details: details.length > 0 ? details : undefined,
      forbidden: result.forbidden
        ? {
            count: result.forbidden.count || 0,
            words: Array.isArray(result.forbidden.words) ? result.forbidden.words : [],
          }
        : undefined,
      spam: result.spam
        ? {
            count: result.spam.count || 0,
            keywords: Array.isArray(result.spam.keywords) ? result.spam.keywords : [],
          }
        : undefined,
      politics: result.politics
        ? {
            count: result.politics.count || 0,
            keywords: Array.isArray(result.politics.keywords) ? result.politics.keywords : [],
          }
        : undefined,
      moderation: result.moderation, // Moderation scores ve diğer detaylar
    };

    // Debug: Rapor verisini logla
    Logger.log('[Spam Report] Generated report:', report);

    return report;
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
          Logger.error('Etkinlik onaylanamadı:', err);
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
        Logger.error('Etkinlik reddedilemedi:', err);
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

    // Backend'e event oluştur
    // Tarih formatını parse et - EventItem'da startDate string (ISO format) tipinde
    let startDate: string | undefined = undefined;
    if (this.newEvent.date) {
      try {
        const dateObj = new Date(this.newEvent.date);
        if (!isNaN(dateObj.getTime())) {
          startDate = dateObj.toISOString();
        }
      } catch (e) {
        Logger.warn('Tarih parse edilemedi:', e);
      }
    }

    const eventData: Partial<EventItem> = {
      title: this.newEvent.eventName,
      location: this.newEvent.location || '',
      description: this.newEvent.description || '',
      quota: this.newEvent.capacity ? parseInt(this.newEvent.capacity) : undefined,
      imageUrl: this.newEvent.imageUrl || undefined,
      startDate: startDate,
    };

    this.eventService.createEvent(eventData).subscribe({
      next: (response) => {
        const eventId = response.eventId;

        // Eğer fotoğraf seçildiyse, event ID alındıktan sonra yükle
        if (this.pendingNewEventImage) {
          this.eventService.uploadEventImage(eventId, this.pendingNewEventImage).subscribe({
            next: (imageResponse) => {
              // Fotoğraf yüklendi
              const imagePath = imageResponse.ImagePath || imageResponse.imagePath || '';
              this.loadEventsFromService();
              this.showToast('Etkinlik ve görsel başarıyla eklendi', 'success');
              this.pendingNewEventImage = null;
              this.closeModal();
            },
            error: (err) => {
              // Fotoğraf yüklenemedi ama etkinlik oluşturuldu
              Logger.error('Görsel yüklenemedi:', err);
              this.loadEventsFromService();
              this.showToast('Etkinlik eklendi ancak görsel yüklenemedi', 'error');
              this.pendingNewEventImage = null;
              this.closeModal();
            },
          });
        } else {
          // Fotoğraf yok, sadece etkinlik oluşturuldu
          this.loadEventsFromService();
          this.showToast('Etkinlik başarıyla eklendi', 'success');
          this.closeModal();
        }
      },
      error: (error) => {
        Logger.error('Etkinlik oluşturulamadı:', error);
        this.showToast('Etkinlik oluşturulamadı', 'error');
      },
    });
  }

  deleteEvent(id: number) {
    // Backend'den etkinliği sil
    this.eventService.deleteEvent(id).subscribe({
      next: () => {
        // Başarılı - etkinlikleri backend'den yeniden yükle
        this.loadEventsFromService();
        this.showToast('Etkinlik başarıyla silindi.', 'success');

        // Eğer silinen etkinlik detail modal'da açıksa, modal'ı kapat
        if (this.selectedEvent && this.selectedEvent.id === id) {
          this.closeModal();
        }
      },
      error: (err: any) => {
        Logger.error('Etkinlik silinirken hata:', err);
        let errorMsg = 'Etkinlik silinirken bir hata oluştu.';
        if (err.status === 401 || err.status === 403) {
          errorMsg = 'Bu işlem için yetkiniz bulunmamaktadır.';
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }
        this.showToast(errorMsg, 'error');
      },
    });
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
      'edit-announcement',
    ];
    return preventCloseTypes.includes(this.modalType);
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
    this.modalType = '';
    this.editingAnnouncement = null;
    this.selectedAnnouncement = null;
    this.communityToApprove = null;
    this.communityToReject = null;
  }

  // Duyuru detay ve güncelleme
  openAnnouncementDetail(announcement: Announcement) {
    this.selectedAnnouncement = announcement;
    // Önce mevcut veriyi kullan (hızlı açılış için)
    this.editingAnnouncement = { ...announcement };
    this.modalType = 'edit-announcement';
    this.isModalOpen = true;

    // Backend'den detay bilgisini çek (link bilgisi dahil tüm detaylar için)
    if (announcement.id) {
      this.announcementService.getAnnouncementById(announcement.id).subscribe({
        next: (detailedAnnouncement) => {
          if (detailedAnnouncement) {
            // Backend'den gelen detaylı bilgileri kullan
            this.editingAnnouncement = { ...detailedAnnouncement };
          }
        },
        error: (err) => {
          // Detay çekilemezse mevcut veriyi kullan (zaten set edildi)
          Logger.warn('Duyuru detayı alınamadı, mevcut veri kullanılıyor:', err);
        },
      });
    }
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
        image: '', // Görsel daha sonra yüklenecek
        link: this.newAnnouncement.link?.trim(),
        date: new Date().toISOString(), // ISO 8601 formatında tam tarih-saat
      })
      .subscribe({
        next: (announcementId) => {
          // Duyuru oluşturuldu, şimdi bekleyen görsel varsa yükle
          if (this.pendingNewAnnouncementImage) {
            this.announcementService
              .uploadImage(announcementId, this.pendingNewAnnouncementImage)
              .subscribe({
                next: (imagePath) => {
                  // Görsel yüklendi, duyuruları yeniden yükle
                  this.loadAnnouncementsFromService();
                  this.showToast('Duyuru ve görsel başarıyla yayınlandı', 'success');
                  this.resetNewAnnouncementForm();
                  this.closeModal();
                },
                error: (err) => {
                  // Görsel yüklenemedi ama duyuru oluşturuldu
                  Logger.error('Görsel yüklenemedi:', err);
                  this.loadAnnouncementsFromService();
                  this.showToast('Duyuru oluşturuldu ancak görsel yüklenemedi', 'error');
                  this.resetNewAnnouncementForm();
                  this.closeModal();
                },
              });
          } else {
            // Görsel yok, sadece duyuru oluşturuldu
            this.loadAnnouncementsFromService();
            this.showToast('Duyuru başarıyla yayınlandı', 'success');
            this.resetNewAnnouncementForm();
            this.closeModal();
          }
        },
        error: (error: any) => {
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
      this.showToast('Duyuru bilgisi bulunamadı', 'error');
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

    // DEBUG: Component'ten gönderilen veriyi kontrol et
    Logger.log('=== updateAnnouncement Component DEBUG ===');
    Logger.log('editingAnnouncement.title:', this.editingAnnouncement.title);
    Logger.log('editingAnnouncement.title type:', typeof this.editingAnnouncement.title);
    Logger.log('editingAnnouncement.title length:', this.editingAnnouncement.title?.length);
    Logger.log('Full editingAnnouncement:', JSON.stringify(this.editingAnnouncement, null, 2));

    this.announcementService
      .updateAnnouncement(announcementId, {
        title: this.editingAnnouncement.title || '', // Fallback: boş string yerine undefined kontrolü
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
            this.announcementService
              .uploadImage(announcementId, this.pendingEditAnnouncementImage)
              .subscribe({
                next: (imagePath: any) => {
                  // Görsel yüklendi
                  this.loadAnnouncementsFromService();
                  this.showToast('Duyuru ve görsel başarıyla güncellendi', 'success');
                  this.pendingEditAnnouncementImage = null;
                  this.closeModal();
                },
                error: (err: any) => {
                  // Görsel yüklenemedi ama duyuru güncellendi
                  Logger.error('Görsel yüklenemedi:', err);
                  this.loadAnnouncementsFromService();
                  this.showToast('Duyuru güncellendi ancak görsel yüklenemedi', 'error');
                  this.pendingEditAnnouncementImage = null;
                  this.closeModal();
                },
              });
          } else {
            // Görsel yok, sadece duyuru güncellendi
            this.loadAnnouncementsFromService();
            this.showToast('Duyuru başarıyla güncellendi', 'success');
            this.closeModal();
          }
        },
        error: (error: any) => {
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

    const announcementId = this.editingAnnouncement.id;
    const announcementTitle = this.editingAnnouncement.title || 'bu duyuru';

    // Onay modal'ını aç
    this.openConfirmModal(
      `"${announcementTitle}" duyurusunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      () => {
        this.performDeleteAnnouncement(announcementId);
      }
    );
  }

  private performDeleteAnnouncement(announcementId: number) {
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

  // Etkinlik fotoğraf işlemleri
  onNewEventImageSelected(imageUrl: string) {
    if (this.newEvent) {
      this.newEvent.imageUrl = imageUrl;
    }
  }

  onNewEventFileSelected(file: File) {
    // Dosyayı sakla, event ID alındıktan sonra yüklenecek
    this.pendingNewEventImage = file;
    // Kullanıcıya önizleme göstermek için Base64'e çevir
    const reader = new FileReader();
    reader.onload = () => {
      if (this.newEvent) {
        this.newEvent.imageUrl = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
    this.showToast('Görsel seçildi, etkinlik kaydedildiğinde yüklenecek', 'success');
  }

  onEditEventImageSelected(imageUrl: string) {
    if (this.selectedEvent) {
      this.selectedEvent.imageUrl = imageUrl;
    }
  }

  onEditEventFileSelected(file: File) {
    // Düzenleme modunda: Dosyayı sakla, güncelleme sırasında yüklenecek
    this.pendingEditEventImage = file;
    // Kullanıcıya önizleme göstermek için Base64'e çevir
    const reader = new FileReader();
    reader.onload = () => {
      if (this.selectedEvent) {
        this.selectedEvent.imageUrl = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
    this.showToast('Görsel seçildi, etkinlik güncellendiğinde yüklenecek', 'success');
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
