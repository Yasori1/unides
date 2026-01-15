import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { EventService, EventItem } from '../../services/event.services';
import { CommunityService, Community } from '../../services/community.services';
import { AfkDetectionService } from '../../services/afk-detection.service';
import { AuthService } from '../../services/auth.services';
import { LumaSpinComponent } from '../../components/ui/luma-spin/luma-spin.component';

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
  imports: [CommonModule, FormsModule, ToastComponent, LumaSpinComponent],
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

  constructor(
    public router: Router,
    public toastService: ToastService,
    private eventService: EventService,
    private communityService: CommunityService,
    private afkDetectionService: AfkDetectionService,
    private authService: AuthService,
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
          console.error('Error parsing user info:', e);
        }
      }

      this.loadData();
    }
  }

  loadData(): void {
    // Loading state'leri başlat
    this.isLoadingOverview = true;
    this.isLoadingCommunities = true;
    this.isLoadingEvents = true;
    
    // Backend'den öğrencinin üye olduğu toplulukları ve etkinliklerini çek
    // GET /api/Communities/me/memberships endpoint'i hem toplulukları hem de etkinlikleri döndürüyor
    this.communityService.getMyMemberships().subscribe({
      next: (memberships) => {
        if (memberships && memberships.length > 0) {
          // Map to ProfileCommunity format
          this.myCommunities = memberships.map((c: any) => ({
            ...c,
            joinedDate: c.joinedDate || new Date().toISOString().split('T')[0],
          }));

          // Tüm toplulukların etkinliklerini birleştir
          const allEvents: any[] = [];
          memberships.forEach((community: any) => {
            if (community.events && Array.isArray(community.events)) {
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

                    // Date objesi oluştur (local timezone)
                    startDate = new Date(year, month, day, hour, minute, 0);

                    // Geçerlilik kontrolü
                    if (isNaN(startDate.getTime())) {
                      console.warn('Invalid date after parsing:', { eventDate, eventClock, day, month, year, hour, minute });
                      startDate = new Date();
                    }
                  } catch (error) {
                    console.error('Error parsing date:', error, { eventDate, eventClock });
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
        } else {
          // No memberships found - show empty state
          this.myCommunities = [];
          this.communityEvents = [];
        }

        // Stats'ları güncelle
        this.stats[0].value = this.myCommunities.length;
        this.stats[1].value = this.communityEvents.length;
        
        // Loading state'leri bitir
        this.isLoadingOverview = false;
        this.isLoadingCommunities = false;
        this.isLoadingEvents = false;
      },
      error: (err) => {
        console.error('Memberships yüklenemedi:', err);
        // Handle 401/403 gracefully - show empty state instead of mock data
        if (err.status === 401 || err.status === 403) {
          this.toastService.show(
            'Topluluklara erişim için giriş yapmanız gerekiyor.',
            'error'
          );
          this.myCommunities = [];
          this.communityEvents = [];
        } else {
          // Other errors - show empty state
          this.myCommunities = [];
          this.communityEvents = [];
        }
        this.stats[0].value = this.myCommunities.length;
        this.stats[1].value = this.communityEvents.length;
        
        // Loading state'leri bitir
        this.isLoadingOverview = false;
        this.isLoadingCommunities = false;
        this.isLoadingEvents = false;
      },
    });
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

  loadMockCommunities(): void {
    this.myCommunities = [
      {
        id: '1',
        name: 'Yazılım Geliştirme Kulübü',
        logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100',
        coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
        university: 'İTÜ',
        city: 'Ankara',
        memberCount: 150,
        category: 'Teknoloji',
        description: 'Kodlama kampları, hackathonlar ve proje geliştirme odaklı bir topluluk.',
        instagram: 'https://instagram.com/ituai',
        joinedDate: '2024-01-15',
        status: 'Aktif',
        banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
      },
      {
        id: '2',
        name: 'Girişimcilik Topluluğu',
        logo: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=100',
        coverImage: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800',
        university: 'Hacettepe',
        city: 'Ankara',
        memberCount: 89,
        category: 'İş Dünyası',
        description: 'Start-up kültürü, yatırımcı buluşmaları ve pitch yarışmaları düzenler.',
        instagram: 'https://instagram.com/hacettepegirisim',
        joinedDate: '2024-02-20',
        status: 'Aktif',
        banner: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800',
      },
    ];
  }

  loadMockEvents(): void {
    // Tarihler bugüne göre ayarlanıyor ki takvimde hemen görülsün
    const isoInDays = (offset: number) => {
      const d = new Date();
      d.setHours(12, 0, 0, 0); // timezone kaymasını önlemek için
      d.setDate(d.getDate() + offset);
      return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // ISO format for calendar matching
    const isoDate = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return d.toISOString().split('T')[0];
    };

    this.communityEvents = [
      {
        id: 1,
        title: 'Yapay Zeka Workshop',
        date: isoInDays(2),
        time: '14:00',
        location: 'Kampüs Merkez',
        community: 'Yazılım Geliştirme Kulübü',
        status: 'upcoming',
        imageUrl:
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=60',
        category: 'Teknoloji',
        university: 'İTÜ',
        description: 'Uygulamalı AI oturumları ve canlı demo.',
        color: '#2563eb',
        club: 'Yazılım Geliştirme Kulübü',
        semester: 'Yazılım Geliştirme Kulübü',
        quota: '120',
      },
      {
        id: 2,
        title: 'Web Geliştirme Bootcamp',
        date: isoInDays(5),
        time: '09:00',
        location: 'Bilgisayar Laboratuvarı',
        community: 'Yazılım Geliştirme Kulübü',
        status: 'upcoming',
        imageUrl:
          'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=60',
        category: 'Eğitim',
        university: 'İTÜ',
        description: 'Frontend ve backend hızlandırma kampı.',
        color: '#0ea5e9',
        club: 'Yazılım Geliştirme Kulübü',
        semester: 'Yazılım Geliştirme Kulübü',
        quota: '80',
      },
      {
        id: 3,
        title: 'Girişimcilik Zirvesi',
        date: isoInDays(12),
        time: '10:00',
        location: 'Konferans Salonu',
        community: 'Girişimcilik Topluluğu',
        status: 'upcoming',
        imageUrl:
          'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=60',
        category: 'İş Dünyası',
        university: 'Hacettepe',
        description: 'Startup panelleri ve yatırımcı sohbetleri.',
        color: '#f59e0b',
        club: 'Girişimcilik Topluluğu',
        semester: 'Girişimcilik Topluluğu',
        quota: '250',
      },
    ];
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

  @HostListener('document:click', ['$event'])
  closeDropdowns(event: any): void {
    if (!event.target.closest('.profile-wrapper') && !event.target.closest('.notification')) {
      this.isProfileOpen = false;
      this.showNotifications = false;
    }
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

  handleSettingsClick() {
    this.isProfileOpen = false;
    this.switchTab('settings');
  }

  handleLogoutClick() {
    this.isProfileOpen = false;
    this.logout();
  }

  navigateToHome() {
    this.switchTab('overview');
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_type');
      this.toastService.show('Çıkış yapıldı', 'success');
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    }
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
        this.stats[0].value = this.myCommunities.length;

        // Etkinlikleri de güncelle (ayrılan topluluğun etkinliklerini kaldır)
        const communityIdNum = typeof communityId === 'string' ? parseInt(communityId, 10) : communityId;
        this.communityEvents = this.communityEvents.filter((e) => {
          const eCommunityId = typeof e.communityId === 'string' ? parseInt(e.communityId, 10) : e.communityId;
          return eCommunityId !== communityIdNum;
        });
        this.stats[1].value = this.communityEvents.length;
      },
      error: (err) => {
        console.error('Topluluktan ayrılma hatası:', err);
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
    for (let d = 1; d <= end.getDate(); d++) {
      const dayDate = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth(), d);
      const iso = this.toIso(dayDate);

      // Etkinliklerin tarihlerini ISO formatına çevirerek karşılaştır
      const hasEvent = this.communityEvents.some((ev) => {
        if (ev.startDateISO) {
          // startDateISO varsa direkt kullan
          const eventIso = this.toIso(new Date(ev.startDateISO));
          return eventIso === iso;
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
                const eventIso = this.toIso(eventDate);
                return eventIso === iso;
              }
            }
          } catch (e) {
            console.warn('Error parsing event date:', ev.date, e);
          }
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
  }

  selectCalendarDate(iso: string) {
    this.calendarSelectedDate = iso;
  }

  get eventsOnSelectedDate() {
    if (!this.calendarSelectedDate) return [];
    return this.communityEvents.filter((ev) => {
      if (ev.startDateISO) {
        // startDateISO varsa direkt kullan
        const eventIso = this.toIso(new Date(ev.startDateISO));
        return eventIso === this.calendarSelectedDate;
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
              const eventIso = this.toIso(eventDate);
              return eventIso === this.calendarSelectedDate;
            }
          }
        } catch (e) {
          console.warn('Error parsing event date:', ev.date, e);
        }
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
        console.warn('Error parsing day from date:', ev.date);
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
        console.warn('Error parsing month from date:', ev.date);
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
        // Backend'den başarılı yanıt geldi, localStorage'ı güncelle
        if (isPlatformBrowser(this.platformId)) {
          const userInfoToSave = {
            name: this.userInfo.name.trim(),
            email: this.userInfo.email,
            id: this.userInfo.id,
            role: this.userInfo.role,
          };
          localStorage.setItem('user_info', JSON.stringify(userInfoToSave));

          // AuthService'deki user bilgisini de güncelle
          this.authService.saveUser(userInfoToSave);
        }
        this.toastService.show(response.message || 'Ad Soyad başarıyla güncellendi', 'success');
      },
      error: (err) => {
        console.error('Profil güncelleme hatası:', err);
        const errorMessage = err.error?.message || err.message || 'Profil güncellenirken bir hata oluştu.';
        this.toastService.show(errorMessage, 'error');
      },
    });
  }

  async changePassword(): Promise<void> {
    // Validate password change
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

    if (this.userInfo.newPassword.length < 6) {
      this.toastService.show('Şifre en az 6 karakter olmalıdır', 'error');
      return;
    }

    // Backend'e şifre değiştirme isteği gönder
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        this.toastService.show('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.', 'error');
        return;
      }

      const response = await fetch('/api/Auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: this.userInfo.email,
          oldPassword: this.userInfo.currentPassword,
          newPassword: this.userInfo.newPassword,
          confirmNewPassword: this.userInfo.confirmPassword,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.toastService.show('Sunucuya bağlanılamadı. Lütfen tekrar deneyiniz.', 'error');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        this.toastService.show('Şifreniz başarıyla değiştirildi', 'success');

        // Clear password fields
        this.userInfo.currentPassword = '';
        this.userInfo.newPassword = '';
        this.userInfo.confirmPassword = '';
      } else {
        const errorMessage = data?.message || 'Şifre değiştirme işlemi başarısız oldu.';
        this.toastService.show(errorMessage, 'error');
      }
    } catch (error: any) {
      console.error('Şifre değiştirme hatası:', error);
      this.toastService.show('Bir hata oluştu. Lütfen tekrar deneyiniz.', 'error');
    }
  }

  toggleProfileDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isProfileOpen = !this.isProfileOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Profil dropdown kontrolü
    if (!target.closest('.profile-wrapper') && !target.closest('.profile-dropdown')) {
      this.isProfileOpen = false;
    }
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
