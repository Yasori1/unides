import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.services';

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
  city?: string;
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
  activeTab: 'dashboard' | 'communities' | 'events' | 'announcements' | 'forum' = 'dashboard';

  // Element Ref'ler (Dosya inputlarını tetiklemek için)
  @ViewChild('coverImageInput') coverImageInput!: ElementRef;
  @ViewChild('coverImageInputRef') coverImageInputRef!: ElementRef;
  @ViewChild('logoInput') logoInput!: ElementRef;
  @ViewChild('logoInputRef') logoInputRef!: ElementRef;

  // Drag Durumu
  dragState: { [key: string]: boolean } = { coverImage: false, logo: false };

  stats: StatCard[] = [
    { title: 'Toplam Topluluk', value: '142', icon: 'bx bxs-group', color: 'blue' },
    { title: 'Aktif Etkinlik', value: '28', icon: 'bx bx-calendar-event', color: 'green' },
    { title: 'Bekleyen Başvuru', value: '15', icon: 'bx bx-time-five', color: 'orange' },
    { title: 'Forum Soruları', value: '1,250', icon: 'bx bx-message-square-dots', color: 'purple' },
  ];

  communities: Community[] = [
    {
      id: 1,
      name: 'ODTÜ Yazılım Topluluğu',
      university: 'Orta Doğu Teknik Üniversitesi',
      category: 'Teknoloji',
      description: 'Yazılım dünyasındaki yenilikleri takip eden...',
      coverImage:
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/6/62/ODT%C3%9C_logo.jpg',
      memberCount: 450,
      city: 'Ankara',
    },
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
      content: 'Başvurular başladı.',
      date: '01.02.2025',
      status: 'Yayında',
    },
  ];

  forumPosts: ForumPost[] = [
    { id: 1, user: 'Ahmet Y.', question: 'Kaç üye gerekli?', date: 'Bugün', status: 'Beklemede' },
    { id: 2, user: 'Ayşe K.', question: 'Rezervasyon nasıl?', date: 'Dün', status: 'Onaylı' },
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

  openModal(type: any, item: any = null) {
    this.modalType = type;
    this.editingItem = item;
    this.isModalOpen = true;
    this.formData = item ? { ...item } : {};
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingItem = null;
    this.formData = {};
  }

  // --- RESİM YÜKLEME İŞLEMLERİ ---

  // Gizli inputu tetikle
  triggerFileInput(field: string) {
    if (field === 'coverImage') {
      // Eğer resim varsa "değiştir" butonu inputu, yoksa ana input
      if (this.formData.coverImage) this.coverImageInputRef?.nativeElement.click();
      else this.coverImageInput?.nativeElement.click();
    } else if (field === 'logo') {
      if (this.formData.logo) this.logoInputRef?.nativeElement.click();
      else this.logoInput?.nativeElement.click();
    }
  }

  // Dosya Seçildiğinde
  onFileSelected(event: any, field: string) {
    const file = event.target.files[0];
    this.processFile(file, field);
  }

  // Resmi Kaldır
  removeImage(field: string) {
    this.formData[field] = null;
  }

  // Drag & Drop Olayları
  handleDragOver(event: DragEvent, field: string) {
    event.preventDefault();
    event.stopPropagation();
    this.dragState[field] = true;
  }

  handleDragLeave(event: DragEvent, field: string) {
    event.preventDefault();
    event.stopPropagation();
    this.dragState[field] = false;
  }

  handleDrop(event: DragEvent, field: string) {
    event.preventDefault();
    event.stopPropagation();
    this.dragState[field] = false;

    const file = event.dataTransfer?.files[0];
    if (file) {
      this.processFile(file, field);
    }
  }

  // Dosyayı Base64'e çevir ve kaydet
  processFile(file: File, field: string) {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.formData[field] = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.toast.show('Lütfen geçerli bir resim dosyası yükleyin.', 'error');
    }
  }

  saveItem() {
    // Mevcut kaydetme mantığı (id atama, listeye ekleme) aynen kalabilir
    if (this.editingItem) {
      if (this.modalType === 'community') {
        const index = this.communities.findIndex((c) => c.id === this.editingItem.id);
        if (index !== -1) this.communities[index] = { ...this.formData };
      }
      // ... diğer güncellemeler
      this.toast.show(`${this.getModalTitle()} başarıyla güncellendi.`, 'success');
    } else {
      const newItem = { ...this.formData, id: Date.now() };
      if (this.modalType === 'community') this.communities.push(newItem);
      // ... diğer eklemeler
      this.toast.show(`Yeni ${this.getModalTitle()} başarıyla oluşturuldu.`, 'success');
    }
    this.closeModal();
  }

  deleteItem(type: string, id: number) {
    // ... (Mevcut silme mantığı)
    this.toast.show('Öğe başarıyla silindi.', 'success');
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
