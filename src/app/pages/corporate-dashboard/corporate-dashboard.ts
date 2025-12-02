import { Component, OnInit, HostListener, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router'; // Router import edildi

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
  category: string;
  memberCount: number;
  status: 'Aktif' | 'Onay Bekliyor' | 'Pasif';
  logo: string;
  president: string;
}
interface Announcement {
  id: number;
  title: string;
  target: string;
  date: string;
  status: 'Yayında' | 'Taslak';
  views: number;
}
interface EventRequest {
  id: number;
  communityName: string;
  eventName: string;
  date: string;
  location: string;
  budget: number;
  status: 'Onaylandı' | 'Beklemede' | 'Reddedildi';
}

@Component({
  selector: 'app-corporate-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent],
  // Template ve Style dosyaları dışarıdan alınıyor
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

  corporateInfo = {
    name: 'ÜNİDES Yönetim',
    logo: 'https://ui-avatars.com/api/?name=UNIDES&background=14d2cc&color=fff&size=128',
  };

  stats: Stat[] = [
    { label: 'Toplam Topluluk', value: 42, icon: 'groups', colorClass: 'blue' },
    { label: 'Aktif Etkinlik', value: 12, icon: 'event', colorClass: 'green' },
    { label: 'Bekleyen İstek', value: 5, icon: 'pending_actions', colorClass: 'orange' },
    {
      label: 'Toplam Bütçe',
      value: '850.000₺',
      icon: 'account_balance_wallet',
      colorClass: 'purple',
    },
  ];

  communities: Community[] = [
    {
      id: 1,
      name: 'AI & Data Club',
      category: 'Teknoloji',
      memberCount: 156,
      status: 'Aktif',
      president: 'Ahmet Yılmaz',
      logo: 'https://ui-avatars.com/api/?name=AI&background=0f172a&color=fff',
    },
    {
      id: 2,
      name: 'Dans Topluluğu',
      category: 'Sanat',
      memberCount: 89,
      status: 'Aktif',
      president: 'Zeynep Kaya',
      logo: 'https://ui-avatars.com/api/?name=DT&background=f43f5e&color=fff',
    },
    {
      id: 3,
      name: 'Girişimcilik Kulübü',
      category: 'Kariyer',
      memberCount: 210,
      status: 'Aktif',
      president: 'Can Demir',
      logo: 'https://ui-avatars.com/api/?name=GK&background=3b82f6&color=fff',
    },
    {
      id: 4,
      name: 'E-Spor Topluluğu',
      category: 'Spor',
      memberCount: 340,
      status: 'Onay Bekliyor',
      president: 'Mehmet Öz',
      logo: 'https://ui-avatars.com/api/?name=ES&background=eab308&color=fff',
    },
  ];

  announcements: Announcement[] = [
    {
      id: 1,
      title: 'Bahar Şenliği Başvuruları Başladı',
      target: 'Tüm Topluluklar',
      date: '25 Ekim 2023',
      status: 'Yayında',
      views: 450,
    },
    {
      id: 2,
      title: 'Bütçe Raporu Teslim Tarihi',
      target: 'Topluluk Başkanları',
      date: '28 Ekim 2023',
      status: 'Yayında',
      views: 120,
    },
    {
      id: 3,
      title: 'Yeni Sponsorluk Yönetmeliği',
      target: 'Tüm Topluluklar',
      date: '01 Kasım 2023',
      status: 'Taslak',
      views: 0,
    },
  ];

  newAnnouncement = { title: '', target: 'Tüm Topluluklar' };

  allEvents: EventRequest[] = [
    {
      id: 1,
      communityName: 'AI Club',
      eventName: 'Yapay Zeka Zirvesi',
      date: '12 Kasım 2023',
      location: 'Konferans Salonu A',
      budget: 15000,
      status: 'Beklemede',
    },
    {
      id: 2,
      communityName: 'Dans Topluluğu',
      eventName: 'Yıl Sonu Gösterisi',
      date: '15 Kasım 2023',
      location: 'Kültür Merkezi',
      budget: 5000,
      status: 'Onaylandı',
    },
    {
      id: 3,
      communityName: 'Girişimcilik',
      eventName: 'Startup Weekend',
      date: '20 Kasım 2023',
      location: 'İnovasyon Merkezi',
      budget: 25000,
      status: 'Reddedildi',
    },
    {
      id: 4,
      communityName: 'Gezi Kulübü',
      eventName: 'Uludağ Kampı',
      date: '25 Kasım 2023',
      location: 'Uludağ',
      budget: 45000,
      status: 'Beklemede',
    },
  ];

  notifications = [
    { text: 'E-Spor topluluğu onay bekliyor', time: '10 dk önce' },
    { text: 'AI Zirvesi bütçe onayı istiyor', time: '1 saat önce' },
  ];

  // Router servisini inject ediyoruz
  constructor(private toastService: ToastService, private router: Router) {}

  ngOnInit() {}

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

  openModal(type: string) {
    this.modalType = type;
    this.isModalOpen = true;
  }
  closeModal() {
    this.isModalOpen = false;
  }

  saveAnnouncement() {
    if (!this.newAnnouncement.title) return;
    this.announcements.unshift({
      id: Date.now(),
      title: this.newAnnouncement.title,
      target: this.newAnnouncement.target,
      date: 'Bugün',
      status: 'Yayında',
      views: 0,
    });
    this.newAnnouncement = { title: '', target: 'Tüm Topluluklar' };
    this.closeModal();
    this.showToast('Duyuru yayınlandı', 'success');
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
