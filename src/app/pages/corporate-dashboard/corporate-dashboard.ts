import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.services';
// Image Upload Bileşeni Eklendi
import { ImageUploadComponent } from '../../components/ui/image-upload/image-upload';

// ... (Interface'ler aynı kalacak)
interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface Community {
  id: number;
  name: string;
  university: string;
  category: string;
  description: string;
  coverImage: string;
  logo: string;
  memberCount: number;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  status: 'Yayında' | 'Taslak';
}

interface ForumPost {
  id: number;
  user: string;
  question: string;
  date: string;
  status: 'Onaylı' | 'Beklemede';
}

@Component({
  selector: 'app-corporate-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent], // Component Eklendi
  templateUrl: './corporate-dashboard.html',
  styleUrls: ['./corporate-dashboard.scss'],
})
export class CorporateDashboardComponent implements OnInit {
  activeTab: 'dashboard' | 'communities' | 'events' | 'announcements' | 'forum' = 'dashboard';

  stats: StatCard[] = [
    { title: 'Toplam Topluluk', value: '142', icon: 'bx bxs-group', color: 'blue' },
    { title: 'Aktif Etkinlik', value: '28', icon: 'bx bx-calendar-event', color: 'green' },
    { title: 'Bekleyen Başvuru', value: '15', icon: 'bx bx-time-five', color: 'orange' },
    { title: 'Forum Soruları', value: '1,250', icon: 'bx bx-message-square-dots', color: 'purple' },
  ];

  // ... (Mock veriler aynı kalacak)
  communities: Community[] = [
    {
      id: 1,
      name: 'ODTÜ Yazılım Topluluğu',
      university: 'Orta Doğu Teknik Üniversitesi',
      category: 'Teknoloji',
      description: 'Yazılım dünyasındaki yenilikleri takip eden, hackathonlar düzenleyen topluluk.',
      coverImage:
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/6/62/ODT%C3%9C_logo.jpg',
      memberCount: 450,
    },
    // ... diğerleri
  ];

  events = [
    {
      id: 1,
      title: 'Hackathon 2025',
      date: '25 Kasım 2025',
      location: 'İstanbul',
      status: 'Yayında',
    },
    {
      id: 2,
      title: 'Kariyer Zirvesi',
      date: '10 Aralık 2025',
      location: 'Ankara',
      status: 'Taslak',
    },
  ];

  announcements: Announcement[] = [
    {
      id: 1,
      title: 'Bahar Dönemi Başvuruları',
      content: 'Topluluk başvuruları başlamıştır.',
      date: '01.02.2025',
      status: 'Yayında',
    },
  ];

  forumPosts: ForumPost[] = [
    {
      id: 1,
      user: 'Ahmet Y.',
      question: 'Topluluk kurmak için kaç üye gerekli?',
      date: 'Bugün',
      status: 'Beklemede',
    },
    {
      id: 2,
      user: 'Ayşe K.',
      question: 'Etkinlik salonu rezervasyonu nasıl yapılır?',
      date: 'Dün',
      status: 'Onaylı',
    },
  ];

  isModalOpen = false;
  modalType: 'community' | 'event' | 'announcement' | 'forum' = 'community';
  editingItem: any = null;
  formData: any = {};

  constructor(private toast: ToastService, private router: Router) {}

  ngOnInit(): void {}

  switchTab(tab: any) {
    this.activeTab = tab;
  }

  logout() {
    this.toast.show('Güvenli çıkış yapıldı.', 'success');
    this.router.navigate(['/login']);
  }

  openModal(type: 'community' | 'event' | 'announcement' | 'forum', item: any = null) {
    this.modalType = type;
    this.editingItem = item;
    this.isModalOpen = true;

    if (item) {
      this.formData = { ...item };
    } else {
      this.formData = {};
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingItem = null;
    this.formData = {};
  }

  // --- RESİM YÜKLEME EVENT HANDLER ---
  // ImageUploadComponent'ten gelen veriyi yakalar
  updateImage(field: string, value: string) {
    this.formData[field] = value;
  }

  saveItem() {
    if (this.editingItem) {
      // GÜNCELLEME
      if (this.modalType === 'community') {
        const index = this.communities.findIndex((c) => c.id === this.editingItem.id);
        if (index !== -1) {
          this.communities[index] = { ...this.formData };
        }
      } else if (this.modalType === 'event') {
        const index = this.events.findIndex((e) => e.id === this.editingItem.id);
        if (index !== -1) {
          this.events[index] = { ...this.formData };
        }
      }
      this.toast.show(`${this.getModalTitle()} başarıyla güncellendi.`, 'success');
    } else {
      // YENİ EKLEME
      const newItem = { ...this.formData, id: Date.now() };

      if (this.modalType === 'community') {
        // Varsayılan resimler (eğer yüklenmediyse)
        if (!newItem.coverImage) newItem.coverImage = 'assets/img/placeholder.png';
        if (!newItem.logo) newItem.logo = 'assets/img/placeholder-logo.png';
        this.communities.push(newItem);
      } else if (this.modalType === 'announcement') {
        this.announcements.push({ ...newItem, date: 'Bugün', status: 'Yayında' });
      } else if (this.modalType === 'event') {
        this.events.push({ ...newItem, status: 'Yayında' });
      }

      this.toast.show(`Yeni ${this.getModalTitle()} başarıyla oluşturuldu.`, 'success');
    }
    this.closeModal();
  }

  deleteItem(type: string, id: number) {
    if (confirm('Bu öğeyi silmek istediğinize emin misiniz?')) {
      if (type === 'community') this.communities = this.communities.filter((c) => c.id !== id);
      if (type === 'event') this.events = this.events.filter((e) => e.id !== id);
      if (type === 'announcement')
        this.announcements = this.announcements.filter((a) => a.id !== id);
      if (type === 'forum') this.forumPosts = this.forumPosts.filter((f) => f.id !== id);

      this.toast.show('Öğe başarıyla silindi.', 'success');
    }
  }

  getModalTitle(): string {
    switch (this.modalType) {
      case 'community':
        return 'Topluluk';
      case 'event':
        return 'Etkinlik';
      case 'announcement':
        return 'Duyuru';
      case 'forum':
        return 'Soru';
      default:
        return 'Öğe';
    }
  }
}
