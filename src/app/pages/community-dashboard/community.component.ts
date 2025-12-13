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
  grade: string;
  avatar: string;
  status: 'Aktif' | 'Pasif';
}

interface Notification { id: number; text: string; time: string; }
interface DocumentTemplate { id: number; name: string; type: 'PDF' | 'DOCX' | 'ZIP'; icon: string; }

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss']
})
export class CommunityComponent implements OnInit {

  activeTab: string = 'overview';
  activeSettingsTab: string = 'general';
  
  // UI State
  isSidebarCollapsed: boolean = false;
  isModalOpen: boolean = false;
  isProfileOpen: boolean = false;
  showNotifications: boolean = false;
  modalType: 'new-member' | null = null;

  // Form Data
  newMemberData = { name: '', department: '', role: 'Üye' };
  memberSearchText: string = '';

  // Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';

  // --- DATA ---
  clubInfo = {
    name: 'Yapay Zeka ve Robotik Kulübü',
    university: 'İstanbul Teknik Üniversitesi',
    logo: 'https://ui-avatars.com/api/?name=AI&background=14d2cc&color=fff&size=128&font-size=0.4',
    email: 'ai@itu.edu.tr',
    instagram: '@itu_ai_official',
    description: 'Geleceği kodlayanların buluşma noktası.'
  };

  stats = { totalMembers: 142, activeProjects: 4, pendingRequests: 2, totalEvents: 12 };

  projects: Project[] = [
    { id: 1, name: 'İTÜ Robot Olimpiyatları', category: 'Teknoloji', status: 'Yayında', progress: 85, budget: 45000, deadline: '2025-05-20', isPromoted: true },
    { id: 2, name: 'Python Eğitim Kampı', category: 'Eğitim', status: 'Onay Bekliyor', progress: 40, budget: 2000, deadline: '2025-11-15', isPromoted: false },
    { id: 3, name: 'Teknofest Takımı', category: 'Yarışma', status: 'Yayında', progress: 60, budget: 120000, deadline: '2025-09-01', isPromoted: false },
    { id: 4, name: 'Blockchain Workshop', category: 'Yazılım', status: 'Taslak', progress: 10, budget: 0, deadline: '2025-12-01', isPromoted: false }
  ];

  members: Member[] = [
    { id: 1, name: 'Ece Yılmaz', role: 'Başkan', department: 'Bilgisayar Müh.', grade: '3. Sınıf', avatar: 'https://ui-avatars.com/api/?name=EY&background=e2e8f0&color=1e293b', status: 'Aktif' },
    { id: 2, name: 'Mert Demir', role: 'Başkan Yrd.', department: 'Endüstri Müh.', grade: '4. Sınıf', avatar: 'https://ui-avatars.com/api/?name=MD&background=e2e8f0&color=1e293b', status: 'Aktif' },
    { id: 3, name: 'Selin Kaya', role: 'YK Üyesi', department: 'Mimarlık', grade: '2. Sınıf', avatar: 'https://ui-avatars.com/api/?name=SK&background=e2e8f0&color=1e293b', status: 'Aktif' },
    { id: 4, name: 'Burak Çelik', role: 'Üye', department: 'Makine Müh.', grade: '1. Sınıf', avatar: 'https://ui-avatars.com/api/?name=BC&background=e2e8f0&color=1e293b', status: 'Pasif' },
    { id: 5, name: 'Ayşe Can', role: 'Üye', department: 'Matematik', grade: '2. Sınıf', avatar: 'https://ui-avatars.com/api/?name=AC&background=e2e8f0&color=1e293b', status: 'Aktif' },
  ];

  notifications: Notification[] = [
    { id: 1, text: 'Yeni üye başvurusu alındı', time: '10 dk önce' },
    { id: 2, text: 'Projeniz onaylandı', time: '2 saat önce' },
  ];

  documents: DocumentTemplate[] = [
    { id: 1, name: 'Sponsorluk_Dosyası_v2.pdf', type: 'PDF', icon: 'picture_as_pdf' },
    { id: 2, name: 'Etkinlik_Bütçesi_2025.xlsx', type: 'DOCX', icon: 'table_view' },
    { id: 3, name: 'Yönetim_Kurulu_Kararları.docx', type: 'DOCX', icon: 'description' },
    { id: 4, name: 'Logo_Pack.zip', type: 'ZIP', icon: 'folder_zip' },
  ];

  constructor() { }
  ngOnInit(): void { }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if(!event.target.closest('.profile-wrapper')) { this.isProfileOpen = false; }
    if(!event.target.closest('.notification-wrapper')) { this.showNotifications = false; }
  }

  get filteredMembers() {
    if (!this.memberSearchText) return this.members;
    return this.members.filter(m => m.name.toLowerCase().includes(this.memberSearchText.toLowerCase()) || m.department.toLowerCase().includes(this.memberSearchText.toLowerCase()));
  }

  //Functions
  toggleSidebar() { this.isSidebarCollapsed = !this.isSidebarCollapsed; }
  
  switchTab(tab: string) { 
    this.activeTab = tab; 
    this.showNotifications = false; 
    this.isProfileOpen = false;
    if(tab === 'settings') this.activeSettingsTab = 'general';
  }

  getTabTitle(tab: string): string {
    const titles: {[key: string]: string} = {
      'overview': 'Genel Bakış',
      'projects': 'Projeler',
      'documents': 'Belgeler',
      'members': 'Üye Yönetimi',
      'settings': 'Ayarlar'
    };
    return titles[tab] || 'Panel';
  }

  toggleNotifications(event?: MouseEvent) { 
    if(event) event.stopPropagation(); 
    this.showNotifications = !this.showNotifications; 
    this.isProfileOpen = false; 
  }

  toggleProfileDropdown(event?: MouseEvent) { 
    if(event) event.stopPropagation(); 
    this.isProfileOpen = !this.isProfileOpen; 
    this.showNotifications = false; 
  }
  
  togglePromote(project: Project, event: MouseEvent) { 
    event.stopPropagation(); // Satır tıklamasını engelle
    project.isPromoted = !project.isPromoted; 
    this.showToast(project.isPromoted ? 'Favorilere eklendi ⭐' : 'Favorilerden çıkarıldı.', 'success'); 
  }
  
  exportData(type: string) { this.showToast(`${type.toUpperCase()} indiriliyor...`, 'success'); }
  downloadDoc(name: string) { this.showToast(`${name} indiriliyor...`, 'success'); }
  logout() { this.showToast('Çıkış yapılıyor...', 'success'); }
  updateSettings() { this.showToast('Ayarlar güncellendi!', 'success'); }

  openModal(type: 'new-member') { 
    this.modalType = type; 
    this.isModalOpen = true; 
    this.newMemberData = { name: '', department: '', role: 'Üye' };
  }
  closeModal() { this.isModalOpen = false; this.modalType = null; }
  
  saveMember() {
    if (this.newMemberData.name) {
      this.members.unshift({
        id: Date.now(), 
        name: this.newMemberData.name, 
        role: this.newMemberData.role,
        department: this.newMemberData.department, 
        grade: '1. Sınıf',
        avatar: `https://ui-avatars.com/api/?name=${this.newMemberData.name}&background=e2e8f0&color=1e293b`, 
        status: 'Aktif'
      });
      this.stats.totalMembers++; 
      this.showToast('Üye eklendi.', 'success'); 
      this.closeModal();
    }
  }
  
  showToast(msg: string, type: 'success' | 'error') { 
    this.toastMessage = msg; 
    this.toastType = type; 
    setTimeout(() => this.toastMessage = null, 3000); 
  }
}