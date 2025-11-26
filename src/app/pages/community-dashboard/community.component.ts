import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
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

interface Notification { id: number; text: string; time: string; read: boolean; }
interface ChatContact { id: number; name: string; avatar: string; lastMsg: string; time: string; unread: number; online: boolean; }
interface ChatMessage { id: number; sender: 'me' | 'them'; text: string; time: string; }
interface SponsorOpportunity { id: number; name: string; type: 'Hibe' | 'Sponsorluk' | 'Materyal'; amount: string; deadline: string; logo: string; status: 'Başvuruldu' | 'Açık'; }
interface Collaboration { id: number; clubName: string; university: string; type: 'Partner Arıyor' | 'Konuşmacı Arıyor' | 'Turne'; description: string; logo: string; }
interface DocumentTemplate { id: number; name: string; type: 'PDF' | 'DOCX' | 'ZIP'; icon: string; }

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss']
})
export class CommunityComponent implements OnInit, AfterViewChecked {

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
  newMemberData = { name: '', department: '', role: 'Üye', email: '', phone: '', grade: '1. Sınıf' };
  memberSearchText: string = '';

  // Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  // --- DATA ---
  clubInfo = {
    name: 'Yapay Zeka ve Robotik Kulübü',
    university: 'İstanbul Teknik Üniversitesi',
    logo: 'https://ui-avatars.com/api/?name=AI&background=14d2cc&color=fff&size=128&font-size=0.4',
    balance: 18500,
    email: 'ai@itu.edu.tr',
    phone: '+90 555 123 45 67',
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
    { id: 1, name: 'Ece Yılmaz', role: 'Başkan', department: 'Bilgisayar Müh.', email: 'ece@itu.edu.tr', phone: '555-111-2233', grade: '3. Sınıf', avatar: 'https://ui-avatars.com/api/?name=EY&background=e2e8f0&color=1e293b', status: 'Aktif' },
    { id: 2, name: 'Mert Demir', role: 'Başkan Yrd.', department: 'Endüstri Müh.', email: 'mert@itu.edu.tr', phone: '555-222-3344', grade: '4. Sınıf', avatar: 'https://ui-avatars.com/api/?name=MD&background=e2e8f0&color=1e293b', status: 'Aktif' },
    { id: 3, name: 'Selin Kaya', role: 'Sosyal Medya', department: 'Mimarlık', email: 'selin@itu.edu.tr', phone: '555-333-4455', grade: '2. Sınıf', avatar: 'https://ui-avatars.com/api/?name=SK&background=e2e8f0&color=1e293b', status: 'Aktif' },
    { id: 4, name: 'Burak Çelik', role: 'Üye', department: 'Makine Müh.', email: 'burak@itu.edu.tr', phone: '555-444-5566', grade: '1. Sınıf', avatar: 'https://ui-avatars.com/api/?name=BC&background=e2e8f0&color=1e293b', status: 'Pasif' },
    { id: 5, name: 'Ayşe Can', role: 'Üye', department: 'Matematik', email: 'ayse.can@itu.edu.tr', phone: '555-555-6677', grade: '2. Sınıf', avatar: 'https://ui-avatars.com/api/?name=AC&background=e2e8f0&color=1e293b', status: 'Aktif' },
  ];

  notifications: Notification[] = [
    { id: 1, text: 'Yeni üye başvurusu', time: '10 dk önce', read: false },
    { id: 2, text: 'TÜBİTAK onayı', time: '2 saat önce', read: false },
  ];

  sponsors: SponsorOpportunity[] = [
    { id: 1, name: 'TÜBİTAK 2209-A', type: 'Hibe', amount: '6.000₺', deadline: '15 Kasım', status: 'Açık', logo: 'https://logo.clearbit.com/tubitak.gov.tr' },
    { id: 2, name: 'Red Bull', type: 'Sponsorluk', amount: 'Ürün', deadline: '01 Aralık', status: 'Açık', logo: 'https://logo.clearbit.com/redbull.com' },
    { id: 3, name: 'Microsoft', type: 'Materyal', amount: 'Cloud', deadline: 'Süresiz', status: 'Başvuruldu', logo: 'https://logo.clearbit.com/microsoft.com' },
    { id: 4, name: 'ÜNİDES', type: 'Hibe', amount: '50.000₺', deadline: '30 Ekim', status: 'Açık', logo: 'assets/logos/gsb.png' }
  ];

  collaborations: Collaboration[] = [
    { id: 1, clubName: 'ODTÜ Robotik', university: 'ODTÜ', type: 'Partner Arıyor', description: 'Otonom araç projesi için yazılım ekibi arıyoruz.', logo: 'https://ui-avatars.com/api/?name=ODTU&background=ef4444&color=fff' },
    { id: 2, clubName: 'Boğaziçi Girişim', university: 'Boğaziçi', type: 'Konuşmacı Arıyor', description: 'Fintech zirvesi için organizasyon partneri.', logo: 'https://ui-avatars.com/api/?name=BOUN&background=3b82f6&color=fff' },
    { id: 3, clubName: 'YTÜ SKY LAB', university: 'Yıldız Teknik', type: 'Turne', description: 'Hackathon serisi başlatıyoruz.', logo: 'https://ui-avatars.com/api/?name=YTU&background=f59e0b&color=fff' },
  ];

  documents: DocumentTemplate[] = [
    { id: 1, name: 'Sponsorluk_Dosyası_v2.pdf', type: 'PDF', icon: 'picture_as_pdf' },
    { id: 2, name: 'Etkinlik_Bütçesi_2025.xlsx', type: 'DOCX', icon: 'table_view' },
    { id: 3, name: 'Yönetim_Kurulu_Kararları.docx', type: 'DOCX', icon: 'description' },
    { id: 4, name: 'Logo_Pack.zip', type: 'ZIP', icon: 'folder_zip' },
  ];

  // Chat
  activeContactId: number = 1;
  newMessageText: string = '';
  chatContacts: ChatContact[] = [
    { id: 1, name: 'ODTÜ Robotik', avatar: 'https://ui-avatars.com/api/?name=OR&background=ef4444&color=fff', lastMsg: 'Merhaba...', time: '14:30', unread: 2, online: true },
    { id: 2, name: 'Boğaziçi Girişim', avatar: 'https://ui-avatars.com/api/?name=BG&background=3b82f6&color=fff', lastMsg: 'Tamamdır.', time: 'Dün', unread: 0, online: false },
    { id: 3, name: 'YTÜ Yapay Zeka', avatar: 'https://ui-avatars.com/api/?name=YZ&background=f59e0b&color=fff', lastMsg: 'Ortak etkinlik...', time: 'Pazartesi', unread: 0, online: true },
  ];
  
  conversations: { [key: number]: ChatMessage[] } = {
    1: [{ id: 1, sender: 'them', text: 'Merhaba, yarışma ne zaman?', time: '14:28' }],
    2: [{ id: 1, sender: 'me', text: 'Selamlar', time: 'Dün' }],
    3: [{ id: 1, sender: 'them', text: 'Ortak etkinlik planı ne oldu?', time: 'Pazartesi' }]
  };

  constructor() { }
  ngOnInit(): void { }
  ngAfterViewChecked() { this.scrollToBottom(); }

  scrollToBottom(): void { try { if(this.myScrollContainer) { this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight; } } catch(err) { } }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if(!event.target.closest('.profile-wrapper')) { this.isProfileOpen = false; }
    if(!event.target.closest('.notification-btn')) { this.showNotifications = false; } // Class name updated
  }

  // Getters
  get activeChatMessages() { return this.conversations[this.activeContactId] || []; }
  get activeContact() { return this.chatContacts.find(c => c.id === this.activeContactId); }
  get filteredMembers() {
    if (!this.memberSearchText) return this.members;
    return this.members.filter(m => m.name.toLowerCase().includes(this.memberSearchText.toLowerCase()) || m.department.toLowerCase().includes(this.memberSearchText.toLowerCase()));
  }

  // Functions
  toggleSidebar() { this.isSidebarCollapsed = !this.isSidebarCollapsed; }
  switchTab(tab: string) { this.activeTab = tab; this.showNotifications = false; this.isProfileOpen = false; }
  toggleNotifications(event?: MouseEvent) { if(event) event.stopPropagation(); this.showNotifications = !this.showNotifications; this.isProfileOpen = false; }
  toggleProfileDropdown(event?: MouseEvent) { if(event) event.stopPropagation(); this.isProfileOpen = !this.isProfileOpen; this.showNotifications = false; }
  toggleRowMenu(id: number, event: MouseEvent) { event.stopPropagation(); this.activeRowMenuId = this.activeRowMenuId === id ? null : id; }
  
  selectContact(id: number) { this.activeContactId = id; const contact = this.chatContacts.find(c => c.id === id); if (contact) contact.unread = 0; }
  sendMessage() { if (this.newMessageText.trim()) { if (!this.conversations[this.activeContactId]) this.conversations[this.activeContactId] = []; this.conversations[this.activeContactId].push({ id: Date.now(), sender: 'me', text: this.newMessageText, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }); this.newMessageText = ''; } }
  
  togglePromote(project: Project) { project.isPromoted = !project.isPromoted; this.showToast(project.isPromoted ? 'Öne çıkarıldı.' : 'Normal.', 'success'); }
  applySponsor(name: string) { this.showToast(`${name} başvurusu alındı.`, 'success'); }
  contactClub(clubName: string) { this.activeTab = 'messages'; this.showToast(`${clubName} sohbeti açıldı.`, 'success'); }
  exportData(type: string) { this.showToast(`${type.toUpperCase()} indiriliyor...`, 'success'); }
  downloadDoc(name: string) { this.showToast(`${name} indiriliyor...`, 'success'); }
  logout() { this.showToast('Çıkış yapılıyor...', 'success'); }
  updateSettings() { this.showToast('Ayarlar güncellendi!', 'success'); }

  openModal(type: any) { 
    this.modalType = type; this.isModalOpen = true; 
    this.newProjectData = { name: '', category: 'Teknoloji', budget: 0, deadline: '' };
    this.newMemberData = { name: '', department: '', role: 'Üye', email: '', phone: '', grade: '1. Sınıf' };
  }
  closeModal() { this.isModalOpen = false; this.modalType = null; }
  
  saveProject() {
    if (this.newProjectData.name) {
      this.projects.unshift({
        id: Date.now(), name: this.newProjectData.name, status: 'Taslak', progress: 0,
        budget: this.newProjectData.budget, deadline: this.newProjectData.deadline || 'TBA', isPromoted: false, category: this.newProjectData.category
      });
      this.stats.activeProjects++; this.showToast('Proje eklendi.', 'success'); this.closeModal();
    }
  }
  
  saveMember() {
    if (this.newMemberData.name) {
      this.members.unshift({
        id: Date.now(), name: this.newMemberData.name, role: this.newMemberData.role,
        department: this.newMemberData.department, email: this.newMemberData.email, phone: this.newMemberData.phone, grade: this.newMemberData.grade,
        avatar: `https://ui-avatars.com/api/?name=${this.newMemberData.name}&background=e2e8f0&color=1e293b`, status: 'Aktif'
      });
      this.stats.totalMembers++; this.showToast('Üye eklendi.', 'success'); this.closeModal();
    }
  }
  deleteMember(id: number) { if(confirm('Silinsin mi?')) { this.members = this.members.filter(m => m.id !== id); this.stats.totalMembers--; this.showToast('Silindi.', 'error'); } }
  
  showToast(msg: string, type: 'success' | 'error') { this.toastMessage = msg; this.toastType = type; setTimeout(() => this.toastMessage = null, 3000); }
}