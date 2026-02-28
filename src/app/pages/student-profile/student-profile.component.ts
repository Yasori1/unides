import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { EventService, EventItem } from '../../services/event.services';
import { CommunityService, Community } from '../../services/community.services';
import { AfkDetectionService } from '../../services/afk-detection.service';
import { AuthService } from '../../services/auth.services';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';
import { ImageErrorHandlerService } from '../../services/image-error-handler.service';
import { Logger } from '../../utils/logger.util';
import { TurkishUppercasePipe } from '../../pipes/turkish-uppercase.pipe';

interface Stat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

// Local interface extending the service Community type for profile specific fields if any
interface ProfileCommunity extends Community {
  joinedDate?: string;
}

interface EventCard {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  community: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  imageUrl?: string;
  category?: string;
  university?: string;
  description?: string;
  color?: string;
  club?: string;
  semester?: string;
  quota?: string | number;
  communityId?: number;
  startDateISO?: string; // ISO formatında tarih (takvim için)
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, LumaSpinComponent, TurkishUppercasePipe],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.scss'],
})
export class StudentProfileComponent implements OnInit, OnDestroy {
  activeTab: 'overview' | 'communities' | 'events' | 'settings' = 'overview';
  isSidebarCollapsed: boolean = false;
  selectedCommunityForLeave: ProfileCommunity | null = null;
  selectedEvent: EventCard | null = null;
  showEventDates: boolean = false;
  calendarMonth: Date = new Date();
  calendarSelectedDate: string | null = null;
  showNotifications: boolean = false;
  isProfileOpen: boolean = false;

  // Loading states
  isLoadingCommunities = false;
  isLoadingEvents = false;
  isLoadingOverview = false;
  notifications: Array<{
    id: number;
    text: string;
    time: string;
    read: boolean;
    type?: 'event' | 'community' | 'general';
    link?: string;
    tab?: string;
  }> = [
      {
        id: 1,
        text: 'Yeni etkinlik duyurusu',
        time: '10 dk önce',
        read: false,
        type: 'event',
        tab: 'events',
      },
      {
        id: 2,
        text: 'Topluluk güncellemesi',
        time: '1 saat önce',
        read: false,
        type: 'community',
        tab: 'communities',
      },
    ];

  // User Info
  userInfo: any = {
    name: 'Öğrenci Adı',
    email: 'ogrenci@university.edu.tr',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  /** Şifre güç kuralları (Yeni Şifre alanı için — Öğrenci Kaydı ile aynı) */
  passwordMinLength = false;
  passwordHasUppercase = false;
  passwordHasLowercase = false;
  passwordHasNumber = false;
  passwordHasSpecial = false;
  hasPasswordInput = false;

  // Stats
  stats: Stat[] = [
    { label: 'Katıldığım Topluluklar', value: 0, icon: 'groups', color: '#2563eb' },
    { label: 'Topluluklarımın Etkinlikleri', value: 0, icon: 'event_available', color: '#10b981' },
  ];

  // Communities
  myCommunities: ProfileCommunity[] = [];

  // Events from communities
  communityEvents: EventCard[] = [];

  // Scroll positions for carousels
  eventsScrollPosition: number = 0;
  communitiesScrollPosition: number = 0;

  // Unified Profile Properties
  displayName: string = '';
  userInitial: string = '';

  constructor(
    public router: Router,
    public toastService: ToastService,
    private eventService: EventService,
    private communityService: CommunityService,
    private afkDetectionService: AfkDetectionService,
    private authService: AuthService,
    private imageErrorHandler: ImageErrorHandlerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Load user info from localStorage
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        try {
          const savedUserInfo = JSON.parse(userInfoStr);
          this.userInfo = {
            ...this.userInfo,
            name: savedUserInfo.name || savedUserInfo.fullName || this.userInfo.name,
            email: savedUserInfo.email || this.userInfo.email,
            id: savedUserInfo.id || this.userInfo.id,
            role: savedUserInfo.role || this.userInfo.role,
          };
        } catch (e) {
          Logger.error('Error parsing user info:', e);
        }
      }

      // Initialize Unified Profile Properties
      this.displayName = this.userInfo.name || 'Öğrenci';
      this.userInitial = this.displayName.charAt(0).toUpperCase();

      // Check query params for tab
      this.router.routerState.root.queryParams.subscribe(params => {
        if (params['tab']) {
          this.switchTab(params['tab']);
        }
      });

      this.loadData();
    }
  }

  loadData(): void {
    // Loading state'leri başlat
    this.isLoadingOverview = true;
    this.isLoadingCommunities = true;
    this.isLoadingEvents = true;

    // Topluluk başkanları aynı zamanda öğrenci oldukları için, her iki durumda da getMyMemberships() kullanılır
    // GET /api/Communities/me/memberships endpoint'i hem öğrencilerin hem de topluluk başkanlarının üye olduğu toplulukları döndürür
    this.communityService.getMyMemberships().subscribe({
      next: (memberships) => {
        if (memberships && memberships.length > 0) {
          // Map to ProfileCommunity format
          this.myCommunities = memberships.map((c: any) => ({
            ...c,
            joinedDate: c.joinedDate || new Date().toISOString().split('T')[0],
          }));

          // Stats'ları hesapla: Topluluk sayısı ve toplam etkinlik sayısı
          this.stats[0].value = memberships.length;
          
          // Tüm toplulukların etkinliklerini birleştir ve say
          const allEvents: any[] = [];
          let totalEventCount = 0;
          
          memberships.forEach((community: any) => {
            if (community.events && Array.isArray(community.events)) {
              // Her topluluğun etkinlik sayısını ekle
              totalEventCount += community.events.length;
              
              community.events.forEach((event: any) => {
                // Backend MemberCommunityEventDto formatını EventCard formatına çevir
                const eventDate = event.eventDate || event.EventDate;
                const eventClock = event.eventClock || event.EventClock || '00:00:00';
                let startDate: Date;

                if (eventDate) {
                  try {
                    // Backend DateOnly formatı: "dd.MM.yyyy" (örn: "15.01.2025")
                    // Backend TimeOnly formatı: "HH:mm" (örn: "14:30")
                    let dateStr = typeof eventDate === 'string' ? eventDate : eventDate.toString();
                    let timeStr = typeof eventClock === 'string' ? eventClock : eventClock.toString();

                    // DateOnly formatını kontrol et ve parse et
                    let day: number, month: number, year: number;

                    // "dd.MM.yyyy" formatını parse et
                    if (dateStr.includes('.')) {
                      const parts = dateStr.split('.');
                      if (parts.length === 3) {
                        day = parseInt(parts[0], 10);
                        month = parseInt(parts[1], 10) - 1; // JavaScript month is 0-indexed
                        year = parseInt(parts[2], 10);
                      } else {
                        throw new Error('Invalid date format');
                      }
                    }
                    // "YYYY-MM-DD" formatını parse et (fallback)
                    else if (dateStr.includes('-')) {
                      const parts = dateStr.split('-');
                      if (parts.length === 3) {
                        year = parseInt(parts[0], 10);
                        month = parseInt(parts[1], 10) - 1; // JavaScript month is 0-indexed
                        day = parseInt(parts[2], 10);
                      } else {
                        throw new Error('Invalid date format');
                      }
                    } else {
                      throw new Error('Invalid date format');
                    }

                    // TimeOnly formatını parse et
                    let hour: number, minute: number;
                    if (timeStr.includes(':')) {
                      const timeParts = timeStr.split(':');
                      hour = parseInt(timeParts[0], 10);
                      minute = parseInt(timeParts[1], 10) || 0;
                    } else {
                      hour = 0;
                      minute = 0;
                    }

                    // Date objesi oluştur (UTC+3 - Türkiye saati için)
                    // Türkiye saati UTC+3 olduğu için, tarihi UTC+3 olarak oluşturuyoruz
                    // JavaScript Date objesi local timezone'da çalışır, bu yüzden UTC+3 offset'ini manuel olarak ekliyoruz
                    startDate = new Date(year, month, day, hour, minute, 0);

                    // Geçerlilik kontrolü
                    if (isNaN(startDate.getTime())) {
                      Logger.warn('Invalid date after parsing:', { eventDate, eventClock, day, month, year, hour, minute });
                      startDate = new Date();
                    }
                  } catch (error) {
                    Logger.error('Error parsing date:', error, { eventDate, eventClock });
                    startDate = new Date();
                  }
                } else {
                  startDate = new Date();
                }

                // Türkçe tarih formatı: "15 Oca 2025"
                const formattedDate = startDate.toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                // Türkçe saat formatı: "14:30"
                const formattedTime = startDate.toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false, // 24 saat formatı
                });

                // Local timezone'da ISO formatı (YYYY-MM-DD) - UTC'ye çevirmeden
                const yearStr = startDate.getFullYear();
                const monthStr = String(startDate.getMonth() + 1).padStart(2, '0');
                const dayStr = String(startDate.getDate()).padStart(2, '0');
                const localISO = `${yearStr}-${monthStr}-${dayStr}`;

                allEvents.push({
                  id: event.eventId || event.EventId,
                  title: event.eventName || event.EventName,
                  date: formattedDate,
                  time: formattedTime,
                  location: event.eventLocation || event.EventLocation || 'Konum Belirtilmemiş',
                  community: community.name || 'Topluluk',
                  status: 'upcoming' as const,
                  imageUrl: event.eventPictureLink || event.EventPictureLink,
                  category: 'Etkinlik',
                  university: community.university || '',
                  description: event.miniAbout || event.MiniAbout || event.eventAbout || event.EventAbout,
                  communityId: community.id,
                  startDateISO: localISO, // Local timezone'da ISO formatı (takvim için)
                });
              });
            }
          });

          this.communityEvents = allEvents;
          
          // Stats'ları güncelle: Topluluk sayısı ve toplam etkinlik sayısı
          this.stats[0].value = memberships.length;
          this.stats[1].value = totalEventCount;
        } else {
          // No memberships found - show empty state
          this.myCommunities = [];
          this.communityEvents = [];
          this.stats[0].value = 0;
          this.stats[1].value = 0;
        }

        this.updateStatsAndLoading();
      },
      error: (err: any) => {
        Logger.error('Memberships yüklenemedi:', err);
        // Handle 401/403 gracefully
        if (err.status === 401) {
          this.toastService.show(
            'Topluluklara erişim için giriş yapmanız gerekiyor.',
            'error'
          );
          this.myCommunities = [];
          this.communityEvents = [];
          this.updateStatsAndLoading();
        } else if (err.status === 403) {
          // 403 hatası: Backend'de role kontrolü nedeniyle olabilir
          // Backend sadece RoleId == 1 (Öğrenci) için izin veriyor
          // Topluluk başkanları (RoleId == 3) için alternatif endpoint kullan
          // Kullanıcı hem öğrenci hem de topluluk başkanı olabilir
          Logger.log('403 hatası alındı, kullanıcı rolü kontrol ediliyor ve alternatif endpoint deneniyor...');
          this.loadDataForLeaderOrMixedRole();
        } else {
          // Other errors - show empty state
          this.myCommunities = [];
          this.communityEvents = [];
          this.updateStatsAndLoading();
        }
      },
    });
  }

  private loadDataForLeaderOrMixedRole(): void {
    // 403 hatası geldi: Kullanıcı topluluk başkanı (RoleId == 3) veya hem öğrenci hem topluluk başkanı olabilir
    // Backend'de GetUserCommunitiesAsync metodu var ama sadece RoleId == 1 için çalışıyor
    // Bu yüzden alternatif endpoint kullanıyoruz: getMyCommunities() - başkan olduğu toplulukları getirir
    
    Logger.log('loadDataForLeaderOrMixedRole: Alternatif endpoint deneniyor, kullanıcı email:', this.userInfo.email);
    
    this.communityService.getMyCommunities().subscribe({
      next: (communities) => {
        Logger.log('loadDataForLeaderOrMixedRole: Topluluklar yüklendi:', communities.length);
        if (communities && communities.length > 0) {
          // Map to ProfileCommunity format
          this.myCommunities = communities.map((c: any) => ({
            ...c,
            joinedDate: new Date().toISOString().split('T')[0], // Başkan olduğu tarih
          }));

          // Stats'ları hesapla
          this.stats[0].value = this.myCommunities.length;

          // Her topluluk için etkinlikleri çek
          this.loadEventsForCommunities(this.myCommunities);
        } else {
          Logger.warn('loadDataForLeaderOrMixedRole: Başkan olduğu topluluk bulunamadı');
          this.myCommunities = [];
          this.communityEvents = [];
          this.stats[0].value = 0;
          this.stats[1].value = 0;
          this.updateStatsAndLoading();
        }
      },
      error: (err: any) => {
        Logger.error('loadDataForLeaderOrMixedRole: Communities yüklenemedi:', err);
        this.myCommunities = [];
        this.communityEvents = [];
        this.stats[0].value = 0;
        this.stats[1].value = 0;
        this.updateStatsAndLoading();
      },
    });
  }

  private loadEventsForCommunities(communities: any[]): void {
    // Her topluluk için etkinlikleri çek
    const eventObservables = communities.map((community: any) => {
      const communityId = community.id || community.communityId;
      if (!communityId) return of([]);
      return this.eventService.getCommunityEvents(String(communityId), [0, 1, 2]); // Tüm status'ler
    });

    // Tüm etkinlikleri birleştir
    if (eventObservables.length > 0) {
      forkJoin(eventObservables).subscribe({
        next: (eventArrays) => {
          const allEvents: EventCard[] = [];
          eventArrays.forEach((events, index) => {
            const community = communities[index];
            events.forEach((event: EventItem) => {
              const eventCard = this.mapToEventCard(event);
              eventCard.community = community.name || 'Topluluk';
              allEvents.push(eventCard);
            });
          });
          this.communityEvents = allEvents;
          
          // Stats'ları güncelle
          this.stats[1].value = this.communityEvents.length;
          
          this.updateStatsAndLoading();
        },
        error: (err: any) => {
          Logger.error('Events yüklenemedi:', err);
          this.communityEvents = [];
          this.stats[1].value = 0;
          this.updateStatsAndLoading();
        },
      });
    } else {
      this.communityEvents = [];
      this.stats[1].value = 0;
      this.updateStatsAndLoading();
    }
  }

  private updateStatsAndLoading(): void {
    // Stats'lar getMyMemberships verisinden hesaplanıyor, burada sadece loading state'leri bitir
    // Loading state'leri bitir
    this.isLoadingOverview = false;
    this.isLoadingCommunities = false;
    this.isLoadingEvents = false;
  }

  private mapToEventCard(e: EventItem): EventCard {
    const start = e.startDate ? new Date(e.startDate) : new Date();

    // Local timezone'da ISO formatı (YYYY-MM-DD) - UTC'ye çevirmeden
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    const localISO = `${year}-${month}-${day}`;

    return {
      id: e.id,
      title: e.title,
      date: start.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      location: e.location || 'Konum Belirtilmemiş',
      community: e.communityName || 'Topluluk',
      status: 'upcoming', // Default to upcoming for now
      imageUrl: e.imageUrl,
      category: 'Etkinlik',
      university: '', // Service might not provide this directly in EventItem
      description: e.shortDescription || e.description,
      communityId: typeof e.communityId === 'number' ? e.communityId : (typeof e.communityId === 'string' ? parseInt(e.communityId, 10) : undefined),
      startDateISO: localISO, // Local timezone'da ISO formatı (takvim için)
    };
  }


  switchTab(tab: string): void {
    this.activeTab = tab as 'overview' | 'communities' | 'events' | 'settings';
    this.isProfileOpen = false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleNotifications(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.isProfileOpen = false;
  }


  handleNotificationClick(notification: any) {
    this.showNotifications = false;

    if (notification.tab) {
      this.switchTab(notification.tab as 'overview' | 'communities' | 'events' | 'settings');
    } else if (notification.link) {
      this.router.navigate([notification.link]);
    }

    // Bildirimi okundu olarak işaretle
    notification.read = true;
  }


  leaveCommunity(communityId: string): void {
    // Backend'e istek gönder
    const communityIdStr = typeof communityId === 'string' ? communityId : String(communityId);

    this.communityService.leaveCommunity(communityIdStr).subscribe({
      next: () => {
        // Backend'den başarılı yanıt geldi, frontend'de de kaldır
        this.myCommunities = this.myCommunities.filter((c) => {
          const cId = typeof c.id === 'string' ? c.id : String(c.id);
          return cId !== communityIdStr;
        });
        this.toastService.show('Topluluktan ayrıldınız', 'success');

        // Etkinlikleri de güncelle (ayrılan topluluğun etkinliklerini kaldır)
        const communityIdNum = typeof communityId === 'string' ? parseInt(communityId, 10) : communityId;
        this.communityEvents = this.communityEvents.filter((e) => {
          const eCommunityId = typeof e.communityId === 'string' ? parseInt(e.communityId, 10) : e.communityId;
          return eCommunityId !== communityIdNum;
        });

        // Stats'ları manuel olarak güncelle
        this.stats[0].value = this.myCommunities.length;
        this.stats[1].value = this.communityEvents.length;
      },
      error: (err) => {
        Logger.error('Topluluktan ayrılma hatası:', err);
        const errorMessage = err.error?.message || err.message || 'Topluluktan ayrılırken bir hata oluştu.';
        this.toastService.show(errorMessage, 'error');
      },
    });
  }

  openLeaveConfirm(community: ProfileCommunity): void {
    this.selectedCommunityForLeave = community;
  }

  confirmLeave(): void {
    if (!this.selectedCommunityForLeave) return;
    this.leaveCommunity(this.selectedCommunityForLeave.id);
    this.selectedCommunityForLeave = null;
  }

  cancelLeave(): void {
    this.selectedCommunityForLeave = null;
  }

  openEventDetail(event: EventCard): void {
    this.router.navigate(['/events', event.id]);
  }

  closeEventDetail(): void {
    this.selectedEvent = null;
  }

  goCommunityDetail(community: ProfileCommunity): void {
    this.router.navigate(['/communities', community.id]);
  }

  toggleEventCalendar(open?: boolean): void {
    this.showEventDates = open !== undefined ? open : !this.showEventDates;
    if (this.showEventDates && !this.calendarSelectedDate && this.communityEvents.length) {
      this.calendarSelectedDate = this.communityEvents[0].date;
    }
  }

  get eventCalendarList() {
    return [...this.communityEvents].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return da - db;
    });
  }

  get calendarDays() {
    const start = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth(), 1);
    const end = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1, 0);
    const days = [];
    const currentMonth = this.calendarMonth.getMonth();
    const currentYear = this.calendarMonth.getFullYear();
    
    for (let d = 1; d <= end.getDate(); d++) {
      const dayDate = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth(), d);
      const iso = this.toIso(dayDate);

      // Sadece o ay'a ait etkinlikleri kontrol et
      const hasEvent = this.communityEvents.some((ev) => {
        let eventDateISO: string | null = null;
        
        if (ev.startDateISO) {
          eventDateISO = ev.startDateISO;
        } else if (ev.date) {
          // ev.date Türkçe formatında, parse et
          try {
            // "15 Oca 2025" formatını parse et
            const dateParts = ev.date.split(' ');
            if (dateParts.length === 3) {
              const day = parseInt(dateParts[0], 10);
              const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
              const month = monthNames.indexOf(dateParts[1]);
              const year = parseInt(dateParts[2], 10);
              if (month !== -1) {
                const eventDate = new Date(year, month, day);
                eventDateISO = this.toIso(eventDate);
              }
            }
          } catch (e) {
            Logger.warn('Error parsing event date:', ev.date, e);
            return false;
          }
        }
        
        if (!eventDateISO) {
          return false;
        }
        
        // Sadece takvimde gösterilen ay'a ait etkinlikleri kontrol et
        const [year, month, day] = eventDateISO.split('-').map(Number);
        if (year === currentYear && month - 1 === currentMonth) {
          const eventIso = this.toIso(new Date(year, month - 1, day));
          return eventIso === iso;
        }
        
        return false;
      });

      const isToday = iso === this.toIso(new Date());
      days.push({ label: d, iso, hasEvent, isToday });
    }
    return days;
  }

  changeCalendarMonth(offset: number) {
    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() + offset,
      1
    );
    // Ay değiştiğinde seçili tarihi sıfırla
    this.calendarSelectedDate = null;
  }

  selectCalendarDate(iso: string) {
    this.calendarSelectedDate = iso;
  }

  // Günlere göre gruplanmış etkinlikler (UTC+3 - Türkiye saati)
  // Sadece takvimde gösterilen ay'a ait etkinlikleri döndürür
  get eventsGroupedByDate() {
    const grouped: { [key: string]: EventCard[] } = {};
    const currentMonth = this.calendarMonth.getMonth();
    const currentYear = this.calendarMonth.getFullYear();
    
    this.communityEvents.forEach((ev) => {
      let eventDateISO: string | null = null;
      
      if (ev.startDateISO) {
        eventDateISO = ev.startDateISO;
      } else if (ev.date) {
        // ev.date Türkçe formatında, parse et
        try {
          const dateParts = ev.date.split(' ');
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0], 10);
            const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
            const month = monthNames.indexOf(dateParts[1]);
            const year = parseInt(dateParts[2], 10);
            if (month !== -1) {
              const eventDate = new Date(year, month, day);
              eventDateISO = this.toIso(eventDate);
            }
          }
        } catch (e) {
          Logger.warn('Error parsing event date:', ev.date, e);
          return; // Bu etkinliği atla
        }
      } else {
        return; // Tarih bilgisi yok, bu etkinliği atla
      }
      
      // eventDateISO null ise veya atanmamışsa bu etkinliği atla
      if (!eventDateISO) {
        return;
      }
      
      // Sadece takvimde gösterilen ay'a ait etkinlikleri dahil et
      const [year, month, day] = eventDateISO.split('-').map(Number);
      if (year === currentYear && month - 1 === currentMonth) {
        if (!grouped[eventDateISO]) {
          grouped[eventDateISO] = [];
        }
        grouped[eventDateISO].push(ev);
      }
    });
    
    // Tarihe göre sırala (yakın tarihler önce)
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return a.localeCompare(b);
    });
    
    return sortedDates.map(dateISO => ({
      dateISO,
      date: this.formatDateForDisplay(dateISO),
      events: grouped[dateISO].sort((a, b) => {
        // Aynı gündeki etkinlikleri saate göre sırala
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      })
    }));
  }

  // Tarihi görüntüleme formatına çevir (UTC+3 - Türkiye saati)
  formatDateForDisplay(dateISO: string): string {
    const [year, month, day] = dateISO.split('-').map(Number);
    // UTC+3 için tarih oluştur (Türkiye saati)
    const date = new Date(year, month - 1, day);
    
    // Türkçe tarih formatı: "15 Ocak 2025, Pazartesi"
    const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    
    return `${day} ${monthName} ${year}, ${dayName}`;
  }

  get eventsOnSelectedDate() {
    if (!this.calendarSelectedDate) return [];
    
    // Seçili tarihin o ay'a ait olduğunu kontrol et
    const [selectedYear, selectedMonth, selectedDay] = this.calendarSelectedDate.split('-').map(Number);
    const currentMonth = this.calendarMonth.getMonth();
    const currentYear = this.calendarMonth.getFullYear();
    
    if (selectedYear !== currentYear || selectedMonth - 1 !== currentMonth) {
      return []; // Seçili tarih o ay'a ait değilse boş döndür
    }
    
    return this.communityEvents.filter((ev) => {
      let eventDateISO: string | null = null;
      
      if (ev.startDateISO) {
        eventDateISO = ev.startDateISO;
      } else if (ev.date) {
        // ev.date Türkçe formatında, parse et
        try {
          // "15 Oca 2025" formatını parse et
          const dateParts = ev.date.split(' ');
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0], 10);
            const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
            const month = monthNames.indexOf(dateParts[1]);
            const year = parseInt(dateParts[2], 10);
            if (month !== -1) {
              const eventDate = new Date(year, month, day);
              eventDateISO = this.toIso(eventDate);
            }
          }
        } catch (e) {
          Logger.warn('Error parsing event date:', ev.date, e);
          return false;
        }
      }
      
      if (!eventDateISO) {
        return false;
      }
      
      // Sadece o ay'a ait etkinlikleri kontrol et
      const [year, month, day] = eventDateISO.split('-').map(Number);
      if (year === currentYear && month - 1 === currentMonth) {
        return eventDateISO === this.calendarSelectedDate;
      }
      
      return false;
    });
  }

  private toIso(date: Date) {
    // Local timezone'da ISO formatı (YYYY-MM-DD) - UTC'ye çevirmeden
    // Bu sayede timezone kaynaklı bir günlük kayma olmaz
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  viewEvent(eventId: number): void {
    // Navigate to event detail page
    this.router.navigate(['/events']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Takvim için etkinlik gününü al (Türkçe formatından)
  getEventDay(ev: EventCard): string {
    if (ev.startDateISO) {
      // ISO formatından günü al
      const date = new Date(ev.startDateISO + 'T00:00:00');
      return String(date.getDate()).padStart(2, '0');
    } else if (ev.date) {
      // Türkçe formatından parse et: "15 Oca 2025"
      try {
        const parts = ev.date.split(' ');
        if (parts.length >= 1) {
          return parts[0].padStart(2, '0');
        }
      } catch (e) {
        Logger.warn('Error parsing day from date:', ev.date);
      }
    }
    return '01';
  }

  // Takvim için etkinlik ayını al (Türkçe formatından)
  getEventMonth(ev: EventCard): string {
    if (ev.startDateISO) {
      // ISO formatından ayı al ve Türkçe'ye çevir
      const date = new Date(ev.startDateISO + 'T00:00:00');
      const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      return monthNames[date.getMonth()];
    } else if (ev.date) {
      // Türkçe formatından parse et: "15 Oca 2025"
      try {
        const parts = ev.date.split(' ');
        if (parts.length >= 2) {
          const monthShort = parts[1];
          // Kısa ay isimlerini uzun ay isimlerine çevir
          const monthMap: { [key: string]: string } = {
            'Oca': 'Ocak',
            'Şub': 'Şubat',
            'Mar': 'Mart',
            'Nis': 'Nisan',
            'May': 'Mayıs',
            'Haz': 'Haziran',
            'Tem': 'Temmuz',
            'Ağu': 'Ağustos',
            'Eyl': 'Eylül',
            'Eki': 'Ekim',
            'Kas': 'Kasım',
            'Ara': 'Aralık'
          };
          return monthMap[monthShort] || monthShort;
        }
      } catch (e) {
        Logger.warn('Error parsing month from date:', ev.date);
      }
    }
    return 'Ocak';
  }

  saveSettings(): void {
    // Validate name
    if (!this.userInfo.name || !this.userInfo.name.trim()) {
      this.toastService.show('Ad Soyad alanı boş bırakılamaz', 'error');
      return;
    }

    // Backend'e istek gönder
    this.authService.updateProfile(this.userInfo.name.trim()).subscribe({
      next: (response) => {
        // Backend'den gelen güncellenmiş ad soyadı kullan (eğer varsa)
        const updatedName = response.fullName || response.FullName || this.userInfo.name.trim();

        // Backend'den başarılı yanıt geldi, localStorage'ı güncelle
        if (isPlatformBrowser(this.platformId)) {
          const userInfoToSave = {
            name: updatedName,
            email: this.userInfo.email,
            id: this.userInfo.id,
            role: this.userInfo.role,
          };
          localStorage.setItem('user_info', JSON.stringify(userInfoToSave));

          // Component'teki userInfo'yu da güncelle
          this.userInfo.name = updatedName;

          // AuthService'deki user bilgisini de güncelle (AuthService zaten tap içinde yapıyor ama yine de)
          this.authService.saveUser(userInfoToSave);

          // Display name'i de güncelle
          this.displayName = updatedName;
          this.userInitial = updatedName.charAt(0).toUpperCase();
        }
        this.toastService.show('Ad Soyad başarıyla güncellendi', 'success');
      },
      error: (err: any) => {
        Logger.error('Profil güncelleme hatası:', err);
        const errorMessage = err.error?.message || err.message || 'Profil güncellenirken bir hata oluştu.';
        this.toastService.show(errorMessage, 'error');
      },
    });
  }

  /** Şifre güç kurallarını kontrol et (Öğrenci Kaydı ile aynı) */
  private validatePasswordStrength(pwd: string): void {
    this.passwordMinLength = pwd.length >= 8;
    this.passwordHasUppercase = /[A-Z]/.test(pwd);
    this.passwordHasLowercase = /[a-z]/.test(pwd);
    this.passwordHasNumber = /[0-9]/.test(pwd);
    this.passwordHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?.]/.test(pwd);
  }

  get isPasswordStrong(): boolean {
    return (
      this.passwordMinLength &&
      this.passwordHasUppercase &&
      this.passwordHasLowercase &&
      this.passwordHasNumber &&
      this.passwordHasSpecial
    );
  }

  get passwordMismatch(): boolean {
    return !!(
      this.userInfo.confirmPassword &&
      this.userInfo.newPassword !== this.userInfo.confirmPassword
    );
  }

  onNewPasswordInput(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.userInfo.newPassword = value;
    this.hasPasswordInput = value.length > 0;
    this.validatePasswordStrength(value);
  }

  changePassword(): void {
    if (
      !this.userInfo.currentPassword ||
      !this.userInfo.newPassword ||
      !this.userInfo.confirmPassword
    ) {
      this.toastService.show('Lütfen tüm alanları doldurunuz', 'error');
      return;
    }

    if (this.userInfo.newPassword !== this.userInfo.confirmPassword) {
      this.toastService.show('Yeni şifreler eşleşmiyor', 'error');
      return;
    }

    if (!this.isPasswordStrong) {
      this.toastService.show(
        'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter (! . , ? @ # vb.) içermelidir.',
        'error'
      );
      return;
    }

    // Backend'e şifre değiştirme isteği gönder (AuthService üzerinden)
    this.authService
      .changePassword(
        this.userInfo.email,
        this.userInfo.currentPassword,
        this.userInfo.newPassword,
        this.userInfo.confirmPassword
      )
      .subscribe({
        next: (response) => {
          this.toastService.show(
            response.message || 'Şifreniz başarıyla değiştirildi',
            'success'
          );

          // Clear password fields
          this.userInfo.currentPassword = '';
          this.userInfo.newPassword = '';
          this.userInfo.confirmPassword = '';
        },
        error: (err: any) => {
          Logger.error('Şifre değiştirme hatası:', err);
          const errorMessage =
            err.error?.message || err.message || 'Şifre değiştirme işlemi başarısız oldu.';
          this.toastService.show(errorMessage, 'error');
        },
      });
  }

  toggleProfileDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.isProfileOpen = !this.isProfileOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Profil dropdown kontrolü
    if (!target.closest('.profile-wrapper') && !target.closest('.profile-dropdown') && !target.closest('.profile-info')) {
      this.isProfileOpen = false;
    }

    // Bildirimler kontrolü
    if (!target.closest('.notification') && !target.closest('.notification-btn')) {
      this.showNotifications = false;
    }
  }

  // Unified Profile Dropdown Methods
  navigateToDashboard() {
    this.isProfileOpen = false;
    this.activeTab = 'overview';
    this.switchTab('overview');
  }

  handleSettingsClick() {
    this.isProfileOpen = false;
    this.activeTab = 'settings';
    this.switchTab('settings');
  }

  handleLogoutClick() {
    this.isProfileOpen = false;
    this.logout();
  }

  // Image error handler - Placeholder görsellerin sürekli istek atmasını engeller
  onImageError(event: Event, type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar' = 'cover'): void {
    this.imageErrorHandler.handleImageError(event, type);
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      this.toastService.show('Çıkış yapılıyor...', 'success');
      // Local storage'ı temizle
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_type');

      // Anasayfaya yönlendir
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    }
  }

  navigateToHome() {
    this.router.navigate(['/']);
  }

  getRoleDisplayName(): string {
    return 'Öğrenci Hesabı';
  }

  getDashboardLabel(): string {
    return 'Panelim';
  }

  getDashboardIcon(): string {
    return 'school';
  }

  // Carousel navigation methods
  scrollEvents(direction: 'left' | 'right'): void {
    setTimeout(() => {
      const container = document.querySelector('.events-carousel-container') as HTMLElement;
      if (!container) return;

      const scrollAmount = 367; // Scroll amount in pixels (card width + gap)
      const currentScroll = container.scrollLeft;
      const newPosition =
        direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;

      container.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });
    }, 0);
  }

  scrollCommunities(direction: 'left' | 'right'): void {
    setTimeout(() => {
      const container = document.querySelector('.communities-carousel-container') as HTMLElement;
      if (!container) return;

      const scrollAmount = 425; // Scroll amount in pixels (card width + gap)
      const currentScroll = container.scrollLeft;
      const newPosition =
        direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;

      container.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });
    }, 0);
  }

  onEventsScroll(event: any): void {
    const target = event.target as HTMLElement;
    this.eventsScrollPosition = target.scrollLeft;
    // Force change detection to update button states
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        // Trigger change detection
      }, 0);
    }
  }

  onCommunitiesScroll(event: any): void {
    const target = event.target as HTMLElement;
    this.communitiesScrollPosition = target.scrollLeft;
    // Force change detection to update button states
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        // Trigger change detection
      }, 0);
    }
  }

  canScrollEventsLeft(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const container = document.querySelector('.events-carousel-container') as HTMLElement;
    if (!container) return false;
    return container.scrollLeft > 10;
  }

  canScrollEventsRight(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const container = document.querySelector('.events-carousel-container') as HTMLElement;
    if (!container) return false;
    return container.scrollLeft < container.scrollWidth - container.clientWidth - 10;
  }

  canScrollCommunitiesLeft(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const container = document.querySelector('.communities-carousel-container') as HTMLElement;
    if (!container) return false;
    return container.scrollLeft > 10;
  }

  canScrollCommunitiesRight(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const container = document.querySelector('.communities-carousel-container') as HTMLElement;
    if (!container) return false;
    return container.scrollLeft < container.scrollWidth - container.clientWidth - 10;
  }

  getDefaultAvatar(): string {
    const name = this.userInfo.name || 'Öğrenci';
    const initials = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      initials
    )}&background=14d2cc&color=fff&size=128&font-size=0.4`;
  }

  ngOnDestroy(): void {
    // AFK Detection'ı durdur
    this.afkDetectionService.stop();
  }
}
