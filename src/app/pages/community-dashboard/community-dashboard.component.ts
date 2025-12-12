import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
}
interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
}
interface Collaboration {
  id: number;
  clubName: string;
  university: string;
  type: 'Partner Arıyor' | 'Konuşmacı Arıyor' | 'Turne';
  description: string;
  logo: string;
}
interface DashboardEvent {
  id: number;
  title: string;
  status: 'approved' | 'pending' | 'rejected';
  imageUrl: string;
  date: string;
  location: string;
  category: string;
  description: string;
}
@Component({
  selector: 'app-community-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  modalType: 'new-project' | 'new-member' | null = null;
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
  clubInfo = {
    name: 'Yapay Zeka ve Robotik Kulübü',
    university: 'İstanbul Teknik Üniversitesi',
    logo: 'https://ui-avatars.com/api/?name=AI&background=14d2cc&color=fff&size=128&font-size=0.4',
    balance: 18500,
    email: 'ai@itu.edu.tr',
    phone: '+90 555 123 45 67',
    instagram: '@itu_ai_official',
    description: 'Geleceği kodlayanların buluşma noktası.',
  };
  stats = { totalMembers: 142, activeProjects: 4, pendingRequests: 2, totalEvents: 12 };
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
      imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=60',
      date: '12 Mayıs',
      location: 'İTÜ Ayazağa',
      category: 'Teknoloji',
      description: 'Sektörden konuşmacılarla AI odaklı zirve.',
    },
    {
      id: 2,
      title: 'Robotik Atölye',
      status: 'pending',
      imageUrl: 'https://images.unsplash.com/photo-1581094288338-60f87c68fc9b?auto=format&fit=crop&w=800&q=60',
      date: '25 Mayıs',
      location: 'ODTÜ Kültür Merkezi',
      category: 'Atölye',
      description: 'Arduino ve sensörlerle uygulamalı robotik eğitimi.',
    },
    {
      id: 3,
      title: 'FinTech Günleri',
      status: 'approved',
      imageUrl: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=60',
      date: '2 Haziran',
      location: 'Boğaziçi Garanti Kültür',
      category: 'Finans',
      description: 'Ödeme teknolojileri ve blokzincir seminerleri.',
    },
    {
      id: 4,
      title: 'Sosyal Sorumluluk Koşusu',
      status: 'rejected',
      imageUrl: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=800&q=60',
      date: '8 Haziran',
      location: 'Ankara Kampüsü',
      category: 'Sosyal',
      description: 'Bağış toplama koşusu için başvuru reddedildi.',
    },
    {
      id: 5,
      title: 'Hackathon 24',
      status: 'pending',
      imageUrl: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=60',
      date: '15 Haziran',
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
    },
  ];
  notifications: Notification[] = [
    { id: 1, text: 'Yeni üye başvurusu', time: '10 dk önce', read: false },
    { id: 2, text: 'TÜBİTAK onayı', time: '2 saat önce', read: false },
  ];
  collaborations: Collaboration[] = [
    {
      id: 1,
      clubName: 'ODTÜ Robotik',
      university: 'ODTÜ',
      type: 'Partner Arıyor',
      description: 'Otonom araç projesi için yazılım ekibi arıyoruz.',
      logo: 'https://ui-avatars.com/api/?name=ODTU&background=ef4444&color=fff',
    },
    {
      id: 2,
      clubName: 'Boğaziçi Girişim',
      university: 'Boğaziçi',
      type: 'Konuşmacı Arıyor',
      description: 'Fintech zirvesi için organizasyon partneri.',
      logo: 'https://ui-avatars.com/api/?name=BOUN&background=3b82f6&color=fff',
    },
    {
      id: 3,
      clubName: 'YTÜ SKY LAB',
      university: 'Yıldız Teknik',
      type: 'Turne',
      description: 'Hackathon serisi başlatıyoruz.',
      logo: 'https://ui-avatars.com/api/?name=YTU&background=f59e0b&color=fff',
    },
  ];
  constructor() {}
  ngOnInit(): void {}
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!event.target.closest('.profile-wrapper')) {
      this.isProfileOpen = false;
    }
    if (!event.target.closest('.notification-btn')) {
      this.showNotifications = false;
    } // Class name updated
  }
  get filteredMembers() {
    if (!this.memberSearchText) return this.members;
    return this.members.filter(
      (m) =>
        m.name.toLowerCase().includes(this.memberSearchText.toLowerCase()) ||
        m.department.toLowerCase().includes(this.memberSearchText.toLowerCase())
    );
  }
  get filteredDashboardEvents() {
    if (this.statusFilter === 'all') return this.dashboardEvents;
    return this.dashboardEvents.filter((e) => e.status === this.statusFilter);
  }
  get currentTabTitle() {
    const titles: Record<string, string> = {
      overview: 'Genel Bakış',
      projects: 'Etkinliklerim',
      network: 'Diğer Topluluklar',
      members: 'Üyeler',
      settings: 'Ayarlar',
    };
    return titles[this.activeTab] || 'Panel';
  }
  // Functions
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  switchTab(tab: string) {
    this.activeTab = tab;
    this.showNotifications = false;
    this.isProfileOpen = false;
  }
  toggleNotifications(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.isProfileOpen = false;
  }
  toggleProfileDropdown(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isProfileOpen = !this.isProfileOpen;
    this.showNotifications = false;
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
  contactClub(clubName: string) {
    this.showToast(`${clubName} ile iletişim başlatıldı.`, 'success');
  }
  exportData(type: string) {
    this.showToast(`${type.toUpperCase()} indiriliyor...`, 'success');
  }
  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.clubInfo.logo = reader.result as string;
      this.showToast('Logo güncellendi.', 'success');
    };
    reader.readAsDataURL(file);
  }
  logout() {
    this.showToast('Çıkış yapılıyor...', 'success');
  }
  updateSettings() {
    this.showToast('Ayarlar güncellendi!', 'success');
  }
  openModal(type: any) {
    this.modalType = type;
    this.isModalOpen = true;
    this.newProjectData = { name: '', category: 'Teknoloji', budget: 0, deadline: '' };
    this.newMemberData = {
      name: '',
      department: '',
      role: 'Üye',
      email: '',
      phone: '',
      grade: '1. Sınıf',
    };
  }
  closeModal() {
    this.isModalOpen = false;
    this.modalType = null;
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
      this.stats.activeProjects++;
      this.showToast('Proje eklendi.', 'success');
      this.closeModal();
    }
  }

  saveMember() {
    if (this.newMemberData.name) {
      this.members.unshift({
        id: Date.now(),
        name: this.newMemberData.name,
        role: this.newMemberData.role,
        department: this.newMemberData.department,
        email: this.newMemberData.email,
        phone: this.newMemberData.phone,
        grade: this.newMemberData.grade,
        avatar: `https://ui-avatars.com/api/?name=${this.newMemberData.name}&background=e2e8f0&color=1e293b`,
        status: 'Aktif',
      });
      this.stats.totalMembers++;
      this.showToast('Üye eklendi.', 'success');
      this.closeModal();
    }
  }
  deleteMember(id: number) {
    if (confirm('Silinsin mi?')) {
      this.members = this.members.filter((m) => m.id !== id);
      this.stats.totalMembers--;
      this.showToast('Silindi.', 'error');
    }
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.toastMessage = msg;
    this.toastType = type;
    setTimeout(() => (this.toastMessage = null), 3000);
  }
}
