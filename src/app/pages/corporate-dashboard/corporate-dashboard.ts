import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Form işlemleri için
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.services';

// Veri Tipleri (Basitçe burada tanımladım, normalde models klasöründe olur)
interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './corporate-dashboard.html',
  styleUrls: ['./corporate-dashboard.scss'],
})
export class CorporateDashboardComponent implements OnInit {
  activeTab: 'dashboard' | 'communities' | 'events' | 'announcements' | 'forum' | 'settings' =
    'dashboard';

  // --- İSTATİSTİKLER ---
  stats: StatCard[] = [
    { title: 'Toplam Topluluk', value: '142', icon: 'bx bxs-group', color: 'blue' },
    { title: 'Aktif Etkinlik', value: '28', icon: 'bx bx-calendar-event', color: 'green' },
    { title: 'Bekleyen Başvuru', value: '15', icon: 'bx bx-time-five', color: 'orange' },
    { title: 'Forum Soruları', value: '1,250', icon: 'bx bx-message-square-dots', color: 'purple' },
  ];

  // --- MOCK VERİLER (Veritabanı Simülasyonu) ---
  communities = [
    { id: 1, name: 'ODTÜ Yazılım', university: 'ODTÜ', members: 450, status: 'Aktif' },
    { id: 2, name: 'İTÜ Robotik', university: 'İTÜ', members: 320, status: 'Aktif' },
    { id: 3, name: 'Ege Su Altı', university: 'Ege Üni.', members: 120, status: 'Pasif' },
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

  // --- FORM MODAL KONTROLLERİ ---
  isModalOpen = false;
  modalType: 'community' | 'event' | 'announcement' | 'forum' = 'community';
  editingItem: any = null; // Düzenlenen öğe

  // Form Modelleri
  formData: any = {};

  constructor(private toast: ToastService, private router: Router) {}

  ngOnInit(): void {}

  // Sekme Değiştir
  switchTab(tab: any) {
    this.activeTab = tab;
  }

  // Çıkış Yap
  logout() {
    // Token silme vb. işlemleri
    this.toast.show('Güvenli çıkış yapıldı.', 'success');
    this.router.navigate(['/login']);
  }

  // --- CRUD İŞLEMLERİ ---

  // Ekleme/Düzenleme Modalını Aç
  openModal(type: 'community' | 'event' | 'announcement' | 'forum', item: any = null) {
    this.modalType = type;
    this.editingItem = item;
    this.isModalOpen = true;

    if (item) {
      // Düzenleme modunda formu doldur
      this.formData = { ...item };
    } else {
      // Yeni ekleme modunda formu temizle
      this.formData = {};
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingItem = null;
    this.formData = {};
  }

  saveItem() {
    // Backend'e kaydetme simülasyonu
    if (this.editingItem) {
      // Güncelleme
      this.toast.show(`${this.getModalTitle()} başarıyla güncellendi.`, 'success');
    } else {
      // Yeni Ekleme
      // Listeye ekleme mantığı (Demo için push)
      if (this.modalType === 'announcement') {
        this.announcements.push({
          ...this.formData,
          id: Date.now(),
          date: 'Bugün',
          status: 'Yayında',
        });
      }
      // Diğerleri için de benzer mantık kurulabilir
      this.toast.show(`Yeni ${this.getModalTitle()} başarıyla oluşturuldu.`, 'success');
    }
    this.closeModal();
  }

  deleteItem(type: string, id: number) {
    if (confirm('Bu öğeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      // Silme simülasyonu
      if (type === 'community') this.communities = this.communities.filter((c) => c.id !== id);
      if (type === 'event') this.events = this.events.filter((e) => e.id !== id);
      if (type === 'announcement')
        this.announcements = this.announcements.filter((a) => a.id !== id);
      if (type === 'forum') this.forumPosts = this.forumPosts.filter((f) => f.id !== id);

      this.toast.show('Öğe başarıyla silindi.', 'success');
    }
  }

  // Helper
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
