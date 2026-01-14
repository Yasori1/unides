import { Component, OnInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ImageUploadComponent } from '../../components/ui/image-upload/image-upload';
import { CommunityService, Community } from '../../services/community.services';
import { EventService } from '../../services/event.services';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
interface Member {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  grade: string;
  avatar: string;
  status: 'Aktif' | 'Pasif';
  university?: string;
}
interface UserSearchResult {
  name: string;
  email: string;
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
  rejectionReason?: string;
  time?: string;
  quota?: number;
}

@Component({
  selector: 'app-community-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent, LumaSpinComponent],
  templateUrl: './community-dashboard.component.html',
  styleUrls: ['./community-dashboard.component.scss'],
})
export class CommunityDashboardComponent implements OnInit {
  activeTab: string = 'overview';

  // UI State
  isSidebarCollapsed: boolean = false;
  isModalOpen: boolean = false;
  isProfileOpen: boolean = false;
  showNotifications: boolean = false;
  activeRowMenuId: number | null = null;
  modalType: 'new-event' | 'new-project' | 'new-member' | 'edit-member' | null = null;
  isSearchingMembers = false;
  memberSearchQuery = '';
  memberSearchResults: UserSearchResult[] = [];
  isBulkAddMode = false;
  bulkEmailsText = '';
  confirmDeleteId: number | null = null;
  confirmDeleteType: 'member' | 'event' = 'member';
  confirmVisible = false;
  confirmHiding = false;
  private confirmTimer: any;
  memberCurrentPage = 1;
  membersPerPage = 20;
  private toastTimer: any;
  showBannerModal = false;
  showAvatarModal = false;
  initialClubInfo: any = {};

  // Eksik olan değişken eklendi
  selectedEvent: DashboardEvent | null = null;

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
    image: '',
  };

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
  newMemberData = {
    name: '',
    department: '',
    role: 'Üye',
    email: '',
    phone: '',
    grade: '1. Sınıf',
  };
  memberSearchText: string = '';

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
  };

  stats = { totalMembers: 0, approvedEvents: 0, pendingEvents: 0, totalEvents: 0 };
  statusFilter: 'all' | 'approved' | 'pending' | 'rejected' = 'all';
  statusLabels = {
    approved: 'Onaylanan Etkinlik',
    pending: 'Onaya Gönderilen',
    rejected: 'Reddedilen Etkinlik',
  };

  dashboardEvents: DashboardEvent[] = [
    {
      id: 1,
      title: 'Yapay Zeka Zirvesi',
      status: 'approved',
      imageUrl:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=60',
      date: '12 Mayıs',
      startDateIso: '2025-05-12T10:00:00Z',
      location: 'İTÜ Ayazağa',
      category: 'Teknoloji',
      description: 'Sektörden konuşmacılarla AI odaklı zirve.',
    },
    {
      id: 2,
      title: 'Robotik Atölye',
      status: 'pending',
      imageUrl:
        'https://images.unsplash.com/photo-1581094288338-60f87c68fc9b?auto=format&fit=crop&w=800&q=60',
      date: '25 Mayıs',
      startDateIso: '2025-05-25T14:00:00Z',
      location: 'ODTÜ Kültür Merkezi',
      category: 'Atölye',
      description: 'Arduino ve sensörlerle uygulamalı robotik eğitimi.',
    },
    {
      id: 3,
      title: 'FinTech Günleri',
      status: 'approved',
      imageUrl:
        'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=60',
      date: '2 Haziran',
      startDateIso: '2025-06-02T09:00:00Z',
      location: 'Boğaziçi Garanti Kültür',
      category: 'Finans',
      description: 'Ödeme teknolojileri ve blokzincir seminerleri.',
    },
    {
      id: 4,
      title: 'Sosyal Sorumluluk Koşusu',
      status: 'rejected',
      imageUrl:
        'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=800&q=60',
      date: '8 Haziran',
      startDateIso: '2025-06-08T08:00:00Z',
      location: 'Ankara Kampüsü',
      category: 'Sosyal',
      description: 'Bağış toplama koşusu için başvuru reddedildi.',
      rejectionReason: 'Etkinlik bütçesi yetersiz görüldü. Lütfen revize ediniz.',
    },
    {
      id: 5,
      title: 'Hackathon 24',
      status: 'pending',
      imageUrl:
        'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=60',
      date: '15 Haziran',
      startDateIso: '2025-06-15T18:00:00Z',
      location: 'Online',
      category: 'Yarışma',
      description: '48 saatlik ürün geliştirme maratonu.',
    },
  ];

  projects: Project[] = [
    {
      id: 1,
      name: 'İTÜ Robot Olimpiyatları',
      category: 'Teknoloji',
      status: 'Yayında',
      progress: 85,
      budget: 45000,
      deadline: '2025-05-20',
      isPromoted: true,
    },
    {
      id: 2,
      name: 'Python Eğitim Kampı',
      category: 'Eğitim',
      status: 'Onay Bekliyor',
      progress: 40,
      budget: 2000,
      deadline: '2025-11-15',
      isPromoted: false,
    },
    {
      id: 3,
      name: 'Teknofest Takımı',
      category: 'Yarışma',
      status: 'Yayında',
      progress: 60,
      budget: 120000,
      deadline: '2025-09-01',
      isPromoted: false,
    },
    {
      id: 4,
      name: 'Blockchain Workshop',
      category: 'Yazılım',
      status: 'Taslak',
      progress: 10,
      budget: 0,
      deadline: '2025-12-01',
      isPromoted: false,
    },
  ];

  members: Member[] = [
    {
      id: 1,
      name: 'Ece Yılmaz',
      role: 'Başkan',
      department: 'Bilgisayar Müh.',
      email: 'ece@itu.edu.tr',
      phone: '555-111-2233',
      grade: '3. Sınıf',
      avatar: 'https://ui-avatars.com/api/?name=EY&background=e2e8f0&color=1e293b',
      status: 'Aktif',
      university: 'İstanbul Teknik Üniversitesi',
    },
    {
      id: 2,
      name: 'Mert Demir',
      role: 'Başkan Yrd.',
      department: 'Endüstri Müh.',
      email: 'mert@itu.edu.tr',
      phone: '555-222-3344',
      grade: '4. Sınıf',
      avatar: 'https://ui-avatars.com/api/?name=MD&background=e2e8f0&color=1e293b',
      status: 'Aktif',
      university: 'İstanbul Teknik Üniversitesi',
    },
    {
      id: 3,
      name: 'Selin Kaya',
      role: 'Sosyal Medya',
      department: 'Mimarlık',
      email: 'selin@itu.edu.tr',
      phone: '555-333-4455',
      grade: '2. Sınıf',
      avatar: 'https://ui-avatars.com/api/?name=SK&background=e2e8f0&color=1e293b',
      status: 'Aktif',
      university: 'İstanbul Teknik Üniversitesi',
    },
    {
      id: 4,
      name: 'Burak Çelik',
      role: 'Üye',
      department: 'Makine Müh.',
      email: 'burak@itu.edu.tr',
      phone: '555-444-5566',
      grade: '1. Sınıf',
      avatar: 'https://ui-avatars.com/api/?name=BC&background=e2e8f0&color=1e293b',
      status: 'Pasif',
      university: 'İstanbul Teknik Üniversitesi',
    },
    {
      id: 5,
      name: 'Ayşe Can',
      role: 'Üye',
      department: 'Matematik',
      email: 'ayse.can@itu.edu.tr',
      phone: '555-555-6677',
      grade: '2. Sınıf',
      avatar: 'https://ui-avatars.com/api/?name=AC&background=e2e8f0&color=1e293b',
      status: 'Aktif',
      university: 'İstanbul Teknik Üniversitesi',
    },
  ];

  notifications: Notification[] = [
    { id: 1, text: 'Yeni üye başvurusu', time: '10 dk önce', read: false, targetTab: 'members' },
    { id: 2, text: 'TÜBİTAK onayı', time: '2 saat önce', read: false, targetTab: 'projects' },
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

  // Loading states for different data
  isLoadingCommunity = true;
  isLoadingEvents = true;
  isLoadingMembers = true;

  // Spam kontrolü için değişkenler
  inspectedEvents: Set<number> = new Set();
  checkingSpamEvents: Set<number> = new Set();
  spamResults: Map<number, { clean: boolean; message: string }> = new Map();

  constructor(
    private router: Router,
    private communityService: CommunityService,
    private eventService: EventService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCommunityProfile();
      this.loadCommunities();
    }
    // snapshot for settings change detection
    this.initialClubInfo = JSON.parse(JSON.stringify(this.clubInfo));
  }

  /**
   * Load the community profile for the logged-in user
   * Finds the community where the user is the president (ComLeadMail matches user email)
   *
   * NOTE: CommunityMiniDto doesn't include ComLeadMail, so we need to check each community's detail
   */
  private loadCommunityProfile(): void {
    // Get logged-in user's email from localStorage
    const userInfoStr = localStorage.getItem('user_info');
    if (!userInfoStr) {
      console.warn('User info not found in localStorage');
      return;
    }

    try {
      const userInfo = JSON.parse(userInfoStr);
      const userEmail = userInfo.email?.trim().toLowerCase();

      if (!userEmail) {
        console.warn('User email not found');
        return;
      }

      // Topluluk lideri (RolId 3) sadece aktif toplulukları görebilir
      // status: 'all' sadece GSB (RolId 2) için çalışır
      // Bu yüzden önce aktif toplulukları kontrol ediyoruz
      this.communityService.getAllCommunities({ status: 'active' }).subscribe({
        next: (communities) => {
          // CommunityMiniDto doesn't include ComLeadMail, so we need to check details
          // Check communities one by one to find the one where user is president
          this.findUserCommunity(communities, userEmail);
        },
        error: (err: any) => {
          console.error('Aktif topluluklar yüklenemedi:', err);
          // Hata durumunda kullanıcıya bilgi ver
          if (err.status === 403) {
            console.warn('Toplulukları görüntüleme yetkisi yok');
          }
        },
      });
    } catch (e) {
      console.error('Error parsing user info:', e);
    }
  }

  /**
   * Find the community where the user is president by checking each community's detail
   * (Because CommunityMiniDto doesn't include ComLeadMail)
   * Optimized: Check communities in parallel and stop when found
   */
  private findUserCommunity(communities: any[], userEmail: string): void {
    if (!communities || communities.length === 0) {
      console.warn('No communities found');
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

              // Update clubInfo with backend data
              this.clubInfo = {
                id: communityDetail.id,
                name: communityDetail.name,
                university: communityDetail.university || '',
                city: communityDetail.city || '',
                category: communityDetail.category || 'Genel',
                logo: communityDetail.logo || this.clubInfo.logo,
                banner:
                  communityDetail.banner || communityDetail.coverImage || this.clubInfo.banner,
                email: communityDetail.email || communityDetail.comMail || '',
                phone: this.clubInfo.phone, // Backend'de phone yok, mevcut değeri koru
                instagram: communityDetail.instagram || communityDetail.instagramUrl || '',
                description: communityDetail.about || communityDetail.description || '',
                comMail: communityDetail.comMail,
                comLeadMail: communityDetail.comLeadMail,
                webSiteUrl: communityDetail.webSiteUrl,
                instagramUrl: communityDetail.instagramUrl,
                miniAbout: communityDetail.miniAbout,
              };
              // Update initialClubInfo for change detection
              this.initialClubInfo = JSON.parse(JSON.stringify(this.clubInfo));

              // Loading state'leri başlat
              this.isLoadingCommunity = false;
              this.isLoadingEvents = true;
              this.isLoadingMembers = true;

              // Load events for this community
              this.loadCommunityEvents(communityDetail.id);

              // Load members for this community
              this.loadCommunityMembers(communityDetail.id);

              // Load statistics for overview
              this.loadLeaderStats();
            }
            resolve();
          },
          error: (err: any) => {
            console.error(`Community detail yüklenemedi (${community.id}):`, err);
            resolve();
          },
        });
      });

      checkPromises.push(checkPromise);
    }

    // Wait for all checks to complete
    Promise.all(checkPromises).then(() => {
      if (!found) {
        console.warn('No community found for user email:', userEmail);
        this.isLoadingCommunity = false;

        // Kullanıcı bir topluluğun başkanı değil, ana sayfaya yönlendir
        this.showToast(
          'Bu e-posta adresi ile ilişkili bir topluluk bulunamadı. Topluluk girişi için topluluk başkanı e-postası ile giriş yapmanız gerekmektedir.',
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

  // Load members for the community (Backend: GET /api/Communities/{id:guid}/members)
  private loadCommunityMembers(communityId: string): void {
    this.isLoadingMembers = true;
    this.communityService.getCommunityMembers(communityId).subscribe({
      next: (backendMembers) => {
        if (backendMembers && backendMembers.length > 0) {
          // Backend'den gelen üyeleri map et
          this.members = backendMembers.map(
            (m) =>
              ({
                id: m.id || 0,
                name: m.name || this.getNameFromEmail(m.email),
                role: m.role || 'Üye',
                department: m.department || '',
                email: m.email || '',
                phone: m.phone || '',
                grade: m.grade || '',
                avatar:
                  m.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    (m.name || this.getNameFromEmail(m.email) || 'U').substring(0, 2)
                  )}&background=e2e8f0&color=1e293b`,
                status: m.status || 'Aktif',
                university: m.university || this.getUniversityFromEmail(m.email),
              } as Member)
          );

          // Stats'ı güncelle
          this.stats.totalMembers = this.members.length;
        } else {
          // Backend'den üye gelmezse boş array kullan
          this.members = [];
          this.stats.totalMembers = 0;
        }
        this.isLoadingMembers = false;
      },
      error: (err: any) => {
        console.error('Topluluk üyeleri yüklenemedi:', err);
        // Hata durumunda boş array kullan
        this.members = [];
        this.stats.totalMembers = 0;
        this.isLoadingMembers = false;
      },
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
  private loadCommunityEvents(communityId: string): void {
    this.isLoadingEvents = true;
    // Backend'den topluluk bazlı etkinlikleri çek (tüm status'ler: 0, 1, 2)
    this.eventService.getCommunityEvents(communityId, [0, 1, 2]).subscribe({
      next: (communityEvents) => {
        // Map to DashboardEvent format
        this.dashboardEvents = communityEvents.map((e) => {
          // Tarih parse işlemini güvenli hale getir
          let startDate: Date;
          let dateStr: string = 'Tarih belirtilmemiş';
          let timeStr: string = '';
          let startDateIso: string = '';

          if (e.startDate) {
            try {
              // ISO string formatında gelebilir veya farklı formatlarda
              const dateValue = typeof e.startDate === 'string' ? e.startDate : String(e.startDate);

              // Tarih parse et
              startDate = new Date(dateValue);

              // Geçerlilik kontrolü
              if (isNaN(startDate.getTime())) {
                // Geçersiz tarih, varsayılan değer kullan
                startDate = new Date();
                dateStr = 'Tarih belirtilmemiş';
                timeStr = '';
                startDateIso = new Date().toISOString();
              } else {
                // Geçerli tarih, formatla
                dateStr = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
                timeStr = startDate.toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                startDateIso = startDate.toISOString();
              }
            } catch (error) {
              console.error('Tarih parse hatası:', error, e.startDate);
              startDate = new Date();
              dateStr = 'Tarih belirtilmemiş';
              timeStr = '';
              startDateIso = new Date().toISOString();
            }
          } else {
            // startDate yoksa varsayılan değer
            startDate = new Date();
            dateStr = 'Tarih belirtilmemiş';
            timeStr = '';
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

          return {
            id: e.id,
            title: e.title,
            status: status,
            imageUrl:
              e.imageUrl ||
              'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=60',
            date: dateStr,
            startDateIso: startDateIso,
            location: e.location || 'Konum belirtilmemiş',
            category: 'Etkinlik', // Backend'de category yok, varsayılan değer
            description: e.description || e.shortDescription || '',
            rejectionReason: (e as any).rejectionReason, // Backend'den gelirse
            time: timeStr,
            quota: e.capacity ? parseInt(e.capacity, 10) : 0,
          } as DashboardEvent;
        });

        // İstatistikler zaten loadLeaderStats() ile backend'den geliyor
        // Etkinlikler yüklendikten sonra istatistikleri tekrar yükle (güncel veriler için)
        this.loadLeaderStats();
        this.isLoadingEvents = false;
      },
      error: (err: any) => {
        console.error('Etkinlikler yüklenemedi:', err);
        // Hata durumunda boş array kullan
        this.dashboardEvents = [];
        this.isLoadingEvents = false;
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
        console.error('Topluluklar yüklenemedi:', err);
        this.collaborations = [];
        this.filteredCollaborations = [];
        this.isLoading = false;
      },
    });
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Buton tıklaması ise işlem yapma
    if (target.closest('.icon-btn.notification') || target.closest('.profile-pic')) {
      return;
    }

    // Profil dropdown kontrolü
    if (!target.closest('.profile-wrapper') && !target.closest('.profile-dropdown')) {
      this.isProfileOpen = false;
    }

    // Bildirimler dropdown kontrolü
    if (
      !target.closest('.notification-wrapper') &&
      !target.closest('.dropdown-menu.notifications')
    ) {
      this.showNotifications = false;
    }
  }

  get filteredMembers() {
    if (!this.memberSearchText) return this.members;
    const term = this.memberSearchText.toLowerCase();
    return this.members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.department.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term)
    );
  }

  get pagedMembers() {
    const start = (this.memberCurrentPage - 1) * this.membersPerPage;
    return this.filteredMembers.slice(start, start + this.membersPerPage);
  }

  get memberTotalPages() {
    return Math.max(1, Math.ceil(this.filteredMembers.length / this.membersPerPage));
  }

  get filteredDashboardEvents() {
    if (this.statusFilter === 'all') return this.dashboardEvents;
    return this.dashboardEvents.filter((e) => e.status === this.statusFilter);
  }

  get displayedDashboardEvents() {
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
      members: 'Üyeler',
      settings: 'Profil',
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

    // Üyeler sekmesine geçildiğinde üyeleri yükle
    if (tab === 'members' && this.clubInfo?.id) {
      this.loadCommunityMembers(this.clubInfo.id);
    }
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

  onLogoSelected(event: string | Event) {
    if (typeof event === 'string') {
      this.clubInfo.logo = event;
      this.showToast('Profil fotoğrafı güncellendi.', 'success');
      this.showAvatarModal = false;
      return;
    }
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.clubInfo.logo = reader.result as string;
      this.showToast('Profil fotoğrafı güncellendi.', 'success');
      this.showAvatarModal = false;
    };
    reader.readAsDataURL(file);
  }

  onBannerSelected(event: string | Event) {
    if (typeof event === 'string') {
      this.clubInfo.banner = event;
      this.showToast('Banner güncellendi.', 'success');
      this.showBannerModal = false;
      return;
    }
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.clubInfo.banner = reader.result as string;
      this.showToast('Banner güncellendi.', 'success');
      this.showBannerModal = false;
    };
    reader.readAsDataURL(file);
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_type');
      this.showToast('Çıkış yapıldı', 'success');
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    }
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

  // GÜNCELLEME: Kontrol listesi sadeleştirildi (Website, Youtube vs. çıkarıldı)
  // E-posta ve description artık değiştirilemez, bu yüzden kontrol dışı bırakıldı
  get isSettingsChanged() {
    const fields = ['instagram', 'banner', 'logo'];
    return fields.some((f) => (this.clubInfo as any)[f] !== this.initialClubInfo[f]);
  }

  openModal(type: any) {
    this.clearToast();
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
    };
    this.newProjectData = { name: '', category: 'Teknoloji', budget: 0, deadline: '' };
    this.newMemberData = {
      name: '',
      department: '',
      role: 'Üye',
      email: '',
      phone: '',
      grade: '1. Sınıf',
    };
    this.memberSearchQuery = '';
    this.memberSearchResults = [];
    this.isSearchingMembers = false;
    this.isBulkAddMode = false;
    this.bulkEmailsText = '';
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
    console.log('saveEvent called');
    console.log('isEventFormValid:', this.isEventFormValid);
    console.log('newEventData:', this.newEventData);

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
      const dateStr = this.newEventData.date; // Format: "YYYY-MM-DD"
      const timeStr = this.newEventData.time; // Format: "HH:mm"

      if (!dateStr || !timeStr) {
        throw new Error('Tarih ve saat gereklidir');
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
          imageUrl: this.newEventData.image || undefined, // Fotoğraf optional
          // Status backend tarafından 'Beklemede'ye çekilebilir, biz burada belirtmiyoruz
        })
        .subscribe({
          next: (response) => {
            console.log('Event updated successfully:', response);
            this.showToast(
              "Etkinlik güncellendi! Kurumsal Dashboard'a yönlendiriliyorsunuz...",
              'success'
            );
            this.closeModal();
            if (this.clubInfo.id) {
              this.loadCommunityEvents(this.clubInfo.id);
            }
            setTimeout(() => {
              this.router.navigate(['/corporate-dashboard'], {
                queryParams: { from: 'community-dashboard', eventUpdated: 'true' },
              });
            }, 1500);
          },
          error: (err: any) => {
            console.error('Etkinlik güncellenemedi:', err);
            const errorMessage = err.error?.message || 'Etkinlik güncellenirken bir hata oluştu';
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
        imageUrl: this.newEventData.image || undefined, // Fotoğraf optional
        quota: this.newEventData.quota ? Number(this.newEventData.quota) : undefined,
        // comId backend'de otomatik olarak creator'ın topluluğundan alınıyor
      })
      .subscribe({
        next: (response) => {
          console.log('Event created successfully:', response);
          this.showToast(
            "Etkinlik başarıyla oluşturuldu! Kurumsal Dashboard'daki etkinlik onaylama ekranına iletildi.",
            'success'
          );

          // Modal'ı kapat
          this.closeModal();

          // Etkinlikleri yeniden yükle (asenkron olarak)
          if (this.clubInfo.id) {
            this.loadCommunityEvents(this.clubInfo.id);
          }

          // Route yapma - sadece etkinlik oluşturuldu, kurumsal dashboard'a yönlendirme yok
          // Etkinlik otomatik olarak kurumsal dashboard'daki onaylama ekranına iletildi
        },
        error: (err: any) => {
          console.error('Etkinlik oluşturulamadı:', err);
          let errorMessage = 'Etkinlik oluşturulurken bir hata oluştu';
          if (err.status === 401 || err.status === 403) {
            errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          }
          this.showToast(errorMessage, 'error');
        },
      });
  }

  get isEventFormValid() {
    const { title, date, time, location, quota, description, image } = this.newEventData;
    return (
      !!title.trim() && !!date && !!time && !!location.trim() && !!quota && !!description.trim()
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
    if (file) this.readFileToBase64(file);
  }

  private readFileToBase64(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.newEventData.image = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  saveMember() {
    // Toplu ekleme modu aktifse, toplu ekleme fonksiyonunu çağır
    if (this.isBulkAddMode) {
      this.saveBulkMembers();
      return;
    }

    if (!this.newMemberData.email) {
      this.showToast('E-posta adresi zorunludur.', 'error');
      return;
    }

    // Community ID kontrolü
    const communityId = this.clubInfo?.id;
    if (!communityId) {
      this.showToast('Topluluk bilgisi bulunamadı.', 'error');
      return;
    }

    // Demo/Mock modu kontrolü
    if (communityId === 'mock-community-1') {
      const email = this.newMemberData.email;
      this.members.unshift({
        id: Date.now(),
        name: this.newMemberData.name || this.getNameFromEmail(email),
        role: this.newMemberData.role,
        department: this.newMemberData.department,
        email: email,
        phone: this.newMemberData.phone,
        grade: this.newMemberData.grade,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          this.getInitials(this.newMemberData.name || this.getNameFromEmail(email))
        )}&background=e2e8f0&color=1e293b`,
        status: 'Aktif',
        university: this.getUniversityFromEmail(email),
      });
      this.stats.totalMembers++;
      this.showToast('Üye eklendi (Demo Modu).', 'success');
      this.memberCurrentPage = 1;
      this.closeModal();
      return;
    }

    if (this.modalType === 'edit-member') {
      // Backend'de üye güncelleme yok, sadece silip yeniden ekleme yapılabilir
      // Şimdilik sadece frontend'de güncelleme yapıyoruz
      const id = (this.newMemberData as any).id;
      const index = this.members.findIndex((m) => m.id === id);
      if (index !== -1) {
        this.members[index] = {
          ...this.members[index],
          name: this.newMemberData.name,
          role: this.newMemberData.role,
          department: this.newMemberData.department,
          email: this.newMemberData.email,
          phone: this.newMemberData.phone,
          grade: this.newMemberData.grade,
        };
        this.showToast('Üye güncellendi.', 'success');
      }
      this.closeModal();
    } else {
      // Backend'e üye ekle
      this.communityService.addMember(communityId, { email: this.newMemberData.email }).subscribe({
        next: () => {
          // Başarılı - üyeleri backend'den yeniden yükle
          if (this.clubInfo.id) {
            this.loadCommunityMembers(this.clubInfo.id);
          }
          this.showToast('Üye eklendi.', 'success');
          this.memberCurrentPage = 1;
          this.closeModal();
        },
        error: (err: any) => {
          console.error('Üye eklenirken hata:', err);
          const errorMsg = err.error?.message || 'Üye eklenirken bir hata oluştu.';
          this.showToast(errorMsg, 'error');
        },
      });
    }
  }

  onMemberSearch() {
    const term = this.memberSearchQuery.trim();
    if (!term || term.length < 2) {
      this.memberSearchResults = [];
      return;
    }

    this.isSearchingMembers = true;

    // Backend'den topluluğa üye olmayan öğrencileri ara
    this.communityService.searchNonMemberStudents(term).subscribe({
      next: (students) => {
        // Backend'den gelen öğrencileri filtrele (mevcut üyeler hariç)
        const memberEmails = new Set(this.members.map((m) => m.email.toLowerCase()));
        this.memberSearchResults = students
          .filter((s: any) => {
            const email = (s.email || s.Email || '').toLowerCase();
            return !memberEmails.has(email);
          })
          .map((s: any) => ({
            name: s.name || s.Name || this.getNameFromEmail(s.email || s.Email || ''),
            email: s.email || s.Email || '',
          }));
        this.isSearchingMembers = false;
      },
      error: (err) => {
        console.error('Öğrenci arama hatası:', err);
        this.memberSearchResults = [];
        this.isSearchingMembers = false;
      },
    });
  }

  selectMemberSuggestion(user: UserSearchResult) {
    this.newMemberData.name = user.name;
    this.newMemberData.email = user.email;
    this.memberSearchQuery = `${user.name} (${user.email})`;
    this.memberSearchResults = [];
    this.memberCurrentPage = 1;
  }

  // Mail adresinden isim çıkarma
  getNameFromEmail(email: string): string {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length > 0) {
      // "ahmet.yilmaz" -> "Ahmet Yilmaz"
      return parts[0]
        .split(/[._]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
    }
    return email;
  }

  // Mail adresinden üniversite çıkarma (domain'den)
  getUniversityFromEmail(email: string): string {
    const emailRegex = /^[^\s@]+@([^\s@]+)$/;
    const match = email.match(emailRegex);
    if (!match) return '';

    const domain = match[1].toLowerCase();

    // Üniversite domain mapping
    const universityMap: { [key: string]: string } = {
      'itu.edu.tr': 'İTÜ',
      'bogazici.edu.tr': 'Boğaziçi',
      'odtu.edu.tr': 'ODTÜ',
      'metu.edu.tr': 'ODTÜ',
      'hacettepe.edu.tr': 'Hacettepe',
      'ege.edu.tr': 'Ege',
      'marmara.edu.tr': 'Marmara',
      'ankara.edu.tr': 'Ankara',
      'gsu.edu.tr': 'Galatasaray',
      'gsb.edu.tr': 'GSB',
      'yildiz.edu.tr': 'YTÜ',
      'koc.edu.tr': 'Koç',
    };

    // Eğer mapping'de varsa kullan, yoksa domain'i formatla
    if (universityMap[domain]) {
      return universityMap[domain];
    }

    // Domain'i formatla (örnek: itu.edu.tr -> İTÜ)
    const parts = domain.split('.');
    if (parts.length >= 2 && parts[1] === 'edu' && parts[2] === 'tr') {
      const uniCode = parts[0].toUpperCase();
      return uniCode;
    }

    // Fallback: domain'i direkt göster
    return domain;
  }

  // Toplu mail parse etme
  parseBulkEmails(text: string): string[] {
    if (!text || !text.trim()) return [];

    // Sadece virgül ile ayrılmış mailleri parse et
    const emails = text
      .split(',')
      .map((email) => email.trim())
      .filter((email) => {
        // Boş string'leri filtrele
        if (!email) return false;
        // Basit email validasyonu
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      });

    return emails;
  }

  // Toplu üye ekleme
  saveBulkMembers() {
    const emails = this.parseBulkEmails(this.bulkEmailsText);

    if (emails.length === 0) {
      this.showToast('Geçerli e-posta adresi bulunamadı.', 'error');
      return;
    }

    const communityId = this.clubInfo?.id;
    if (!communityId) {
      this.showToast('Topluluk bilgisi bulunamadı.', 'error');
      return;
    }

    // Demo/Mock modu kontrolü
    if (communityId === 'mock-community-1') {
      let addedCount = 0;
      emails.forEach((email) => {
        this.members.unshift({
          id: Date.now() + Math.random(),
          name: this.getNameFromEmail(email),
          email: email,
          role: 'Üye',
          department: '',
          phone: '',
          grade: '',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
            this.getInitials(this.getNameFromEmail(email))
          )}&background=e2e8f0&color=1e293b`,
          status: 'Aktif',
          university: this.getUniversityFromEmail(email),
        });
        addedCount++;
        this.stats.totalMembers++;
      });

      this.showToast(`${addedCount} üye başarıyla eklendi (Demo Modu).`, 'success');
      this.memberCurrentPage = 1;
      this.closeModal();
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let processedCount = 0;

    // Her mail için üye ekle
    emails.forEach((email, index) => {
      this.communityService.addMember(communityId, { email }).subscribe({
        next: () => {
          successCount++;
          processedCount++;

          // Tüm işlemler tamamlandığında üyeleri backend'den yeniden yükle
          if (processedCount === emails.length) {
            if (this.clubInfo.id) {
              this.loadCommunityMembers(this.clubInfo.id);
            }

            if (errorCount === 0) {
              this.showToast(`${successCount} üye başarıyla eklendi.`, 'success');
            } else {
              this.showToast(
                `${successCount} üye eklendi, ${errorCount} üye eklenirken hata oluştu.`,
                'error'
              );
            }
            this.memberCurrentPage = 1;
            this.closeModal();
          }
        },
        error: (err: any) => {
          console.error(`Üye eklenirken hata (${email}):`, err);
          errorCount++;
          processedCount++;

          // Tüm işlemler tamamlandığında toast göster
          if (processedCount === emails.length) {
            if (successCount > 0) {
              this.showToast(
                `${successCount} üye eklendi, ${errorCount} üye eklenirken hata oluştu.`,
                'error'
              );
            } else {
              this.showToast('Üyeler eklenirken bir hata oluştu.', 'error');
            }
            this.memberCurrentPage = 1;
            this.closeModal();
          }
        },
      });
    });
  }

  openDeleteConfirm(id: number) {
    this.clearToast();
    this.clearConfirmTimer();
    this.confirmDeleteId = id;
    this.confirmDeleteType = 'member';
    this.confirmVisible = true;
    this.confirmHiding = false;
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
    if (this.confirmDeleteType === 'member') {
      this.deleteMemberConfirmed();
    } else {
      this.deleteEventConfirmed();
    }
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

        this.showToast('Etkinlik silindi.', 'success');
        this.closeEventDetail();
        this.startCloseConfirm();
      },
      error: (err: any) => {
        console.error('Etkinlik silinirken hata:', err);
        const errorMsg = err.error?.message || 'Etkinlik silinirken bir hata oluştu.';
        this.showToast(errorMsg, 'error');
        this.startCloseConfirm();
      },
    });
  }

  deleteMemberConfirmed() {
    if (this.confirmDeleteId === null) return;

    // Silinecek üyeyi bul
    const memberToDelete = this.members.find((m) => m.id === this.confirmDeleteId);
    if (!memberToDelete) {
      this.startCloseConfirm();
      return;
    }

    // Community ID kontrolü
    const communityId = this.clubInfo?.id;
    if (!communityId) {
      this.showToast('Topluluk bilgisi bulunamadı.', 'error');
      this.startCloseConfirm();
      return;
    }

    // Backend'den üye çıkar
    this.communityService.removeMember(communityId, { email: memberToDelete.email }).subscribe({
      next: () => {
        // Başarılı - üyeleri backend'den yeniden yükle
        if (this.clubInfo.id) {
          this.loadCommunityMembers(this.clubInfo.id);
        }
        this.showToast('Üye silindi.', 'success');
        if (this.memberCurrentPage > this.memberTotalPages) {
          this.memberCurrentPage = this.memberTotalPages;
        }
        this.startCloseConfirm();
      },
      error: (err: any) => {
        console.error('Üye silinirken hata:', err);
        const errorMsg = err.error?.message || 'Üye silinirken bir hata oluştu.';
        this.showToast(errorMsg, 'error');
        this.startCloseConfirm();
      },
    });
  }

  setMemberPage(page: number) {
    if (page < 1 || page > this.memberTotalPages) return;
    this.memberCurrentPage = page;
  }

  onMemberSearchChange() {
    this.memberCurrentPage = 1;
  }

  editMember(member: Member) {
    this.openModal('edit-member');
    this.newMemberData = {
      name: member.name,
      department: member.department,
      role: member.role,
      email: member.email,
      phone: member.phone,
      grade: member.grade,
    };
    // Store ID to know which member to update
    (this.newMemberData as any).id = member.id;
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
    this.selectedEvent = event;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  onEventCardClick(event: DashboardEvent) {
    // Tüm etkinlikler için detay modal aç
    this.openEventDetail(event);
  }

  proceedToEditRejectedEvent() {
    this.closeRejectionModal();
    if (this.rejectedEventToEdit) {
      this.editEvent(this.rejectedEventToEdit);
      this.rejectedEventToEdit = null;
    }
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
        console.error('Date parsing error', e);
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
      image: event.imageUrl,
    };
  }

  closeEventDetail() {
    this.selectedEvent = null;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  openRejectionModal(rejectionReason: string) {
    this.selectedRejectionReason = rejectionReason;
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

  // Spam kontrolünü yapan private metod (Community Dashboard için)
  private performSpamCheck(eventData: {
    title: string;
    description: string;
    shortDescription?: string;
    location?: string;
    startDate?: string;
    communityName?: string;
  }): Promise<{ clean: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      // Status'u backend formatına çevir
      const status = 'pending';

      // Body'yi oluştur (description + shortDescription birleşimi)
      const bodyParts: string[] = [];
      if (eventData.shortDescription) {
        bodyParts.push(eventData.shortDescription);
      }
      if (eventData.description) {
        bodyParts.push(eventData.description);
      }
      const body = bodyParts.join('\n\n');

      // Notes'u oluştur (ek bilgiler)
      const notesParts: string[] = [];
      if (eventData.location) {
        notesParts.push(`Konum: ${eventData.location}`);
      }
      if (eventData.startDate) {
        notesParts.push(`Başlangıç: ${eventData.startDate}`);
      }
      if (eventData.communityName) {
        notesParts.push(`Topluluk: ${eventData.communityName}`);
      }
      const notes = notesParts.join('\n');

      // Backend'in beklediği formata göre veriyi hazırla
      const spamCheckData = {
        id: 0, // Yeni event için 0
        title: eventData.title || '',
        body: body || '',
        category: eventData.communityName || '',
        notes: notes || '',
        status: status,
        created_at: eventData.startDate || new Date().toISOString(),
      };

      // API'ye istek gönder (proxy üzerinden - CORS hatası önlemek için)
      const apiUrl = '/spam-check'; // Proxy bu isteği http://72.62.37.160:5002/check adresine yönlendirecek
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      });

      this.http
        .post(apiUrl, spamCheckData, {
          headers,
          responseType: 'json', // Backend JSON döndürüyor
        })
        .pipe(
          catchError((error) => {
            // Hata durumunda
            let errorMessage = 'Spam kontrolü sırasında bir hata oluştu.';

            if (
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

            // Backend formatı: { result: { status: "kabul", reason: "Temiz" }, ... }
            const result = response.result;
            if (result) {
              const isClean = result.status === 'kabul';
              const message =
                result.reason || (isClean ? 'İçerik temizdir.' : 'Spam içerik tespit edildi.');
              resolve({ clean: isClean, message });
            } else {
              // Eski format desteği (fallback)
              const isClean = response.clean !== false;
              const message =
                response.message || (isClean ? 'İçerik temizdir.' : 'Spam içerik tespit edildi.');
              resolve({ clean: isClean, message });
            }
          },
          error: (error) => {
            reject({ clean: false, message: 'Spam kontrolü başarısız.' });
          },
        });
    });
  }
}
