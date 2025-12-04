import { Component, OnInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.services';
import { ToastComponent } from '../../components/ui/toast/toast.component';

interface Stat {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

interface Community {
  id: number;
  name: string;
  logo: string;
  city: string;
  memberCount: number;
  category: string;
  joinedDate: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  community: string;
  status: 'upcoming' | 'completed' | 'cancelled';
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
  
  // User Info
  userInfo: any = {
    name: 'Öğrenci Adı',
    email: 'ogrenci@university.edu.tr',
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
  myCommunities: Community[] = [];

  // Events from communities
  communityEvents: Event[] = [];

  constructor(
    public router: Router,
    public toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Load user info from localStorage
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        try {
          this.userInfo = JSON.parse(userInfoStr);
        } catch (e) {
          console.error('Error parsing user info:', e);
        }
      }

      // Load mock data
      this.loadMockData();
    }
  }

  loadMockData(): void {
    // Mock Communities
    this.myCommunities = [
      {
        id: 1,
        name: 'Yazılım Geliştirme Kulübü',
        logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100',
        city: 'Ankara',
        memberCount: 150,
        category: 'Teknoloji',
        joinedDate: '2024-01-15',
      },
      {
        id: 2,
        name: 'Girişimcilik Topluluğu',
        logo: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=100',
        city: 'Ankara',
        memberCount: 89,
        category: 'İş Dünyası',
        joinedDate: '2024-02-20',
      },
    ];

    // Mock Events from communities (toplulukların etkinlikleri)
    this.communityEvents = [
      {
        id: 1,
        title: 'Yapay Zeka Workshop',
        date: '2024-12-20',
        time: '14:00',
        location: 'Kampüs Merkez',
        community: 'Yazılım Geliştirme Kulübü',
        status: 'upcoming',
      },
      {
        id: 2,
        title: 'Web Geliştirme Bootcamp',
        date: '2024-12-25',
        time: '09:00',
        location: 'Bilgisayar Laboratuvarı',
        community: 'Yazılım Geliştirme Kulübü',
        status: 'upcoming',
      },
      {
        id: 3,
        title: 'Girişimcilik Zirvesi',
        date: '2024-11-15',
        time: '10:00',
        location: 'Konferans Salonu',
        community: 'Girişimcilik Topluluğu',
        status: 'completed',
      },
      {
        id: 4,
        title: 'Startup Pitch Yarışması',
        date: '2025-01-10',
        time: '15:00',
        location: 'İnovasyon Merkezi',
        community: 'Girişimcilik Topluluğu',
        status: 'upcoming',
      },
    ];


    // Update stats
    this.stats[0].value = this.myCommunities.length;
    this.stats[1].value = this.communityEvents.length;
  }

  switchTab(tab: 'overview' | 'communities' | 'events' | 'settings'): void {
    this.activeTab = tab;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
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

  leaveCommunity(communityId: number): void {
    this.myCommunities = this.myCommunities.filter((c) => c.id !== communityId);
    this.toastService.show('Topluluktan ayrıldınız', 'success');
    this.stats[0].value = this.myCommunities.length;
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

  changePassword(): void {
    // Validate password change
    if (!this.userInfo.currentPassword || !this.userInfo.newPassword || !this.userInfo.confirmPassword) {
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

    // Here you would typically call an API to change the password
    // For now, we'll just show a success message
    this.toastService.show('Şifre başarıyla değiştirildi', 'success');
    
    // Clear password fields
    this.userInfo.currentPassword = '';
    this.userInfo.newPassword = '';
    this.userInfo.confirmPassword = '';
  }
}

