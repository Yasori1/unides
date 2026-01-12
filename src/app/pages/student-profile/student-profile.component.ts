import { Component, OnInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';
import { EventService, EventItem } from '../../services/event.services';
import { CommunityService, Community } from '../../services/community.services';

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
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.scss'],
})
export class StudentProfileComponent implements OnInit {
  activeTab: 'overview' | 'communities' | 'events' | 'settings' = 'overview';
  isSidebarCollapsed: boolean = false;
  selectedCommunityForLeave: ProfileCommunity | null = null;
  selectedEvent: EventCard | null = null;
  showEventDates: boolean = false;
  calendarMonth: Date = new Date();
  calendarSelectedDate: string | null = null;
  showNotifications: boolean = false;
  isProfileOpen: boolean = false;
  notifications: Array<{ 
    id: number;
    text: string; 
    time: string;
    read: boolean;
    type?: 'event' | 'community' | 'general';
    link?: string;
    tab?: string;
  }> = [
    { id: 1, text: 'Yeni etkinlik duyurusu', time: '10 dk önce', read: false, type: 'event', tab: 'events' },
    { id: 2, text: 'Topluluk güncellemesi', time: '1 saat önce', read: false, type: 'community', tab: 'communities' },
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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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
            role: savedUserInfo.role || this.userInfo.role
          };
        } catch (e) {
          console.error('Error parsing user info:', e);
        }
      }

      this.loadData();
    }
  }

  loadData(): void {
    // 1. Fetch all communities (Simulating joined communities)
    this.communityService.getAllCommunities().subscribe(allCommunities => {
      // Simulate "Joined" communities by picking random ones or specific IDs if we had auth
      // For now, let's pick the first 3 if available, or fallback to mock
      if (allCommunities && allCommunities.length > 0) {
        this.myCommunities = allCommunities.slice(0, 3).map(c => ({
          ...c,
          joinedDate: '2024-01-15' // Mock date
        }));
      } else {
        // Fallback Mock Data if service returns empty
        this.loadMockCommunities();
      }
      
      this.stats[0].value = this.myCommunities.length;

      // 2. Fetch all events and filter by joined communities
      this.eventService.getAll().subscribe(allEvents => {
        if (allEvents && allEvents.length > 0) {
          // Filter events where communityId matches one of myCommunities
          const myCommunityIds = this.myCommunities.map(c => c.id);
          
          // Note: In a real app, backend would filter this.
          // Since we are mocking "joined" status, we filter the mock/fetched events.
          // If event.communityId matches, or if we want to show some events anyway:
          
          const filteredEvents = allEvents.filter(e => 
            myCommunityIds.includes(String(e.communityId)) || 
            // Fallback: if mock data IDs don't match exactly (number vs string issues),
            // we might want to just show some events for demo purposes.
            // Let's assume for this task we show events that "belong" to the mocked joined communities.
            // If the event service returns events with IDs that don't match our "joined" community IDs (which might be from a different mock source),
            // we might end up with 0 events.
            // For robust demo: let's try to match by name if ID fails, or just take a subset.
            this.myCommunities.some(c => c.name === e.communityName)
          );

          // Map to EventCard format
          this.communityEvents = filteredEvents.map(e => this.mapToEventCard(e));
          
          // If no events found (e.g. fresh mock data mismatch), let's fallback to some mock events for visual confirmation
          if (this.communityEvents.length === 0) {
             this.loadMockEvents();
          }
        } else {
          this.loadMockEvents();
        }
        
        this.stats[1].value = this.communityEvents.length;
      });
    });
  }

  private mapToEventCard(e: EventItem): EventCard {
    const start = e.startDate ? new Date(e.startDate) : new Date();
    return {
      id: e.id,
      title: e.title,
      date: start.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      location: e.location || 'Konum Belirtilmemiş',
      community: e.communityName || 'Topluluk',
      status: 'upcoming', // Default to upcoming for now
      imageUrl: e.imageUrl,
      category: 'Etkinlik',
      university: '', // Service might not provide this directly in EventItem
      description: e.shortDescription || e.description,
      communityId: e.communityId
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
        banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800'
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
        banner: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800'
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
    this.myCommunities = this.myCommunities.filter((c) => c.id !== communityId);
    this.toastService.show('Topluluktan ayrıldınız', 'success');
    this.stats[0].value = this.myCommunities.length;
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
      const iso = this.toIso(
        new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth(), d)
      );
      const hasEvent = this.communityEvents.some((ev) => ev.date === iso);
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
    return this.communityEvents.filter((ev) => ev.date === this.calendarSelectedDate);
  }

  private toIso(date: Date) {
    return date.toISOString().split('T')[0];
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

  saveSettings(): void {
    // Save user info to localStorage (without password fields)
    if (isPlatformBrowser(this.platformId)) {
      const userInfoToSave = {
        name: this.userInfo.name,
        email: this.userInfo.email,
      };
      localStorage.setItem('user_info', JSON.stringify(userInfoToSave));
      this.toastService.show('Ayarlar başarıyla kaydedildi', 'success');
    }
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: this.userInfo.email,
          oldPassword: this.userInfo.currentPassword,
          newPassword: this.userInfo.newPassword,
          confirmNewPassword: this.userInfo.confirmPassword
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
      const newPosition = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }, 0);
  }

  scrollCommunities(direction: 'left' | 'right'): void {
    setTimeout(() => {
      const container = document.querySelector('.communities-carousel-container') as HTMLElement;
      if (!container) return;
      
      const scrollAmount = 425; // Scroll amount in pixels (card width + gap)
      const currentScroll = container.scrollLeft;
      const newPosition = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
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
    return container.scrollLeft < (container.scrollWidth - container.clientWidth - 10);
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
    return container.scrollLeft < (container.scrollWidth - container.clientWidth - 10);
  }

  getDefaultAvatar(): string {
    const name = this.userInfo.name || 'Öğrenci';
    const initials = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=14d2cc&color=fff&size=128&font-size=0.4`;
  }
}
