import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ImageUploadComponent } from '../../components/ui/image-upload/image-upload';
import { CommunityService, Community } from '../../services/community.services';
import { UpdateCommunityDto } from '../../models/community.models';
import { EventService } from '../../services/event.services';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { AfkDetectionService } from '../../services/afk-detection.service';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';
import { catchError, switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { SpamService } from '../../services/spam.service';
import { Logger } from '../../utils/logger.util';
import { TurkishUppercasePipe } from '../../pipes/turkish-uppercase.pipe';

// --- Interfaces ---
interface Project {
  id: number;
  name: string;
  status: 'Yayında' | 'Onay Bekliyor' | 'Taslak' | 'Reddedildi';
  progress: number;
  budget: number;
  deadline: string;
  category: string;
  isPromoted?: boolean;
}
interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
  targetTab?: string;
  targetRoute?: string;
}
interface Collaboration {
  id: string; // Guid (string)
  clubName: string;
  university: string;
  description: string;
  logo: string;
  coverImage?: string;
  memberCount?: number;
  city?: string;
  category?: string;
}

interface DashboardEvent {
  id: number;
  title: string;
  status: 'approved' | 'pending' | 'rejected';
  imageUrl: string;
  date: string;
  startDateIso: string;
  location: string;
  category: string;
  description: string;
  shortDescription?: string;
  rejectionReason?: string;
  time?: string;
  quota?: number;
}

@Component({
  selector: 'app-community-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ImageUploadComponent,
    LumaSpinComponent,
    ToastComponent,
    TurkishUppercasePipe,
  ],
  templateUrl: './community-dashboard.component.html',
  styleUrls: ['./community-dashboard.component.scss'],
})
export class CommunityDashboardComponent implements OnInit, OnDestroy {
  activeTab: string = 'overview';

  // UI State
  isSidebarCollapsed: boolean = false;
  isModalOpen: boolean = false;
  isProfileOpen: boolean = false;
  showNotifications: boolean = false;

  // Unified Profile Dropdown Identity
  userRole: string = 'community';
  userName: string = '';
  displayName: string = '';
  userInitial: string = '';
  activeRowMenuId: number | null = null;
  modalType: 'new-event' | 'new-project' | null = null;
  confirmDeleteId: number | null = null;
  confirmDeleteType: 'event' = 'event';
  confirmVisible = false;
  confirmHiding = false;
  private confirmTimer: any;
  private toastTimer: any;
  /** Kurumsal'da başkan e-postası onaylandığında eski başkanı hesaptan çıkarmak için periyodik lead-by-me kontrolü */
  private accessCheckIntervalId: ReturnType<typeof setInterval> | null = null;
  showBannerModal = false;
  showAvatarModal = false;
  /** Güncelle ve Onaya Gönder ile birlikte yüklenecek; hemen sunucuya gitmez */
  pendingBannerFile: File | null = null;
  pendingLogoFile: File | null = null;
  initialClubInfo: any = {};

  // Eksik olan değişken eklendi
  selectedEvent: DashboardEvent | null = null;
  isEditingEventDetail = false; // Event detail modal'da inline editing için
  editedEventData: any = {}; // Düzenlenen event verileri

  // Rejection reason modal
  showRejectionModal = false;
  selectedRejectionReason: string = '';
  rejectedEventToEdit: DashboardEvent | null = null;

  // Event editing state
  editingEventId: number | null = null;

  // Event creation modal
  newEventData = {
    title: '',
    shortDescription: '',
    date: '',
    time: '',
    location: '',
    quota: '',
    description: '',
    image: '', // Base64 preview için
    imageFile: null as File | null, // Backend'e yüklenecek dosya
  };

  /** Profilim sekmesi: Kategori dropdown seçenekleri (community-register ile aynı) */
  profileCategories: string[] = [
    'Teknoloji',
    'Sanat',
    'Spor',
    'Kariyer',
    'Kültür',
    'Bilim',
    'Sosyal',
    'Müzik',
    'Genel',
  ];

  /** Profilim sekmesi: Şehir dropdown seçenekleri (community-register ile aynı) */
  profileCities: string[] = [
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

  eventCategories: string[] = [
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
    'Uluslararası Gençlik Çalışmaları',
  ];

  // Form Data
  newProjectData = { name: '', category: 'Teknoloji', budget: 0, deadline: '' };

  // Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  // --- DATA ---
  clubInfo: any = {
    id: '', // Community ID (Guid) - will be loaded from backend
    name: '', // Will be loaded from backend
    university: '',
    city: '',
    category: 'Genel',
    logo: 'https://ui-avatars.com/api/?name=UNIDES&background=14d2cc&color=fff&size=128',
    banner: 'assets/img/placeholder-cover.svg',
    balance: 0,
    email: '',
    phone: '',
    instagram: '',
    description: '',
    miniAbout: '', // Topluluk kısa açıklaması (kartlarda/özetlerde)
  };

  stats = { totalMembers: 0, approvedEvents: 0, pendingEvents: 0, totalEvents: 0 };
  statusFilter: 'all' | 'approved' | 'pending' | 'rejected' = 'all';
  statusLabels = {
    approved: 'Onaylanan Etkinlik',
    pending: 'Onaya Gönderilen',
    rejected: 'Reddedilen Etkinlik',
  };

  // Events loaded from backend via loadCommunityEvents()
  dashboardEvents: DashboardEvent[] = [];

  // Projects - Frontend-only feature (no backend endpoint)
  projects: Project[] = [];

  notifications: Notification[] = [
    { id: 1, text: 'TÜBİTAK onayı', time: '2 saat önce', read: false, targetTab: 'projects' },
  ];

  collaborations: Collaboration[] = [];
  filteredCollaborations: Collaboration[] = [];
  collabCurrentPage = 1;
  collabPerPage = 15;

  // Filters (Communities page parity)
  searchText: string = '';
  selectedCity: string = '';
  selectedCategory: string = '';
  sortOrder: 'default' | 'member_desc' | 'member_asc' = 'default';
  cities: string[] = [];
  categories: string[] = [];
  isLoading = true;

  /** Topluluk onaylı mı? null = yükleniyor, true = onaylı, false = onay bekliyor (ilk kayıt veya güncelleme) */
  communityApproved: boolean | null = null;
  /** Onay beklerken girişe izin: true = güncelleme onayı bekliyor (dashboard açık, Profil salt okunur), false = ilk kayıt onayı (dashboard kapalı) */
  isUpdatePending = false;

  /** Profilim sekmesinden topluluk güncelleme gönderiliyor mu */
  isSavingProfile = false;

  // Loading states for different data
  isLoadingCommunity = true;
  isLoadingEvents = true;

  // Spam kontrolü için değişkenler
  inspectedEvents: Set<number> = new Set();
  checkingSpamEvents: Set<number> = new Set();
  spamResults: Map<number, { clean: boolean; message: string }> = new Map();

  constructor(
    private router: Router,
    private communityService: CommunityService,
    private eventService: EventService,
    private http: HttpClient,
    private afkDetectionService: AfkDetectionService,
    private spamService: SpamService,
    private imageErrorHandler: ImageErrorHandlerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // AFK Detection'ı başlat
      this.afkDetectionService.start();

      // Check query params for tab
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam) {
        this.activeTab = tabParam;
      }

      this.loadCommunityProfile();
      this.loadCommunities();
      // Unified Profile Dropdown Initialization
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          this.userName = userInfo.name || userInfo.fullName || 'Topluluk';
          this.displayName = this.userName;
          this.userInitial = this.userName.charAt(0).toUpperCase();
        } catch (e) {
          Logger.error('Error parsing user info:', e);
        }
      }
    }
  }

  /**
   * Load the community profile for the logged-in user
   * Finds the community where the user is the president (ComLeadMail matches user email)
   *
   * NOTE: CommunityMiniDto doesn't include ComLeadMail, so we need to check each community's detail
   */
  private loadCommunityProfile(): void {
    const userInfoStr = localStorage.getItem('user_info');
    if (!userInfoStr) {
      Logger.warn('User info not found in localStorage');
      this.communityApproved = false;
      return;
    }

    try {
      // Önce "lead-by-me" ile kendi topluluğunu getir (onay bekleyen dahil)
      this.communityService.getMyLeadCommunity().subscribe({
        next: (community) => {
          // Aynı başkan e-postasına sahip birden fazla toplulukta lead-by-me reddedilmiş/silinmiş dönebilir.
          // Panelde her zaman aktif veya onay bekleyen topluluk gösterilmeli; reddedilmiş/silinmiş dönerse
          // aktif listeden başkan e-postasına göre (yeni) topluluğu bul.
          if (community && (community.status === 'Reddedilen' || community.status === 'Silinmiş')) {
            this.showToast(
              'Topluluğunuz silinmiş veya reddedilmiş olabilir, mail adresinize gelen gerekçe ile tekrardan topluluğunuzu oluşturabilirsiniz.',
              'error'
            );
            this.loadCommunityProfileFallback();
            return;
          }
          if (community) {
            // comConfirm=4 ve pendingUpdateData varsa onaya gönderilen veriyi göster (Kurumsal Dashboard ile aynı mantık)
            const comConfirm = (community as any).comConfirm ?? (community as any).ComConfirm;
            const pendingJson = (community as any).pendingUpdateData ?? (community as any).PendingUpdateData;
            const displayCommunity =
              comConfirm === 4 && pendingJson
                ? this.communityService.applyPendingUpdateToCommunity(community, pendingJson)
                : community;
            this.clubInfo = {
              id: displayCommunity.id,
              name: displayCommunity.name,
              university: displayCommunity.university || '',
              city: displayCommunity.city || '',
              category: displayCommunity.category || 'Genel',
              logo: displayCommunity.logo || this.clubInfo.logo,
              banner: displayCommunity.banner || displayCommunity.coverImage || this.clubInfo.banner,
              email: displayCommunity.email || displayCommunity.comMail || '',
              phone: this.clubInfo.phone,
              instagram: displayCommunity.instagram || displayCommunity.instagramUrl || '',
              description: displayCommunity.about || displayCommunity.description || '',
              comMail: displayCommunity.comMail,
              comLeadMail: displayCommunity.comLeadMail,
              webSiteUrl: displayCommunity.webSiteUrl,
              instagramUrl: displayCommunity.instagramUrl,
              miniAbout: displayCommunity.miniAbout,
            };
            this.initialClubInfo = JSON.parse(JSON.stringify(this.clubInfo));
            this.displayName = displayCommunity.name || this.userName;
            this.userInitial = this.displayName.charAt(0).toUpperCase();
            this.isLoadingCommunity = false;

            // Tek kaynak: comConfirm. 1 = onaylı → buton görünsün. 4 = güncelleme onayı bekliyor → banner, buton yok. F5/çık-gir aynı kalır.
            const profileUpdatePendingFlag =
              isPlatformBrowser(this.platformId) &&
              localStorage.getItem('community_profile_update_pending') === 'true';

            if (comConfirm === 1) {
              this.communityApproved = true;
              this.isUpdatePending = false;
              if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem('community_approved', JSON.stringify(true));
                localStorage.removeItem('community_profile_update_pending');
              }
            } else if (comConfirm === 4) {
              this.communityApproved = true;
              this.isUpdatePending = true;
              if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem('community_approved', JSON.stringify(true));
                localStorage.setItem('community_profile_update_pending', 'true');
              }
            } else if (profileUpdatePendingFlag) {
              this.communityApproved = true;
              this.isUpdatePending = true;
              if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem('community_profile_update_pending', 'true');
              }
            } else {
              this.communityApproved = community.isActivity === true;
              this.isUpdatePending = false;
              if (isPlatformBrowser(this.platformId)) {
                localStorage.setItem('community_approved', JSON.stringify(this.communityApproved));
                localStorage.removeItem('community_profile_update_pending');
              }
            }

            this.isLoadingEvents = true;
            this.loadCommunityEvents(community.id);
            this.loadLeaderStats();
            this.startPeriodicAccessCheck();
            return;
          }
          // lead-by-me 404 döndüyse eski akışa düş (aktif listeden bul)
          this.loadCommunityProfileFallback();
        },
        error: (err: any) => {
          // 403: Topluluk başkanı e-postası Kurumsal'da onaylandı, eski başkanın erişimi kaldırıldı
          if (err?.status === 403) {
            this.handleCommunityAccessRevoked();
            return;
          }
          this.loadCommunityProfileFallback();
        },
      });
    } catch (e) {
      Logger.error('Error in loadCommunityProfile:', e);
      this.communityApproved = false;
    }
  }

  /**
   * Kurumsal'da başkan e-postası onaylandığında giriş yapmış eski başkanı hesaptan çıkarmak için
   * periyodik olarak lead-by-me çağrılır. 403 gelirse (başkan değişti, onaylandı) oturum kapatılır.
   */
  private startPeriodicAccessCheck(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.stopPeriodicAccessCheck();
    const intervalMs = 90 * 1000; // 90 saniye
    this.accessCheckIntervalId = setInterval(() => {
      this.communityService.getMyLeadCommunity().subscribe({
        next: () => {},
        error: (err: any) => {
          if (err?.status === 403) {
            this.stopPeriodicAccessCheck();
            this.handleCommunityAccessRevoked();
          }
        },
      });
    }, intervalMs);
  }

  private stopPeriodicAccessCheck(): void {
    if (this.accessCheckIntervalId != null) {
      clearInterval(this.accessCheckIntervalId);
      this.accessCheckIntervalId = null;
    }
  }

  /**
   * Topluluk başkanı e-postası Kurumsal Dashboard'da değiştirilip onaylandığında eski başkanın
   * panele erişimi kaldırıldığında çağrılır. Oturumu kapatır ve anasayfaya yönlendirir.
   */
  private handleCommunityAccessRevoked(): void {
    this.isLoadingCommunity = false;
    this.showToast(
      'Topluluk başkanı e-postası değişti. Bu panele erişim yetkiniz kaldırıldı.',
      'error'
    );
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_type');
    }
    this.router.navigate(['/']);
  }

  private loadCommunityProfileFallback(): void {
    const userInfoStr = localStorage.getItem('user_info');
    if (!userInfoStr) {
      this.isLoadingCommunity = false;
      this.communityApproved = false;
      return;
    }
    try {
      const userInfo = JSON.parse(userInfoStr);
      const userEmail = userInfo.email?.trim().toLowerCase();
      if (!userEmail) {
        this.isLoadingCommunity = false;
        this.communityApproved = false;
        return;
      }
      this.communityService.getAllCommunities({ status: 'active' }).subscribe({
        next: (communities) => {
          this.findUserCommunity(communities, userEmail);
        },
        error: (err: any) => {
          Logger.error('Aktif topluluklar yüklenemedi:', err);
          this.isLoadingCommunity = false;
          this.communityApproved = false;
        },
      });
    } catch (e) {
      Logger.error('Error parsing user info:', e);
      this.communityApproved = false;
    }
  }

  /**
   * Find the community where the user is president by checking each community's detail
   * (Because CommunityMiniDto doesn't include ComLeadMail)
   * Optimized: Check communities in parallel and stop when found
   */
  private findUserCommunity(communities: any[], userEmail: string): void {
    if (!communities || communities.length === 0) {
      Logger.warn('No communities found');
      return;
    }

    // Check each community's detail to find ComLeadMail
    // Use parallel requests for better performance
    let found = false;
    const checkPromises: Promise<void>[] = [];

    for (const community of communities) {
      const checkPromise = new Promise<void>((resolve) => {
        this.communityService.getCommunityById(community.id).subscribe({
          next: (communityDetail) => {
            // Check if this community's ComLeadMail matches user email
            const comLeadMail = communityDetail.comLeadMail?.trim().toLowerCase();

            if (comLeadMail === userEmail && !found) {
              found = true;

              // comConfirm=4 ve pendingUpdateData varsa onaya gönderilen veriyi göster (Kurumsal Dashboard ile aynı mantık)
              const comConfirm = (communityDetail as any).comConfirm ?? (communityDetail as any).ComConfirm;
              const pendingJson = (communityDetail as any).pendingUpdateData ?? (communityDetail as any).PendingUpdateData;
              const displayCommunity =
                comConfirm === 4 && pendingJson
                  ? this.communityService.applyPendingUpdateToCommunity(communityDetail, pendingJson)
                  : communityDetail;

              // Update clubInfo with backend data (onaya gönderilen veri varsa onu kullan)
              this.clubInfo = {
                id: displayCommunity.id,
                name: displayCommunity.name,
                university: displayCommunity.university || '',
                city: displayCommunity.city || '',
                category: displayCommunity.category || 'Genel',
                logo: displayCommunity.logo || this.clubInfo.logo,
                banner:
                  displayCommunity.banner || displayCommunity.coverImage || this.clubInfo.banner,
                email: displayCommunity.email || displayCommunity.comMail || '',
                phone: this.clubInfo.phone, // Backend'de phone yok, mevcut değeri koru
                instagram: displayCommunity.instagram || displayCommunity.instagramUrl || '',
                description: displayCommunity.about || displayCommunity.description || '',
                comMail: displayCommunity.comMail,
                comLeadMail: displayCommunity.comLeadMail,
                webSiteUrl: displayCommunity.webSiteUrl,
                instagramUrl: displayCommunity.instagramUrl,
                miniAbout: displayCommunity.miniAbout,
              };
              // Update initialClubInfo for change detection
              this.initialClubInfo = JSON.parse(JSON.stringify(this.clubInfo));

              // Update displayName to show community name (onaya gönderilen varsa onu)
              this.displayName = displayCommunity.name || this.userName;
              this.userInitial = this.displayName.charAt(0).toUpperCase();

              const profileUpdatePendingFlag =
                isPlatformBrowser(this.platformId) &&
                localStorage.getItem('community_profile_update_pending') === 'true';

              if (comConfirm === 1) {
                this.communityApproved = true;
                this.isUpdatePending = false;
                if (isPlatformBrowser(this.platformId)) {
                  localStorage.setItem('community_approved', JSON.stringify(true));
                  localStorage.removeItem('community_profile_update_pending');
                }
              } else if (comConfirm === 4) {
                this.communityApproved = true;
                this.isUpdatePending = true;
                if (isPlatformBrowser(this.platformId)) {
                  localStorage.setItem('community_approved', JSON.stringify(true));
                  localStorage.setItem('community_profile_update_pending', 'true');
                }
              } else if (profileUpdatePendingFlag) {
                this.communityApproved = true;
                this.isUpdatePending = true;
                if (isPlatformBrowser(this.platformId)) {
                  localStorage.setItem('community_profile_update_pending', 'true');
                }
              } else {
                this.communityApproved = communityDetail.isActivity === true;
                this.isUpdatePending = false;
                if (isPlatformBrowser(this.platformId)) {
                  localStorage.setItem('community_approved', JSON.stringify(this.communityApproved));
                  localStorage.removeItem('community_profile_update_pending');
                }
              }
              this.isLoadingCommunity = false;
              this.isLoadingEvents = true;
              this.loadCommunityEvents(communityDetail.id);
              this.loadLeaderStats();
              this.startPeriodicAccessCheck();
            }
            resolve();
          },
          error: (err: any) => {
            if (err?.status === 403) {
              this.handleCommunityAccessRevoked();
              resolve();
              return;
            }
            Logger.error(`Community detail yüklenemedi (${community.id}):`, err);
            resolve();
          },
        });
      });

      checkPromises.push(checkPromise);
    }

    // Wait for all checks to complete
    Promise.all(checkPromises).then(() => {
      if (!found) {
        Logger.warn('No community found for user email:', userEmail);
        this.isLoadingCommunity = false;
        this.communityApproved = false;

        // Kullanıcı bir topluluğun başkanı değil veya başkan e-postası Kurumsal'da değiştirilip onaylandı
        this.showToast(
          'Bu e-posta adresi ile ilişkili bir topluluk bulunamadı. Topluluk başkanı e-postası Kurumsal Dashboard\'da değiştirildiyse artık bu panele erişemezsiniz.',
          'error'
        );

        // Token'ı temizle ve ana sayfaya yönlendir
        setTimeout(() => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_info');
            localStorage.removeItem('user_type');
          }
          this.router.navigate(['/']);
        }, 3000);
      }
    });
  }

  // Load leader statistics from backend
  private loadLeaderStats(): void {
    this.communityService.getLeaderStats().subscribe({
      next: (statsData) => {
        this.stats = {
          totalMembers: statsData.totalMembers,
          approvedEvents: statsData.approvedEvents,
          pendingEvents: statsData.pendingEvents,
          totalEvents: statsData.totalEvents,
        };
      },
      error: (err: any) => {
        if (err?.status === 403) {
          this.handleCommunityAccessRevoked();
          return;
        }
        // Hata durumunda stats'ı sıfırla veya varsayılan değerlerde bırak
        this.stats = {
          totalMembers: 0,
          approvedEvents: 0,
          pendingEvents: 0,
          totalEvents: 0,
        };
      },
    });
  }

  // Load events for the community (Backend: GET /api/Events/community/{communityId}/events)
  // Sadece giriş yapılan topluluğun etkinliklerini getirir
  private loadCommunityEvents(communityId: string, skipLoading: boolean = false): void {
    if (!skipLoading) {
      this.isLoadingEvents = true;
    }
    // Backend'den topluluk bazlı etkinlikleri çek (tüm status'ler: 0, 1, 2)
    this.eventService.getCommunityEvents(communityId, [0, 1, 2]).subscribe({
      next: (communityEvents) => {
        // Debug: Backend'den gelen veriyi kontrol et
        Logger.log("Backend'den gelen etkinlikler (raw):", communityEvents);
        communityEvents.forEach((e, idx) => {
          if (e.status === 'Reddedildi' || (e as any).status === 'Reddedildi') {
            Logger.log(`Etkinlik ${idx} - Reddedildi:`, {
              id: e.id,
              title: e.title,
              status: e.status,
              rejectionReason: e.rejectionReason,
              raw: e,
            });
          }
        });
        // Map to DashboardEvent format
        this.dashboardEvents = communityEvents.map((e, index) => {
          // Tarih parse işlemini güvenli hale getir
          let startDate: Date;
          let dateStr: string = 'Tarih belirtilmemiş';
          let timeStr: string = '';
          let startDateIso: string = '';

          if (e.startDate) {
            try {
              // ISO string formatında gelebilir veya farklı formatlarda
              const dateValue = typeof e.startDate === 'string' ? e.startDate : String(e.startDate);

              // Tarih parse et - farklı formatları destekle
              // Backend'den "dd.MM.yyyy" formatı gelebilir (örn: "17.01.2026")
              // veya ISO formatı gelebilir (örn: "2026-01-17T00:00:00")
              let parsedDate: Date | null = null;

              // Önce ISO formatını dene
              parsedDate = new Date(dateValue);

              // Eğer ISO formatı geçersizse, "dd.MM.yyyy" formatını dene
              if (isNaN(parsedDate.getTime())) {
                // "dd.MM.yyyy" formatını parse et (örn: "17.01.2026")
                if (dateValue.includes('.')) {
                  const parts = dateValue.split('.');
                  if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1; // JavaScript month is 0-indexed
                    const year = parseInt(parts[2], 10);
                    parsedDate = new Date(year, month, day);
                  }
                }
              }

              // Geçerlilik kontrolü
              if (!parsedDate || isNaN(parsedDate.getTime())) {
                // Geçersiz tarih, varsayılan değer kullan
                Logger.warn('Geçersiz tarih formatı:', e.startDate, 'Event ID:', e.id);
                startDate = new Date();
                dateStr = 'Tarih belirtilmemiş';
                timeStr = 'Saat belirtilmemiş';
                startDateIso = new Date().toISOString();
              } else {
                // Geçerli tarih, kullan
                startDate = parsedDate;

                // Türkçe tarih formatı: "15 Ocak 2026" (tam tarih)
                dateStr = startDate.toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });
                // Türkçe saat formatı: "14:30" (24 saat formatı)
                timeStr = startDate.toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false, // 24 saat formatı
                });
                startDateIso = startDate.toISOString();
              }
            } catch (error) {
              Logger.error(
                'Tarih parse hatası:',
                error,
                'Event ID:',
                e.id,
                'startDate:',
                e.startDate
              );
              startDate = new Date();
              dateStr = 'Tarih belirtilmemiş';
              timeStr = 'Saat belirtilmemiş';
              startDateIso = new Date().toISOString();
            }
          } else {
            // startDate yoksa varsayılan değer
            Logger.warn('startDate yok - Event ID:', e.id);
            startDate = new Date();
            dateStr = 'Tarih belirtilmemiş';
            timeStr = 'Saat belirtilmemiş';
            startDateIso = new Date().toISOString();
          }

          // Backend'den gelen status değerine göre map et
          // EventService.mapToEvent zaten 'Beklemede', 'Onaylandı', 'Reddedildi' formatına çeviriyor
          let status: 'approved' | 'pending' | 'rejected' = 'pending';
          if (e.status === 'Onaylandı') {
            status = 'approved';
          } else if (e.status === 'Reddedildi') {
            status = 'rejected';
          } else {
            status = 'pending';
          }

          // imageUrl EventService.mapToEvent tarafından zaten convertImagePathToFullUrl ile tam URL'ye çevriliyor
          // Eğer imageUrl boşsa veya geçersizse, boş string kullan (placeholder image-error-handler service tarafından yönetilecek)
          // Backend'den gelen imageUrl'i direkt kullan - eğer boşsa boş string, yoksa tam URL
          const finalImageUrl =
            e.imageUrl && e.imageUrl.trim() && e.imageUrl.length > 10 ? e.imageUrl : '';

          return {
            id: e.id,
            title: e.title,
            status: status,
            imageUrl: finalImageUrl,
            date: dateStr,
            startDateIso: startDateIso,
            location: e.location || 'Konum belirtilmemiş',
            category: 'Etkinlik', // Backend'de category yok, varsayılan değer
            description: e.description || e.shortDescription || '',
            shortDescription: (e as any).shortDescription || undefined,
            rejectionReason: (() => {
              // EventItem'dan gelen rejectionReason'ı kontrol et
              const reason =
                e.rejectionReason ||
                (e as any).rejectionReason ||
                (e as any).confirmAbout ||
                (e as any).ConfirmAbout;
              if (reason) {
                Logger.log(
                  'DashboardEvent mapping: rejectionReason bulundu:',
                  reason,
                  'Event ID:',
                  e.id
                );
              } else {
                Logger.log(
                  'DashboardEvent mapping: rejectionReason YOK, Event ID:',
                  e.id,
                  'Status:',
                  e.status,
                  'Raw event:',
                  e
                );
              }
              return reason || undefined;
            })(), // Backend'den gelirse (ConfirmAbout olarak da gelebilir)
            time: timeStr,
            quota: e.capacity ? parseInt(e.capacity, 10) : 0,
          } as DashboardEvent;
        });

        // İstatistikler zaten loadLeaderStats() ile backend'den geliyor
        // Etkinlikler yüklendikten sonra istatistikleri tekrar yükle (güncel veriler için)
        this.loadLeaderStats();
        if (!skipLoading) {
          this.isLoadingEvents = false;
        }
      },
      error: (err: any) => {
        if (err?.status === 403) {
          this.handleCommunityAccessRevoked();
          return;
        }
        Logger.error('Etkinlikler yüklenemedi:', err);
        // Hata durumunda boş array kullan
        this.dashboardEvents = [];
        if (!skipLoading) {
          this.isLoadingEvents = false;
        }
      },
    });
  }

  private loadCommunities() {
    // Topluluk lideri (RolId 3) sadece aktif toplulukları görebilir
    // status: 'all' sadece GSB (RolId 2) için çalışır
    this.communityService.getAllCommunities({ status: 'active' }).subscribe({
      next: (communities) => {
        this.collaborations = communities.map((c) => ({
          id: c.id,
          clubName: c.name,
          university: c.university,
          description: c.description || '',
          logo: c.logo,
          coverImage: c.coverImage || c.banner || c.logo,
          memberCount: c.memberCount,
          city: c.city,
          category: c.category,
        }));
        this.cities = [
          ...new Set(
            this.collaborations.map((c) => c.city || 'Belirsiz').filter((c) => c !== 'Belirsiz')
          ),
        ].sort();
        this.categories = [
          ...new Set(this.collaborations.map((c) => c.category || '').filter((cat) => !!cat)),
        ].sort();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err: any) => {
        Logger.error('Topluluklar yüklenemedi:', err);
        this.collaborations = [];
        this.filteredCollaborations = [];
        this.isLoading = false;
      },
    });
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Profil dropdown kontrolü
    if (
      !target.closest('.profile-wrapper') &&
      !target.closest('.profile-dropdown') &&
      !target.closest('.profile-info')
    ) {
      this.isProfileOpen = false;
    }

    // Bildirimler dropdown kontrolü
    if (
      !target.closest('.notification-wrapper') &&
      !target.closest('.dropdown-menu.notifications') &&
      !target.closest('.icon-btn.notification')
    ) {
      this.showNotifications = false;
    }
  }

  get filteredDashboardEvents() {
    let filtered: DashboardEvent[] = [];

    // Status'e göre filtrele
    if (this.statusFilter === 'all') {
      filtered = [...this.dashboardEvents];
    } else {
      filtered = this.dashboardEvents.filter((e) => e.status === this.statusFilter);
    }

    // Kronolojik sıraya göre sırala (en yeniden en eskiye - startDateIso'ya göre)
    filtered.sort((a, b) => {
      const dateA = a.startDateIso ? new Date(a.startDateIso).getTime() : 0;
      const dateB = b.startDateIso ? new Date(b.startDateIso).getTime() : 0;
      // En yeni tarih önce (büyükten küçüğe)
      return dateB - dateA;
    });

    return filtered;
  }

  get displayedDashboardEvents() {
    // En son 5 etkinliği göster (zaten filteredDashboardEvents sıralı)
    return this.filteredDashboardEvents.slice(0, 5);
  }

  get pagedCollaborations() {
    const start = (this.collabCurrentPage - 1) * this.collabPerPage;
    return this.filteredCollaborations.slice(start, start + this.collabPerPage);
  }

  get collabTotalPages() {
    return Math.max(1, Math.ceil(this.filteredCollaborations.length / this.collabPerPage));
  }

  // GÜNCELLEME: Breadcrumb başlığı 'Profil' olarak ayarlandı
  get currentTabTitle() {
    const titles: Record<string, string> = {
      overview: 'Genel Bakış',
      projects: 'Etkinliklerim',
      network: 'Diğer Topluluklar',
      settings: 'Profilim',
    };
    return titles[this.activeTab] || 'Panel';
  }

  get unreadNotificationsCount() {
    return this.notifications.filter((n) => !n.read).length;
  }

  // Functions
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  switchTab(tab: string) {
    this.clearToast();
    this.activeTab = tab;
    this.showNotifications = false;
    this.isProfileOpen = false;
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

  navigateToHome() {
    this.router.navigate(['/']);
  }

  toggleRowMenu(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.activeRowMenuId = this.activeRowMenuId === id ? null : id;
  }

  togglePromote(project: Project) {
    project.isPromoted = !project.isPromoted;
    this.showToast(project.isPromoted ? 'Öne çıkarıldı.' : 'Normal.', 'success');
  }

  setStatusFilter(filter: 'all' | 'approved' | 'pending' | 'rejected') {
    this.statusFilter = filter;
  }

  goToCommunity(community: Collaboration) {
    this.router.navigate(['/communities', community.id]);
  }

  applyFilters() {
    let temp = [...this.collaborations];

    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(
        (c) =>
          c.clubName.toLowerCase().includes(term) ||
          c.university.toLowerCase().includes(term) ||
          (c.city || '').toLowerCase().includes(term)
      );
    }

    if (this.selectedCity) {
      temp = temp.filter((c) => c.city === this.selectedCity);
    }

    if (this.selectedCategory) {
      temp = temp.filter((c) => c.category === this.selectedCategory);
    }

    if (this.sortOrder === 'member_desc') {
      temp.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
    } else if (this.sortOrder === 'member_asc') {
      temp.sort((a, b) => (a.memberCount || 0) - (b.memberCount || 0));
    }

    this.filteredCollaborations = temp;
    if (this.collabCurrentPage > this.collabTotalPages) {
      this.collabCurrentPage = this.collabTotalPages;
    }
  }

  setCollabPage(page: number) {
    if (page < 1 || page > this.collabTotalPages) return;
    this.collabCurrentPage = page;
  }

  exportData(type: string) {
    this.showToast(`${type.toUpperCase()} indiriliyor...`, 'success');
  }

  onLogoSelected(imageUrl: string) {
    // ImageUploadComponent'ten gelen preview URL (base64 veya URL)
    this.clubInfo.logo = imageUrl;
  }

  onLogoFileSelected(file: File) {
    if (!this.clubInfo?.id) {
      this.showToast('Topluluk ID bulunamadı.', 'error');
      return;
    }
    // Direkt yükleme yok: dosyayı sakla, önizleme göster; "Güncelle ve Onaya Gönder" ile yüklenecek
    if (this.clubInfo.logo?.startsWith('blob:')) {
      URL.revokeObjectURL(this.clubInfo.logo);
    }
    this.pendingLogoFile = file;
    this.clubInfo.logo = URL.createObjectURL(file);
    this.showToast(
      'Logo seçildi. Değişiklikler "Güncellemeleri Onaya Gönder" ile GSB onayına gönderilecektir.',
      'success'
    );
    this.showAvatarModal = false;
  }

  onBannerSelected(imageUrl: string) {
    this.clubInfo.banner = imageUrl;
  }

  onBannerFileSelected(file: File) {
    if (!this.clubInfo?.id) {
      this.showToast('Topluluk ID bulunamadı.', 'error');
      return;
    }
    // Direkt yükleme yok: dosyayı sakla, önizleme göster; "Güncelle ve Onaya Gönder" ile yüklenecek
    if (this.clubInfo.banner?.startsWith('blob:')) {
      URL.revokeObjectURL(this.clubInfo.banner);
    }
    this.pendingBannerFile = file;
    this.clubInfo.banner = URL.createObjectURL(file);
    this.showToast(
      'Banner seçildi. Değişiklikler "Güncellemeleri Onaya Gönder" ile GSB onayına gönderilecektir.',
      'success'
    );
    this.showBannerModal = false;
  }

  updateSettings() {
    if (!this.isSettingsValid) {
      this.showToast('Zorunlu alanları doldurun.', 'error');
      return;
    }
    this.initialClubInfo = JSON.parse(JSON.stringify(this.clubInfo));
    this.showToast('Ayarlar güncellendi!', 'success');
  }

  get isSettingsValid() {
    const emailOk = !!this.clubInfo.email?.trim();
    const aboutOk = !!this.clubInfo.description?.trim();
    return emailOk && aboutOk;
  }

  /** Profilim formu: zorunlu alanlar dolu mu (isim, topluluk e-posta, başkan e-posta, hakkımızda) */
  get isProfileFormValid(): boolean {
    const nameOk = !!this.clubInfo.name?.trim();
    const emailOk = !!this.clubInfo.email?.trim();
    const leadMailOk = !!this.clubInfo.comLeadMail?.trim();
    const aboutOk = !!this.clubInfo.description?.trim();
    return !!(nameOk && emailOk && leadMailOk && aboutOk);
  }

  // GÜNCELLEME: Kontrol listesi sadeleştirildi (Website, Youtube vs. çıkarıldı)
  get isSettingsChanged() {
    const fields = ['instagram', 'banner', 'logo'];
    return fields.some((f) => (this.clubInfo as any)[f] !== this.initialClubInfo[f]);
  }

  /**
   * Profilim sekmesinden topluluk bilgilerini güncelle ve GSB onayına gönder.
   * Sıra: (1) Banner yükle → (2) Logo yükle → (3) PUT ile metin + banner/logo URL.
   * Başarı yalnızca üç adım da 200 döndüğünde kabul edilir; eksik veri ile başarı gösterilmez.
   */
  saveCommunityProfile(): void {
    if (!this.isProfileFormValid || this.isSavingProfile || !this.clubInfo?.id) {
      if (!this.clubInfo?.id) this.showToast('Topluluk bilgisi yüklenemedi.', 'error');
      return;
    }

    this.isSavingProfile = true;
    const id = typeof this.clubInfo.id === 'string' ? this.clubInfo.id : String(this.clubInfo.id);

    const existingBannerUrl = this.getServerBannerUrl();
    const existingLogoUrl = this.getServerLogoUrl();

    const dto: UpdateCommunityDto = {
      comName: this.clubInfo.name?.trim() || undefined,
      comCategory: this.clubInfo.category?.trim() || undefined,
      comAbout: this.clubInfo.description?.trim() || undefined,
      city: this.clubInfo.city?.trim() || undefined,
      university: this.clubInfo.university?.trim() || undefined,
      comMail: this.clubInfo.email?.trim() || undefined,
      comLeadMail: this.clubInfo.comLeadMail?.trim() || undefined,
      webSiteUrl: this.clubInfo.webSiteUrl?.trim() || undefined,
      instagramUrl:
        this.clubInfo.instagramUrl?.trim() || this.clubInfo.instagram?.trim() || undefined,
      miniAbout: this.clubInfo.miniAbout?.trim() || undefined,
    };

    const bannerUpload$ = this.pendingBannerFile
      ? this.communityService.uploadBanner(id, this.pendingBannerFile).pipe(
          map((r) => r.BannerUrl || (r as any).bannerUrl),
          catchError((err) => {
            this.isSavingProfile = false;
            const msg =
              (typeof err?.error?.message === 'string' ? err.error.message : null) ||
              (typeof err?.error === 'string' ? err.error : null) ||
              '';
            this.showToast(msg && msg.trim() ? msg : 'Banner yüklenirken hata oluştu.', 'error');
            throw err;
          })
        )
      : of(undefined);

    const logoUpload$ = (bannerUrl: string | undefined) =>
      this.pendingLogoFile
        ? this.communityService.uploadLogo(id, this.pendingLogoFile!).pipe(
            map((r) => r.LogoUrl || (r as any).logoUrl),
            map((logoUrl) => ({ bannerUrl, logoUrl })),
            catchError((err) => {
              this.isSavingProfile = false;
              const msg =
                (typeof err?.error?.message === 'string' ? err.error.message : null) ||
                (typeof err?.error === 'string' ? err.error : null) ||
                '';
              this.showToast(msg && msg.trim() ? msg : 'Logo yüklenirken hata oluştu.', 'error');
              throw err;
            })
          )
        : of({ bannerUrl, logoUrl: undefined as string | undefined });

    bannerUpload$
      .pipe(
        switchMap((bannerUrl) => logoUpload$(bannerUrl)),
        switchMap(({ bannerUrl, logoUrl }) => {
          dto.bannerUrl = bannerUrl ?? existingBannerUrl;
          dto.logoUrl = logoUrl ?? existingLogoUrl;
          return this.communityService.updateCommunity(id, dto, { submitForApproval: true });
        })
      )
      .subscribe({
        next: () => {
          this.finishProfileUpdate();
          this.showToast('Güncellemeler onaya gönderildi. Banner, logo ve metin bilgileri sunucuya iletildi.', 'success');
        },
        error: (err: any) => {
          this.isSavingProfile = false;
          const msg =
            (typeof err?.error?.message === 'string' ? err.error.message : null) ||
            (typeof err?.error === 'string' ? err.error : null) ||
            '';
          const isAlreadyPending = msg && msg.includes('güncelleme isteği onay bekliyor');
          if (isAlreadyPending) {
            this.showToast(
              'Tüm veriler iletilmedi. GSB tarafında güncelleme onayı bekleniyor; backend güncellemesi sonrası banner, logo ve metin birlikte iletilebilir.',
              'error'
            );
            return;
          }
          if (!msg?.includes('Banner yüklenirken') && !msg?.includes('Logo yüklenirken')) {
            this.showToast(
              msg && msg.trim() ? msg : 'Topluluk güncellenirken bir hata oluştu.',
              'error'
            );
          }
        },
      });
  }

  /** Güncelleme başarılı olduğunda: blob temizle, state güncelle, refresh. */
  private finishProfileUpdate(): void {
    if (this.clubInfo?.banner?.startsWith('blob:')) {
      try { URL.revokeObjectURL(this.clubInfo.banner); } catch {}
    }
    if (this.clubInfo?.logo?.startsWith('blob:')) {
      try { URL.revokeObjectURL(this.clubInfo.logo); } catch {}
    }
    this.pendingBannerFile = null;
    this.pendingLogoFile = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('community_profile_update_pending', 'true');
    }
    this.communityApproved = false;
    this.isUpdatePending = true;
    this.initialClubInfo = JSON.parse(JSON.stringify(this.clubInfo));
    this.refreshCommunityProfileAfterUpdate();
  }

  /** Mevcut banner URL'ini sunucu kaynaklı döndürür (blob/data hariç). */
  private getServerBannerUrl(): string | undefined {
    const b = this.clubInfo?.banner;
    if (b && !b.startsWith('data:') && !b.startsWith('blob:')) return b;
    const i = this.initialClubInfo?.banner;
    if (i && !String(i).startsWith('data:') && !String(i).startsWith('blob:')) return i;
    return undefined;
  }

  /** Mevcut logo URL'ini sunucu kaynaklı döndürür (blob/data hariç). */
  private getServerLogoUrl(): string | undefined {
    const b = this.clubInfo?.logo;
    if (b && !b.startsWith('data:') && !b.startsWith('blob:')) return b;
    const i = this.initialClubInfo?.logo;
    if (i && !String(i).startsWith('data:') && !String(i).startsWith('blob:')) return i;
    return undefined;
  }

  /**
   * Güncelleme sonrası topluluk bilgisini yeniden yükle (GSB onayına gittiği için navigate etme).
   * ComConfirm=4 ve pendingUpdateData varsa onaya gönderilen veriyi göster (Profilim sekmesinde güncel veri).
   */
  private refreshCommunityProfileAfterUpdate(): void {
    this.communityService.getMyLeadCommunity().subscribe({
      next: (community) => {
        this.isSavingProfile = false;
        if (community) {
          const comConfirm = (community as any).comConfirm ?? (community as any).ComConfirm;
          const pendingJson = (community as any).pendingUpdateData ?? (community as any).PendingUpdateData;
          const displayCommunity =
            comConfirm === 4 && pendingJson
              ? this.communityService.applyPendingUpdateToCommunity(community, pendingJson)
              : community;

          this.clubInfo = {
            id: displayCommunity.id,
            name: displayCommunity.name,
            university: displayCommunity.university || '',
            city: displayCommunity.city || '',
            category: displayCommunity.category || 'Genel',
            logo: displayCommunity.logo || this.clubInfo.logo,
            banner: displayCommunity.banner || displayCommunity.coverImage || this.clubInfo.banner,
            email: displayCommunity.email || displayCommunity.comMail || '',
            phone: this.clubInfo.phone,
            instagram: displayCommunity.instagram || displayCommunity.instagramUrl || '',
            description: displayCommunity.about || displayCommunity.description || '',
            comMail: displayCommunity.comMail,
            comLeadMail: displayCommunity.comLeadMail,
            webSiteUrl: displayCommunity.webSiteUrl,
            instagramUrl: displayCommunity.instagramUrl,
            miniAbout: displayCommunity.miniAbout,
          };
          this.initialClubInfo = JSON.parse(JSON.stringify(this.clubInfo));
          this.displayName = displayCommunity.name || this.userName;
          this.userInitial = this.displayName.charAt(0).toUpperCase();
          const profileUpdateFlag =
            isPlatformBrowser(this.platformId) &&
            localStorage.getItem('community_profile_update_pending') === 'true';

          if (comConfirm === 1) {
            this.communityApproved = true;
            this.isUpdatePending = false;
            if (isPlatformBrowser(this.platformId)) {
              localStorage.removeItem('community_profile_update_pending');
            }
          } else if (comConfirm === 4 || profileUpdateFlag) {
            this.communityApproved = true;
            this.isUpdatePending = true;
            if (isPlatformBrowser(this.platformId) && comConfirm === 4) {
              localStorage.setItem('community_profile_update_pending', 'true');
            }
          } else {
            this.communityApproved = community.isActivity === true;
            this.isUpdatePending = false;
            if (isPlatformBrowser(this.platformId)) {
              localStorage.removeItem('community_profile_update_pending');
            }
          }
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('community_approved', JSON.stringify(this.communityApproved));
          }
          if (this.communityApproved) {
            this.loadCommunityEvents(community.id);
            this.loadLeaderStats();
          }
        }
      },
      error: () => {
        this.isSavingProfile = false;
      },
    });
  }

  openModal(type: any) {
    this.clearToast();
    if (type === 'new-event' && this.isUpdatePending) {
      this.showToast(
        'Topluluğunuzun güncellemesi onay bekliyor. Etkinlik oluşturmak için GSB onayının tamamlanmasını bekleyin.',
        'error'
      );
      return;
    }
    this.modalType = type;
    this.isModalOpen = true;
    this.editingEventId = null; // Reset editing state
    this.newEventData = {
      title: '',
      shortDescription: '',
      date: '',
      time: '',
      location: '',
      quota: '',
      description: '',
      image: '',
      imageFile: null,
    };
    this.newProjectData = { name: '', category: 'Teknoloji', budget: 0, deadline: '' };
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalType = null;
    this.editingEventId = null;
  }

  saveProject() {
    if (this.newProjectData.name) {
      this.projects.unshift({
        id: Date.now(),
        name: this.newProjectData.name,
        status: 'Taslak',
        progress: 0,
        budget: this.newProjectData.budget,
        deadline: this.newProjectData.deadline || 'TBA',
        isPromoted: false,
        category: this.newProjectData.category,
      });
      // Stats artık backend'den geliyor, burada güncelleme yapmıyoruz
      this.showToast('Proje eklendi.', 'success');
      this.closeModal();
    }
  }

  saveEvent() {
    Logger.log('saveEvent called');
    Logger.log('isEventFormValid:', this.isEventFormValid);
    Logger.log('newEventData:', this.newEventData);

    if (!this.isEventFormValid) {
      this.showToast('Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    // HTML input type="date" zaten YYYY-MM-DD formatında değer döndürüyor
    // Tarih ve saat parse işlemi
    let startDate: Date;
    let endDate: Date;

    try {
      // HTML input type="date" YYYY-MM-DD formatında döndürür
      // HTML input type="time" HH:mm formatında döndürür
      const dateStr = this.newEventData.date?.trim(); // Format: "YYYY-MM-DD"
      const timeStr = this.newEventData.time?.trim(); // Format: "HH:mm"

      // Boş string kontrolü de yapılmalı
      if (!dateStr || dateStr.length === 0 || !timeStr || timeStr.length === 0) {
        this.showToast('Lütfen tarih ve saat bilgilerini girin.', 'error');
        return;
      }

      // Tarih ve saati birleştir: "YYYY-MM-DD HH:mm"
      const dateTimeString = `${dateStr} ${timeStr}`;

      // Local timezone'da parse et (UTC'ye çevirme, çünkü backend DateOnly bekliyor)
      // YYYY-MM-DD HH:mm formatını parse et
      const [datePart, timePart] = dateTimeString.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);

      // Local timezone'da Date oluştur (UTC'ye çevirme)
      startDate = new Date(year, month - 1, day, hour, minute);
      endDate = new Date(startDate); // Aynı tarih ve saat

      if (isNaN(startDate.getTime())) {
        throw new Error('Geçersiz tarih formatı');
      }
    } catch (error) {
      this.showToast('Lütfen geçerli bir tarih ve saat girin.', 'error');
      return;
    }

    // EventService üzerinden etkinlik ekle (Backend: POST /api/Events/create)
    if (!this.clubInfo.id) {
      this.showToast('Topluluk bilgisi bulunamadı. Lütfen tekrar deneyin.', 'error');
      return;
    }

    // comId string olarak gönderilmeli (Guid)
    const comId =
      typeof this.clubInfo.id === 'string' ? this.clubInfo.id : String(this.clubInfo.id);

    // Düzenleme modu kontrolü
    if (this.editingEventId) {
      this.eventService
        .updateEvent(this.editingEventId, {
          title: this.newEventData.title,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          location: this.newEventData.location,
          description: this.newEventData.description,
          shortDescription: this.newEventData.shortDescription || this.newEventData.description,
          // imageUrl artık gönderilmiyor - ayrı endpoint ile yüklenecek
          quota: this.newEventData.quota ? Number(this.newEventData.quota) : undefined,
          // Status backend tarafından otomatik olarak 'pending' (Beklemede) yapılacak
        })
        .subscribe({
          next: (response) => {
            Logger.log('Event updated successfully:', response);

            // Eğer fotoğraf seçildiyse, ayrı endpoint ile yükle
            if (this.newEventData.imageFile && this.editingEventId) {
              this.eventService
                .uploadEventImage(this.editingEventId, this.newEventData.imageFile)
                .subscribe({
                  next: (uploadResponse) => {
                    Logger.log('Event image uploaded successfully:', uploadResponse);
                    Logger.log('Uploaded image path:', uploadResponse.ImagePath);

                    // Backend'den gelen ImagePath zaten full URL (convert edilmiş)
                    const imageUrl = uploadResponse.ImagePath || '';

                    // Backend'den gelen ImagePath'i event listesinde güncelle
                    const eventInList = this.dashboardEvents.find(
                      (e) => e.id === this.editingEventId
                    );
                    if (eventInList && imageUrl) {
                      eventInList.imageUrl = imageUrl;
                    }

                    this.showToast(
                      "Etkinlik ve fotoğrafı güncellendi ve tekrar onaya gönderildi! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
                      'success'
                    );
                    this.closeModal();
                    this.editingEventId = null; // Reset editing state
                    if (this.clubInfo.id) {
                      setTimeout(() => {
                        this.loadCommunityEvents(this.clubInfo.id, true); // skipLoading = true
                      }, 1500); // Backend'in fotoğrafı kaydetmesi ve event objesine set etmesi için daha uzun bekleme
                    }
                  },
                  error: (uploadErr: any) => {
                    Logger.error('Etkinlik fotoğrafı yüklenemedi:', uploadErr);
                    // Etkinlik güncellendi ama fotoğraf yüklenemedi
                    this.showToast(
                      'Etkinlik güncellendi ancak fotoğraf yüklenirken bir hata oluştu. Etkinliği düzenleyerek fotoğrafı tekrar yükleyebilirsiniz.',
                      'error'
                    );
                    this.closeModal();
                    this.editingEventId = null; // Reset editing state
                    if (this.clubInfo.id) {
                      this.loadCommunityEvents(this.clubInfo.id);
                    }
                  },
                });
            } else {
              // Fotoğraf yok, sadece etkinlik güncellendi
              this.showToast(
                "Etkinlik güncellendi ve tekrar onaya gönderildi! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
                'success'
              );
              this.closeModal();
              this.editingEventId = null; // Reset editing state
              if (this.clubInfo.id) {
                this.loadCommunityEvents(this.clubInfo.id);
              }
            }
          },
          error: (err: any) => {
            Logger.error('Etkinlik güncellenemedi:', err);
            let errorMessage = 'Etkinlik güncellenirken bir hata oluştu.';
            if (err.status === 401 || err.status === 403) {
              errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
            } else if (err.error?.message) {
              errorMessage = err.error.message;
            }
            this.showToast(errorMessage, 'error');
          },
        });
      return;
    }

    this.eventService
      .createEvent({
        title: this.newEventData.title,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: this.newEventData.location,
        description: this.newEventData.description,
        shortDescription: this.newEventData.shortDescription || this.newEventData.description,
        // imageUrl artık gönderilmiyor - ayrı endpoint ile yüklenecek
        quota: this.newEventData.quota ? Number(this.newEventData.quota) : undefined,
        // comId backend'de otomatik olarak creator'ın topluluğundan alınıyor
      })
      .subscribe({
        next: (response) => {
          Logger.log('Event created successfully:', response);
          const eventId = response.eventId;
          Logger.log('Created event ID:', eventId, 'Event title:', this.newEventData.title);

          // Eğer fotoğraf seçildiyse, ayrı endpoint ile yükle
          if (this.newEventData.imageFile && eventId) {
            this.eventService.uploadEventImage(eventId, this.newEventData.imageFile).subscribe({
              next: (uploadResponse) => {
                Logger.log('Event image uploaded successfully:', uploadResponse);
                Logger.log('Uploaded image path:', uploadResponse.ImagePath);
                Logger.log('Event ID:', eventId);

                // Backend'den gelen ImagePath zaten full URL (convert edilmiş)
                const imageUrl = uploadResponse.ImagePath || '';

                // Yeni oluşturulan event'i listede bul ve imageUrl'ini güncelle
                // NOT: Bu geçici bir güncelleme, asıl güncelleme loadCommunityEvents ile yapılacak
                setTimeout(() => {
                  const newEventInList = this.dashboardEvents.find((e) => e.id === eventId);
                  if (newEventInList && imageUrl) {
                    Logger.log(
                      'Updating event in list - Event ID:',
                      eventId,
                      'New imageUrl:',
                      imageUrl
                    );
                    // Cache-busting için timestamp ekle
                    const imageUrlWithCacheBust =
                      imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
                    newEventInList.imageUrl = imageUrlWithCacheBust;
                  } else {
                    Logger.warn(
                      'Event not found in list for ID:',
                      eventId,
                      'Available IDs:',
                      this.dashboardEvents.map((e) => e.id)
                    );
                  }
                }, 100);

                this.showToast(
                  "Etkinlik ve fotoğrafı başarıyla oluşturuldu! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
                  'success'
                );
                // Modal'ı kapat
                this.closeModal();

                // Reload events from backend to get fresh data (fotoğraf path'i ile birlikte)
                // Backend'in fotoğrafı işlemesi ve event objesine set etmesi için bekleme
                if (this.clubInfo.id) {
                  setTimeout(() => {
                    this.loadCommunityEvents(this.clubInfo.id, true); // skipLoading = true
                  }, 1500); // Backend'in fotoğrafı kaydetmesi ve event objesine set etmesi için bekleme
                }
                // Etkinlikleri yeniden yükle (backend'den güncel veri ile)
                // Backend'den yeni yüklenen fotoğraf path'i ile birlikte gelecek
                if (this.clubInfo.id) {
                  setTimeout(() => {
                    this.loadCommunityEvents(this.clubInfo.id);
                  }, 500); // Backend'in fotoğrafı kaydetmesi için kısa bir bekleme
                }
              },
              error: (uploadErr: any) => {
                Logger.error('Etkinlik fotoğrafı yüklenemedi:', uploadErr);
                // Etkinlik oluşturuldu ama fotoğraf yüklenemedi
                this.showToast(
                  'Etkinlik oluşturuldu ancak fotoğraf yüklenirken bir hata oluştu. Etkinliği düzenleyerek fotoğrafı tekrar yükleyebilirsiniz.',
                  'error'
                );
                // Modal'ı kapat
                this.closeModal();
                // Etkinlikleri yeniden yükle
                if (this.clubInfo.id) {
                  this.loadCommunityEvents(this.clubInfo.id);
                }
              },
            });
          } else {
            // Fotoğraf yok, sadece etkinlik oluşturuldu
            this.showToast(
              "Etkinlik başarıyla oluşturuldu! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
              'success'
            );
            // Modal'ı kapat
            this.closeModal();
            // Etkinlikleri yeniden yükle
            if (this.clubInfo.id) {
              this.loadCommunityEvents(this.clubInfo.id);
            }
          }
        },
        error: (err: any) => {
          Logger.error('Etkinlik oluşturulamadı:', err);
          let errorMessage = 'Etkinlik oluşturulurken bir hata oluştu';
          if (err.status === 401 || err.status === 403) {
            errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (err?.message) {
            errorMessage = err.message;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          }
          this.showToast(errorMessage, 'error');
        },
      });
  }

  get isEventFormValid() {
    const { title, date, time, location, quota, description, image } = this.newEventData;
    // Tarih ve saat boş string kontrolü de yapılmalı
    const hasValidDate = date && date.trim().length > 0;
    const hasValidTime = time && time.trim().length > 0;
    return (
      !!title?.trim() &&
      hasValidDate &&
      hasValidTime &&
      !!location?.trim() &&
      !!quota &&
      !!description?.trim()
      // !!image // Fotoğraf zorunluluğu şimdilik kaldırıldı
    );
  }

  onEventImageSelected(image: string | Event) {
    // image-upload component string base64/url gönderir
    if (typeof image === 'string') {
      this.newEventData.image = image;
      return;
    }
    // fallback: native input event
    const file = (image.target as HTMLInputElement).files?.[0];
    if (file) this.readFileToBase64(file);
  }

  onEventFileSelected(file: File) {
    if (file) {
      Logger.log(
        '[onEventFileSelected] File selected:',
        file.name,
        'Size:',
        file.size,
        'Type:',
        file.type,
        'isEditingEventDetail:',
        this.isEditingEventDetail
      );
      if (this.isEditingEventDetail) {
        // Event detail modal'da düzenleme modunda
        this.readFileToBase64ForEdit(file);
        // File objesini de sakla (backend'e yüklemek için)
        this.editedEventData.imageFile = file;
        Logger.log('[onEventFileSelected] File saved to editedEventData.imageFile');
      } else {
        // Event creation modal'da
        this.readFileToBase64(file);
        // File objesini de sakla (backend'e yüklemek için)
        this.newEventData.imageFile = file;
      }
    } else {
      Logger.warn('[onEventFileSelected] No file provided');
    }
  }

  // Event detail modal'da image-upload component'inden gelen image selection/silme işlemleri
  onEventImageSelectedForEdit(image: string | Event) {
    if (this.isEditingEventDetail) {
      // image-upload component string base64/url gönderir veya boş string (silme durumu)
      if (typeof image === 'string') {
        if (image === '') {
          // Silme durumu - image ve imageFile'ı temizle
          this.editedEventData.image = '';
          this.editedEventData.imageFile = null;
        } else {
          // Yeni image seçildi (base64 veya URL)
          this.editedEventData.image = image;
          // imageFile zaten onEventFileSelected tarafından set edilecek
        }
        return;
      }
      // fallback: native input event
      const file = (image.target as HTMLInputElement).files?.[0];
      if (file) {
        this.readFileToBase64ForEdit(file);
        this.editedEventData.imageFile = file;
      }
    }
  }

  private readFileToBase64(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.newEventData.image = reader.result as string; // Preview için base64
    };
    reader.readAsDataURL(file);
  }

  private readFileToBase64ForEdit(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.editedEventData.image = reader.result as string; // Preview için base64
    };
    reader.readAsDataURL(file);
  }

  openDeleteEventConfirm(id: number) {
    this.clearToast();
    this.clearConfirmTimer();
    this.confirmDeleteId = id;
    this.confirmDeleteType = 'event';
    this.confirmVisible = true;
    this.confirmHiding = false;
    // Close the detail modal temporarily or keep it open?
    // If we keep it open, the confirm modal will be on top.
    // But if we delete, we should close the detail modal.
  }

  cancelDelete() {
    this.startCloseConfirm();
  }

  confirmDeleteAction() {
    this.deleteEventConfirmed();
  }

  deleteEventConfirmed() {
    if (this.confirmDeleteId === null) return;

    // Backend'den etkinliği sil
    this.eventService.deleteEvent(this.confirmDeleteId).subscribe({
      next: () => {
        // Başarılı - etkinlikleri backend'den yeniden yükle
        if (this.clubInfo.id) {
          this.loadCommunityEvents(this.clubInfo.id);
        } else {
          // Fallback: frontend listesinden çıkar (backend endpoint yoksa)
          this.dashboardEvents = this.dashboardEvents.filter((e) => e.id !== this.confirmDeleteId);
        }

        this.showToast('Etkinlik başarıyla silindi.', 'success');

        // Eğer silinen etkinlik detail modal'da açıksa, modal'ı kapat
        if (this.selectedEvent && this.selectedEvent.id === this.confirmDeleteId) {
          this.closeEventDetail();
        }

        this.startCloseConfirm();
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
        this.startCloseConfirm();
      },
    });
  }

  private startCloseConfirm() {
    this.confirmHiding = true;
    this.clearConfirmTimer();
    this.confirmTimer = setTimeout(() => {
      this.confirmVisible = false;
      this.confirmDeleteId = null;
      this.confirmHiding = false;
    }, 220);
  }

  private clearConfirmTimer() {
    if (this.confirmTimer) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = null;
    }
  }

  getInitials(name: string) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
    return initials || name.charAt(0).toUpperCase();
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.clearToast();
    this.toastMessage = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => (this.toastMessage = null), 1800);
  }

  clearToast() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toastMessage = null;
  }

  openEventDetail(event: DashboardEvent) {
    // Event objesini kopyala ve tarih/saat bilgilerinin doğru yüklendiğinden emin ol
    this.selectedEvent = { ...event };
    Logger.log('Event detail opened:', {
      id: this.selectedEvent.id,
      title: this.selectedEvent.title,
      date: this.selectedEvent.date,
      time: this.selectedEvent.time,
      startDateIso: this.selectedEvent.startDateIso,
      status: this.selectedEvent.status,
      rejectionReason: this.selectedEvent.rejectionReason,
      hasRejectionReason: !!this.selectedEvent.rejectionReason,
      isRejected: this.selectedEvent.status === 'rejected',
    });

    // Eğer etkinlik rejected ise ve rejectionReason yoksa, backend'den detay çek
    // EventDetailDto'da ConfirmAbout var, EventListItemDto'da yok
    if (this.selectedEvent.status === 'rejected' && !this.selectedEvent.rejectionReason) {
      this.eventService.getById(this.selectedEvent.id).subscribe({
        next: (eventDetail) => {
          if (eventDetail.rejectionReason) {
            Logger.log('Fetched rejection reason from backend:', eventDetail.rejectionReason);
            // selectedEvent'i güncelle
            if (this.selectedEvent && this.selectedEvent.id === event.id) {
              this.selectedEvent.rejectionReason = eventDetail.rejectionReason;
            }
            // Dashboard listesindeki event'i de güncelle
            const eventInList = this.dashboardEvents.find((e) => e.id === event.id);
            if (eventInList) {
              eventInList.rejectionReason = eventDetail.rejectionReason;
            }
          }
        },
        error: (err) => {
          Logger.warn('Could not fetch event detail for rejection reason:', err);
        },
      });
    }

    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  onEventCardClick(event: DashboardEvent) {
    // Tüm etkinlikler için detay modal aç
    this.openEventDetail(event);
  }

  editEvent(event: DashboardEvent) {
    this.editingEventId = event.id;
    this.modalType = 'new-event';
    this.isModalOpen = true;

    // Parse date and time from ISO string
    let dateStr = '';
    let timeStr = '';
    if (event.startDateIso) {
      try {
        const d = new Date(event.startDateIso);
        // YYYY-MM-DD
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;

        // HH:mm
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        timeStr = `${hour}:${minute}`;
      } catch (e) {
        Logger.error('Date parsing error', e);
      }
    }

    this.newEventData = {
      title: event.title,
      shortDescription: event.description, // using description as short desc for now
      date: dateStr,
      time: timeStr,
      location: event.location,
      quota: event.quota ? String(event.quota) : '',
      description: event.description,
      image: event.imageUrl, // Preview için
      imageFile: null, // Yeni dosya seçilmediyse null
    };
  }

  // Onaya Gönderilen (pending) etkinlik için düzenleme - inline editing
  editEventFromDetail() {
    if (this.selectedEvent) {
      this.isEditingEventDetail = true;
      this.initializeEditedEventData();
    }
  }

  // Onaylanmış (approved) etkinlik için düzenleme - sadece düzenleme modunu aç
  // Yayından kaldırma işlemi saveEventFromDetail'de yapılacak
  editApprovedEventFromDetail() {
    if (this.selectedEvent) {
      this.isEditingEventDetail = true;
      this.initializeEditedEventData();
      // Not: Etkinlik henüz yayından kaldırılmadı, sadece düzenleme modu açıldı
      // Yayından kaldırma işlemi "Kaydet ve Onaya Gönder" butonuna basıldığında yapılacak
    }
  }

  // Reddedilmiş (rejected) etkinlik için düzenleme - inline editing
  editRejectedEventFromDetail() {
    if (this.selectedEvent) {
      this.isEditingEventDetail = true;
      this.initializeEditedEventData();
    }
  }

  // Düzenlenen event verilerini başlat
  initializeEditedEventData() {
    if (!this.selectedEvent) return;

    // Parse date and time from ISO string
    let dateStr = '';
    let timeStr = '';

    // Önce startDateIso'dan parse etmeyi dene
    if (this.selectedEvent.startDateIso) {
      try {
        const d = new Date(this.selectedEvent.startDateIso);

        // Geçerlilik kontrolü
        if (!isNaN(d.getTime())) {
          // YYYY-MM-DD
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;

          // HH:mm
          const hour = String(d.getHours()).padStart(2, '0');
          const minute = String(d.getMinutes()).padStart(2, '0');
          timeStr = `${hour}:${minute}`;
        }
      } catch (e) {
        Logger.error('Date parsing error from startDateIso:', e);
      }
    }

    // Eğer startDateIso'dan parse edilemediyse, selectedEvent.time'ı kullan
    if (!timeStr && this.selectedEvent.time && this.selectedEvent.time.trim().length > 0) {
      // selectedEvent.time zaten "HH:mm" formatında olmalı
      timeStr = this.selectedEvent.time.trim();
    }

    // Eğer hala tarih yoksa, bugünün tarihini kullan (fallback)
    if (!dateStr) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }

    // Eğer hala saat yoksa, varsayılan saat kullan (fallback)
    if (!timeStr) {
      timeStr = '10:00';
    }

    // Kontenjan değerini düzgün handle et
    let quotaValue = '';
    if (this.selectedEvent.quota !== undefined && this.selectedEvent.quota !== null) {
      quotaValue = String(this.selectedEvent.quota);
    } else if (this.selectedEvent.quota === 0) {
      quotaValue = '0';
    }

    this.editedEventData = {
      title: this.selectedEvent.title || '',
      shortDescription: this.selectedEvent.description?.substring(0, 70) || '',
      date: dateStr,
      time: timeStr,
      location: this.selectedEvent.location || '',
      quota: quotaValue,
      description: this.selectedEvent.description || '',
      image: this.selectedEvent.imageUrl || '', // Preview için
      imageFile: null as File | null, // Backend'e yüklenecek dosya
    };
  }

  // Event detail modal'da kaydet
  saveEventFromDetail() {
    if (!this.selectedEvent || !this.isEditingEventDetail) return;

    // Validation - daha detaylı kontrol
    const hasValidTitle =
      this.editedEventData.title?.trim() && this.editedEventData.title.trim().length > 0;
    const hasValidDate = this.editedEventData.date && this.editedEventData.date.trim().length > 0;
    const hasValidTime = this.editedEventData.time && this.editedEventData.time.trim().length > 0;
    const hasValidLocation =
      this.editedEventData.location?.trim() && this.editedEventData.location.trim().length > 0;
    const hasValidQuota =
      this.editedEventData.quota && String(this.editedEventData.quota).trim().length > 0;
    const hasValidDescription =
      this.editedEventData.description?.trim() &&
      this.editedEventData.description.trim().length > 0;

    if (
      !hasValidTitle ||
      !hasValidDate ||
      !hasValidTime ||
      !hasValidLocation ||
      !hasValidQuota ||
      !hasValidDescription
    ) {
      // Hangi alanların eksik olduğunu belirt
      const missingFields: string[] = [];
      if (!hasValidTitle) missingFields.push('Etkinlik İsmi');
      if (!hasValidDate) missingFields.push('Tarih');
      if (!hasValidTime) missingFields.push('Saat');
      if (!hasValidLocation) missingFields.push('Konum');
      if (!hasValidQuota) missingFields.push('Kontenjan');
      if (!hasValidDescription) missingFields.push('Açıklama');

      this.showToast(`Lütfen şu alanları doldurun: ${missingFields.join(', ')}`, 'error');
      return;
    }

    // Parse date and time
    let startDate: Date;
    let endDate: Date;

    try {
      const dateStr = this.editedEventData.date?.trim();
      const timeStr = this.editedEventData.time?.trim();

      // Boş string kontrolü
      if (!dateStr || dateStr.length === 0 || !timeStr || timeStr.length === 0) {
        this.showToast('Lütfen tarih ve saat bilgilerini girin.', 'error');
        return;
      }

      const [year, month, day] = dateStr.split('-').map(Number);
      const [hour, minute] = timeStr.split(':').map(Number);

      startDate = new Date(year, month - 1, day, hour, minute);
      endDate = new Date(startDate);

      if (isNaN(startDate.getTime())) {
        throw new Error('Geçersiz tarih formatı');
      }
    } catch (error) {
      this.showToast('Lütfen geçerli bir tarih ve saat girin.', 'error');
      return;
    }

    // Update event
    const eventId = this.selectedEvent.id; // Store eventId to avoid null checks in callbacks
    const wasApproved = this.selectedEvent.status === 'approved'; // Approved event'ten mi düzenleniyor?

    // Fotoğraf silme durumunu kontrol et
    const isImageDeleted = this.editedEventData.image === '' && !this.editedEventData.imageFile;
    const hasNewImage =
      this.editedEventData.imageFile !== null && this.editedEventData.imageFile !== undefined;

    Logger.log('[saveEventFromDetail] Image state check:', {
      isImageDeleted,
      hasNewImage,
      imageFile: !!this.editedEventData.imageFile,
      image: this.editedEventData.image ? 'has value' : 'empty',
    });

    this.eventService
      .updateEvent(eventId, {
        title: this.editedEventData.title,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: this.editedEventData.location,
        description: this.editedEventData.description,
        shortDescription: this.editedEventData.shortDescription || this.editedEventData.description,
        // Eğer fotoğraf silinmişse, boş string gönder (backend'de EventPictureLink'i temizler)
        imageUrl: isImageDeleted ? '' : undefined,
        quota: this.editedEventData.quota ? Number(this.editedEventData.quota) : undefined,
      })
      .subscribe({
        next: (response) => {
          Logger.log('Event updated successfully:', response);

          // Eğer approved event'ten düzenleniyorsa, yayından kaldırıldı ve onaya gönderildi
          if (wasApproved) {
            Logger.log('Approved event yayından kaldırıldı ve onaya gönderildi');
          }

          // Eğer fotoğraf silinmişse, imageUrl'i temizle ve success mesajı göster
          if (isImageDeleted) {
            if (this.selectedEvent) {
              this.selectedEvent.imageUrl = '';
              // Dashboard events listesinde de güncelle
              const eventInList = this.dashboardEvents.find((e) => e.id === eventId);
              if (eventInList) {
                eventInList.imageUrl = '';
              }
            }

            // Success mesajı göster
            if (wasApproved) {
              this.showToast(
                "Etkinlik güncellendi, fotoğraf silindi, yayından kaldırıldı ve onaya gönderildi! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
                'success'
              );
            } else {
              this.showToast(
                "Etkinlik güncellendi, fotoğraf silindi ve tekrar onaya gönderildi! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
                'success'
              );
            }
            this.isEditingEventDetail = false;
            this.editedEventData = {};

            // Pop-up'ı kapat (önce kapat, sonra reload yap)
            this.closeEventDetail();

            // Reload events from backend (loading gösterme)
            if (this.clubInfo.id) {
              setTimeout(() => {
                this.loadCommunityEvents(this.clubInfo.id, true); // skipLoading = true
              }, 500);
            }
            return; // Fotoğraf silme durumunda işlem tamamlandı
          }

          // Eğer yeni fotoğraf seçildiyse, ayrı endpoint ile yükle
          if (hasNewImage && eventId) {
            Logger.log(
              '[saveEventFromDetail] Uploading image for event:',
              eventId,
              'File:',
              this.editedEventData.imageFile?.name
            );
            this.eventService.uploadEventImage(eventId, this.editedEventData.imageFile).subscribe({
              next: (uploadResponse) => {
                Logger.log(
                  '[saveEventFromDetail] Event image uploaded successfully:',
                  uploadResponse
                );
                Logger.log(
                  '[saveEventFromDetail] Raw ImagePath from backend:',
                  uploadResponse.ImagePath
                );

                // Backend'den gelen ImagePath zaten full URL (convert edilmiş)
                const imageUrl = uploadResponse.ImagePath || '';
                Logger.log('[saveEventFromDetail] Uploaded imageUrl:', imageUrl);

                // Backend'den gelen ImagePath'i direkt olarak selectedEvent'e ata
                if (this.selectedEvent && imageUrl) {
                  Logger.log(
                    '[saveEventFromDetail] Updating selectedEvent.imageUrl from',
                    this.selectedEvent.imageUrl,
                    'to',
                    imageUrl
                  );
                  // Cache-busting için timestamp ekle (yeni yüklenen image'ler için)
                  const imageUrlWithCacheBust =
                    imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
                  Logger.log(
                    '[saveEventFromDetail] Image URL with cache-bust:',
                    imageUrlWithCacheBust
                  );
                  // Object reference'ı değiştir ki Angular change detection çalışsın
                  this.selectedEvent = { ...this.selectedEvent, imageUrl: imageUrlWithCacheBust };
                  // Dashboard events listesinde de güncelle (cache-bust olmadan, çünkü liste için gerekli değil)
                  const eventInList = this.dashboardEvents.find((e) => e.id === eventId);
                  if (eventInList) {
                    Logger.log(
                      '[saveEventFromDetail] Updating eventInList.imageUrl from',
                      eventInList.imageUrl,
                      'to',
                      imageUrl
                    );
                    eventInList.imageUrl = imageUrl;
                  } else {
                    Logger.warn(
                      '[saveEventFromDetail] Event not found in dashboardEvents list, ID:',
                      eventId
                    );
                  }
                } else {
                  Logger.warn(
                    '[saveEventFromDetail] Cannot update imageUrl - selectedEvent:',
                    !!this.selectedEvent,
                    'imageUrl:',
                    imageUrl
                  );
                }

                // Approved event'ten düzenleniyorsa özel mesaj
                if (wasApproved) {
                  this.showToast(
                    "Etkinlik ve fotoğrafı güncellendi, yayından kaldırıldı ve onaya gönderildi! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
                    'success'
                  );
                } else {
                  this.showToast(
                    "Etkinlik ve fotoğrafı güncellendi ve tekrar onaya gönderildi! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
                    'success'
                  );
                }
                this.isEditingEventDetail = false;
                this.editedEventData = {};

                // Pop-up'ı kapat (önce kapat, sonra reload yap)
                this.closeEventDetail();

                // Reload events from backend to get fresh data (fotoğraf path'i ile birlikte, loading gösterme)
                // Backend'in fotoğrafı işlemesi ve event objesine set etmesi için daha uzun bekleme
                if (this.clubInfo.id) {
                  setTimeout(() => {
                    this.loadCommunityEvents(this.clubInfo.id, true); // skipLoading = true
                  }, 1500); // Backend'in fotoğrafı kaydetmesi ve event objesine set etmesi için daha uzun bekleme
                }
              },
              error: (uploadErr: any) => {
                Logger.error('Etkinlik fotoğrafı yüklenemedi:', uploadErr);
                // Etkinlik güncellendi ama fotoğraf yüklenemedi
                this.showToast(
                  'Etkinlik güncellendi ancak fotoğraf yüklenirken bir hata oluştu. Etkinliği düzenleyerek fotoğrafı tekrar yükleyebilirsiniz.',
                  'error'
                );
                this.isEditingEventDetail = false;
                this.editedEventData = {};

                // Pop-up'ı kapat (önce kapat, sonra reload yap)
                this.closeEventDetail();

                // Reload events from backend (fotoğraf path'i ile birlikte, loading gösterme)
                if (this.clubInfo.id) {
                  setTimeout(() => {
                    this.loadCommunityEvents(this.clubInfo.id, true); // skipLoading = true
                  }, 500); // Backend'in fotoğrafı kaydetmesi için kısa bir bekleme
                }
              },
            });
          } else {
            // Fotoğraf yok, sadece etkinlik güncellendi
            // Approved event'ten düzenleniyorsa özel mesaj
            if (wasApproved) {
              this.showToast(
                "Etkinlik güncellendi, yayından kaldırıldı ve onaya gönderildi! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
                'success'
              );
            } else {
              this.showToast(
                "Etkinlik güncellendi ve tekrar onaya gönderildi! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
                'success'
              );
            }
            this.isEditingEventDetail = false;
            this.editedEventData = {};

            // Pop-up'ı kapat (önce kapat, sonra reload yap)
            this.closeEventDetail();

            // Reload events from backend (loading gösterme)
            if (this.clubInfo.id) {
              this.loadCommunityEvents(this.clubInfo.id, true); // skipLoading = true
            }
          }
        },
        error: (err: any) => {
          Logger.error('Etkinlik güncellenemedi:', err);
          let errorMessage = 'Etkinlik güncellenirken bir hata oluştu.';
          if (err.status === 401 || err.status === 403) {
            errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          }
          this.showToast(errorMessage, 'error');
        },
      });
  }

  // Event detail modal'da iptal
  cancelEditEventDetail() {
    this.isEditingEventDetail = false;
    this.editedEventData = {
      imageFile: null, // Reset imageFile
    };
  }

  closeEventDetail() {
    this.selectedEvent = null;
    this.isEditingEventDetail = false;
    this.editedEventData = {};
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  openRejectionModal(rejectionReason: string) {
    this.selectedRejectionReason = rejectionReason || 'Revize nedeni belirtilmemiş.';
    this.showRejectionModal = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeRejectionModal() {
    this.showRejectionModal = false;
    this.selectedRejectionReason = '';
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  proceedToEditRejectedEvent() {
    this.closeRejectionModal();
    // Ensure the underlying event detail modal stays open and switches to edit mode
    // active scroll lock again because closeRejectionModal removed it,
    // but we want it for the underlying modal if needed, though typically modal-overlay handles it?
    // Actually closeRejectionModal removes overflow:hidden.
    // But since selectedEvent is still true, the underlying modal is visible.
    // We should probably ensure overflow is hidden if valid.
    if (isPlatformBrowser(this.platformId) && this.selectedEvent) {
      document.body.style.overflow = 'hidden';
    }

    this.editRejectedEventFromDetail();
  }

  // Spam kontrolünü yapan private metod (Community Dashboard için)
  private performSpamCheck(eventData: {
    title: string;
    description: string;
    shortDescription?: string;
    city?: string;
    location?: string;
    startDate?: string;
    communityName?: string;
  }): Promise<{ clean: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      // Backend spam API'si: title=etkinlik adı, category=konum, body=detaylı açıklama, notes=kısa açıklama
      const spamPayload = {
        title: eventData.title || '',
        category: eventData.location || '',
        body: eventData.description || '',
        notes: eventData.shortDescription || '',
      };

      // SpamService kullanarak spam kontrolü yap
      this.spamService
        .checkSpam(spamPayload)
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
            } else if (error.message) {
              errorMessage = error.message;
            }

            reject({ clean: false, message: errorMessage });
            return of(null);
          })
        )
        .subscribe({
          next: (response: any) => {
            if (!response) {
              reject({ clean: false, message: 'Backend yanıtı boş.' });
              return;
            }

            // Backend formatı:
            // {
            //   "analysis": { "forbidden": {...}, "spam": {...}, "politics": {...} },
            //   "moderation": { "status": "yeniden_admin_kontrolu_politics" | "kabul" | ..., "reason": [], "scores": {...} },
            //   "highlighted": {...}
            // }
            const analysis = response.analysis || {};
            const moderation = response.moderation || {};
            const forbiddenCount = analysis.forbidden?.count || 0;
            const spamCount = analysis.spam?.count || 0;
            const politicsCount = analysis.politics?.count || 0;
            const moderationStatus = moderation.status || '';

            // Status kontrolü
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
            const reasonArray = moderation.reason || [];
            const reason = Array.isArray(reasonArray) ? reasonArray.join(', ') : reasonArray || '';

            if (isClean) {
              const cleanMessage =
                reason || 'İçerik temizdir. Spam, yasak kelime veya siyasi içerik tespit edilmedi.';
              resolve({ clean: true, message: cleanMessage });
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
              if (moderationStatus && moderationStatus.includes('admin_kontrolu')) {
                issues.push('Admin kontrolü gerekli');
              }
              const errorMessage =
                reason ||
                (issues.length > 0
                  ? `İçerikte sorun tespit edildi: ${issues.join(', ')}.`
                  : 'İçerik kontrol edilmeli.');
              reject({ clean: false, message: errorMessage });
            }
          },
          error: (error) => {
            reject({ clean: false, message: 'Spam kontrolü başarısız.' });
          },
        });
    });
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
    this.activeTab = 'settings';
  }

  handleLogoutClick() {
    this.isProfileOpen = false;
    this.logout();
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      this.showToast('Çıkış yapılıyor...', 'success');
      // Local storage'ı temizle
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_type');
      localStorage.removeItem('community_info');

      // Anasayfaya yönlendir
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    }
  }

  navigateToDashboard() {
    this.isProfileOpen = false;
    this.activeTab = 'overview';
  }

  getRoleDisplayName(): string {
    return 'Topluluk Hesabı';
  }

  getDashboardLabel(): string {
    return 'Panelim';
  }

  getDashboardIcon(): string {
    return 'groups';
  }

  // Helper: Backend'den gelen ImagePath'i tam URL'ye çevir ve geçersiz değerleri filtrele
  private convertImagePathToFullUrl(imagePath: string): string {
    if (!imagePath) {
      return '';
    }

    // String'e çevir ve trim yap
    const pathStr = String(imagePath).trim();

    // Çok kısa path'ler geçersiz (örn: "string" = 6 karakter)
    if (pathStr.length < 10) {
      // Geçersiz placeholder değerleri kontrol et
      const invalidValues = ['string', 'null', 'undefined', 'none', 'placeholder'];
      const normalizedPath = pathStr.toLowerCase();
      if (invalidValues.includes(normalizedPath)) {
        return '';
      }
    }

    // Tam URL ise (http/https) sadece path kısmını al — link bağlamada /ImagesUnides/ kullanılıyor
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
      try {
        const pathname = new URL(pathStr).pathname;
        if (pathname.startsWith('/ImagesUnides/')) return pathname;
        if (pathname.startsWith('/images/')) return pathname.replace('/images/', '/ImagesUnides/');
        if (pathname.startsWith('/assets/img/'))
          return pathname.replace('/assets/img/', '/ImagesUnides/');
        return pathname || pathStr;
      } catch {
        return pathStr;
      }
    }
    if (pathStr.startsWith('data:') || pathStr.startsWith('blob:')) {
      return pathStr;
    }

    // Relative path kontrolü - backend'den `/images/Etkinlikler/`, `/ImagesUnides/Etkinlikler/`, `/images/Duyurular/`, `/images/Banner/`, `/images/Logo/` formatında gelebilir
    // Eğer path `/images/` veya `/ImagesUnides/` ile başlamıyorsa ve çok kısaysa geçersiz olabilir
    const isValidPath = pathStr.startsWith('/images/') || pathStr.startsWith('/ImagesUnides/');
    if (!isValidPath && pathStr.length < 20) {
      // Geçersiz placeholder değerleri tekrar kontrol et
      const invalidValues = ['string', 'null', 'undefined', 'none', 'placeholder'];
      const normalizedPath = pathStr.toLowerCase();
      if (invalidValues.includes(normalizedPath)) {
        return '';
      }
    }

    // Relative path ise tam URL'ye çevir
    // Backend'den `/assets/img/Duyurular/`, `/assets/img/Banner/`, `/assets/img/Logo/` formatında gelebilir
    // Bunları `/ImagesUnides/Duyurular/`, `/ImagesUnides/Banner/`, `/ImagesUnides/Logo/` formatına çevir
    let finalPath = pathStr;
    if (!finalPath.startsWith('/')) {
      finalPath = '/' + finalPath;
    }

    // Path dönüşümü: `/assets/img/` -> `/ImagesUnides/`
    if (finalPath.startsWith('/assets/img/')) {
      finalPath = finalPath.replace('/assets/img/', '/ImagesUnides/');
    }
    // Eğer zaten `/ImagesUnides/` ile başlıyorsa olduğu gibi bırak
    // Eğer `/images/` ile başlıyorsa (küçük harf) `/ImagesUnides/` yap
    else if (finalPath.startsWith('/images/')) {
      finalPath = finalPath.replace('/images/', '/ImagesUnides/');
    }

    // ImagePath olarak sadece /ImagesUnides/ path döndür (link bağlamada tam URL yok)
    return finalPath;
  }

  // Image error handler - ImageErrorHandlerService kullanarak tutarlı hata yönetimi
  onImageError(
    event: Event,
    type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar' = 'event'
  ): void {
    this.imageErrorHandler.handleImageError(event, type);
  }

  ngOnDestroy(): void {
    this.stopPeriodicAccessCheck();
    // AFK Detection'ı durdur
    this.afkDetectionService.stop();
  }
}
