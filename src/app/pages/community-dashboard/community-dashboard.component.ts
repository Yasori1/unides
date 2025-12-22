import { Component, OnInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ImageUploadComponent } from '../../components/ui/image-upload/image-upload';
import { CommunityService, Community } from '../../services/community.services';

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
interface UserSearchResult {
  name: string;
  email: string;
}
interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
<<<<<<< Updated upstream
  type?: 'event' | 'member' | 'project' | 'general';
  link?: string;
  tab?: string;
=======
  targetTab?: string; // Hangi tab'a yönlendirileceği
  targetRoute?: string; // Veya hangi route'a yönlendirileceği
>>>>>>> Stashed changes
}
interface Collaboration {
  id: number;
  clubName: string;
  university: string;
  description: string;
  logo: string;
  coverImage?: string;
  memberCount?: number;
  city?: string;
  category?: string;
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
  imports: [CommonModule, FormsModule, ImageUploadComponent],
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
  modalType: 'new-event' | 'new-project' | 'new-member' | null = null;
  isSearchingMembers = false;
  memberSearchQuery = '';
  memberSearchResults: UserSearchResult[] = [];
  confirmDeleteId: number | null = null;
  confirmVisible = false;
  confirmHiding = false;
  private confirmTimer: any;
  memberCurrentPage = 1;
  membersPerPage = 20;
  private toastTimer: any;
  showBannerModal = false;
  showAvatarModal = false;
  initialClubInfo: any = {};
  // Event creation modal
  newEventData = {
    title: '',
    date: '',
    time: '',
    location: '',
    quota: '',
    description: '',
    image: '',
  };
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
    city: 'İstanbul',
    category: 'Teknoloji',
    logo: 'https://ui-avatars.com/api/?name=AI&background=14d2cc&color=fff&size=128&font-size=0.4',
    banner: 'assets/img/placeholder-cover.jpg',
    balance: 18500,
    email: 'ai@itu.edu.tr',
    website: '',
    phone: '+90 555 123 45 67',
    instagram: '@itu_ai_official',
    youtube: '',
    twitter: '',
    tiktok: '',
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
      imageUrl:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=60',
      date: '12 Mayıs',
      location: 'İTÜ Ayazağa',
      category: 'Teknoloji',
      description: 'Sektörden konuşmacılarla AI odaklı zirve.',
    },
    {
      id: 2,
      title: 'Robotik Atölye',
      status: 'pending',
      imageUrl:
        'https://images.unsplash.com/photo-1581094288338-60f87c68fc9b?auto=format&fit=crop&w=800&q=60',
      date: '25 Mayıs',
      location: 'ODTÜ Kültür Merkezi',
      category: 'Atölye',
      description: 'Arduino ve sensörlerle uygulamalı robotik eğitimi.',
    },
    {
      id: 3,
      title: 'FinTech Günleri',
      status: 'approved',
      imageUrl:
        'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=800&q=60',
      date: '2 Haziran',
      location: 'Boğaziçi Garanti Kültür',
      category: 'Finans',
      description: 'Ödeme teknolojileri ve blokzincir seminerleri.',
    },
    {
      id: 4,
      title: 'Sosyal Sorumluluk Koşusu',
      status: 'rejected',
      imageUrl:
        'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=800&q=60',
      date: '8 Haziran',
      location: 'Ankara Kampüsü',
      category: 'Sosyal',
      description: 'Bağış toplama koşusu için başvuru reddedildi.',
    },
    {
      id: 5,
      title: 'Hackathon 24',
      status: 'pending',
      imageUrl:
        'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=60',
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
<<<<<<< Updated upstream
    { id: 1, text: 'Yeni üye başvurusu', time: '10 dk önce', read: false, type: 'member', tab: 'members' },
    { id: 2, text: 'TÜBİTAK onayı', time: '2 saat önce', read: false, type: 'project', tab: 'projects' },
    { id: 3, text: 'Etkinlik onaylandı', time: '1 gün önce', read: false, type: 'event', tab: 'projects' },
=======
    { id: 1, text: 'Yeni üye başvurusu', time: '10 dk önce', read: false, targetTab: 'members' },
    { id: 2, text: 'TÜBİTAK onayı', time: '2 saat önce', read: false, targetTab: 'projects' },
>>>>>>> Stashed changes
  ];
  collaborations: Collaboration[] = [];
  filteredCollaborations: Collaboration[] = [];
  collabCurrentPage = 1;
  collabPerPage = 15;
  // Filters (Communities page parity)
  searchText: string = '';
  selectedCity: string = '';
  selectedCategory: string = '';
  sortOrder: 'default' | 'member_desc' | 'member_asc' = 'default';
  cities: string[] = [];
  categories: string[] = [];
  isLoading = true;
  constructor(
    private router: Router,
    private communityService: CommunityService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCommunities();
    }
    // snapshot for settings change detection
    this.initialClubInfo = JSON.parse(JSON.stringify(this.clubInfo));
  }

  private loadCommunities() {
    this.communityService.getAllCommunities().subscribe({
      next: (communities) => {
        this.collaborations = communities.map((c) => ({
          id: c.id,
          clubName: c.name,
          university: c.university,
          description: c.description || '',
          logo: c.logo,
          coverImage: c.coverImage || c.banner || c.logo,
          memberCount: c.memberCount,
          city: c.city,
          category: c.category,
        }));
        this.cities = [
          ...new Set(
            this.collaborations.map((c) => c.city || 'Belirsiz').filter((c) => c !== 'Belirsiz')
          ),
        ].sort();
        this.categories = [
          ...new Set(this.collaborations.map((c) => c.category || '').filter((cat) => !!cat)),
        ].sort();
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.collaborations = [];
        this.filteredCollaborations = [];
        this.isLoading = false;
      },
    });
  }
  @HostListener('document:click', ['$event'])
<<<<<<< Updated upstream
  clickout(event: any) {
    if (!event.target.closest('.profile-wrapper') && !event.target.closest('.profile-dropdown')) {
      this.isProfileOpen = false;
    }
    if (!event.target.closest('.notification-wrapper') && !event.target.closest('.dropdown-menu.notifications')) {
=======
  clickout(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Buton tıklaması ise işlem yapma
    if (target.closest('.icon-btn.notification') || target.closest('.profile-pic')) {
      return;
    }
    
    // Profil dropdown kontrolü
    if (!target.closest('.profile-wrapper') && !target.closest('.profile-dropdown')) {
      this.isProfileOpen = false;
    }
    
    // Bildirimler dropdown kontrolü
    if (!target.closest('.notification-wrapper') && !target.closest('.dropdown-menu.notifications')) {
>>>>>>> Stashed changes
      this.showNotifications = false;
    }
  }
  get filteredMembers() {
    if (!this.memberSearchText) return this.members;
    const term = this.memberSearchText.toLowerCase();
    return this.members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.department.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term)
    );
  }
  get pagedMembers() {
    const start = (this.memberCurrentPage - 1) * this.membersPerPage;
    return this.filteredMembers.slice(start, start + this.membersPerPage);
  }
  get memberTotalPages() {
    return Math.max(1, Math.ceil(this.filteredMembers.length / this.membersPerPage));
  }
  get filteredDashboardEvents() {
    if (this.statusFilter === 'all') return this.dashboardEvents;
    return this.dashboardEvents.filter((e) => e.status === this.statusFilter);
  }
  get displayedDashboardEvents() {
    return this.filteredDashboardEvents.slice(0, 5);
  }
  get pagedCollaborations() {
    const start = (this.collabCurrentPage - 1) * this.collabPerPage;
    return this.filteredCollaborations.slice(start, start + this.collabPerPage);
  }
  get collabTotalPages() {
    return Math.max(1, Math.ceil(this.filteredCollaborations.length / this.collabPerPage));
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
  get unreadNotificationsCount() {
    return this.notifications.filter(n => !n.read).length;
  }
  // Functions
  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  switchTab(tab: string) {
    this.clearToast();
    this.activeTab = tab;
    this.showNotifications = false;
    this.isProfileOpen = false;
  }
  toggleNotifications(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.showNotifications = !this.showNotifications;
    this.isProfileOpen = false;
  }

<<<<<<< Updated upstream
=======
  handleNotificationClick(notification: Notification) {
    // Bildirimi okundu olarak işaretle
    notification.read = true;
    
    // Dropdown'u kapat
    this.showNotifications = false;
    
    // Eğer targetTab varsa, o tab'a geç
    if (notification.targetTab) {
      this.switchTab(notification.targetTab);
    }
    // Eğer targetRoute varsa, o route'a git
    else if (notification.targetRoute) {
      this.router.navigate([notification.targetRoute]);
    }
  }
  
>>>>>>> Stashed changes
  toggleProfileDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.isProfileOpen = !this.isProfileOpen;
    this.showNotifications = false;
  }

  handleNotificationClick(notification: Notification) {
    this.showNotifications = false;
    
    if (notification.tab) {
      this.switchTab(notification.tab);
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
  goToCommunity(community: Collaboration) {
    this.router.navigate(['/communities', community.id]);
  }

  applyFilters() {
    let temp = [...this.collaborations];

    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(
        (c) =>
          c.clubName.toLowerCase().includes(term) ||
          c.university.toLowerCase().includes(term) ||
          (c.city || '').toLowerCase().includes(term)
      );
    }

    if (this.selectedCity) {
      temp = temp.filter((c) => c.city === this.selectedCity);
    }

    if (this.selectedCategory) {
      temp = temp.filter((c) => c.category === this.selectedCategory);
    }

    if (this.sortOrder === 'member_desc') {
      temp.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
    } else if (this.sortOrder === 'member_asc') {
      temp.sort((a, b) => (a.memberCount || 0) - (b.memberCount || 0));
    }

    this.filteredCollaborations = temp;
    if (this.collabCurrentPage > this.collabTotalPages) {
      this.collabCurrentPage = this.collabTotalPages;
    }
  }
  setCollabPage(page: number) {
    if (page < 1 || page > this.collabTotalPages) return;
    this.collabCurrentPage = page;
  }
  exportData(type: string) {
    this.showToast(`${type.toUpperCase()} indiriliyor...`, 'success');
  }
  onLogoSelected(event: string | Event) {
    if (typeof event === 'string') {
      this.clubInfo.logo = event;
      this.showToast('Profil fotoğrafı güncellendi.', 'success');
      this.showAvatarModal = false;
      return;
    }
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.clubInfo.logo = reader.result as string;
      this.showToast('Profil fotoğrafı güncellendi.', 'success');
      this.showAvatarModal = false;
    };
    reader.readAsDataURL(file);
  }

  onBannerSelected(event: string | Event) {
    if (typeof event === 'string') {
      this.clubInfo.banner = event;
      this.showToast('Banner güncellendi.', 'success');
      this.showBannerModal = false;
      return;
    }
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.clubInfo.banner = reader.result as string;
      this.showToast('Banner güncellendi.', 'success');
      this.showBannerModal = false;
    };
    reader.readAsDataURL(file);
  }
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_type');
      this.showToast('Çıkış yapıldı', 'success');
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1000);
    }
  }
  updateSettings() {
    if (!this.isSettingsValid) {
      this.showToast('Zorunlu alanları doldurun.', 'error');
      return;
    }
    this.initialClubInfo = JSON.parse(JSON.stringify(this.clubInfo));
    this.showToast('Ayarlar güncellendi!', 'success');
  }

  get isSettingsValid() {
    const emailOk = !!this.clubInfo.email?.trim();
    const aboutOk = !!this.clubInfo.description?.trim();
    return emailOk && aboutOk;
  }

  get isSettingsChanged() {
    const fields = [
      'description',
      'email',
      'website',
      'instagram',
      'youtube',
      'twitter',
      'tiktok',
      'banner',
      'logo',
    ];
    return fields.some((f) => (this.clubInfo as any)[f] !== this.initialClubInfo[f]);
  }
  openModal(type: any) {
    this.clearToast();
    this.modalType = type;
    this.isModalOpen = true;
    this.newEventData = {
      title: '',
      date: '',
      time: '',
      location: '',
      quota: '',
      description: '',
      image: '',
    };
    this.newProjectData = { name: '', category: 'Teknoloji', budget: 0, deadline: '' };
    this.newMemberData = {
      name: '',
      department: '',
      role: 'Üye',
      email: '',
      phone: '',
      grade: '1. Sınıf',
    };
    this.memberSearchQuery = '';
    this.memberSearchResults = [];
    this.isSearchingMembers = false;
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

  saveEvent() {
    if (!this.isEventFormValid) {
      this.showToast('Lütfen tüm alanları doldurun.', 'error');
      return;
    }
    this.showToast('Kurumsal girişe yönlendiriliyorsunuz...', 'success');
    setTimeout(() => {
      this.router.navigate(['/corporate-dashboard'], {
        queryParams: { from: 'community-dashboard', draftEvent: this.newEventData.title },
      });
      this.closeModal();
    }, 600);
  }

  get isEventFormValid() {
    const { title, date, time, location, quota, description, image } = this.newEventData;
    return (
      !!title.trim() &&
      !!date &&
      !!time &&
      !!location.trim() &&
      !!quota &&
      !!description.trim() &&
      !!image
    );
  }

  onEventImageSelected(image: string | Event) {
    // image-upload component string base64/url gönderir
    if (typeof image === 'string') {
      this.newEventData.image = image;
      return;
    }
    // fallback: native input event
    const file = (image.target as HTMLInputElement).files?.[0];
    if (file) this.readFileToBase64(file);
  }

  onEventFileSelected(file: File) {
    if (file) this.readFileToBase64(file);
  }

  private readFileToBase64(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.newEventData.image = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  saveMember() {
    if (this.newMemberData.name && this.newMemberData.email) {
      this.members.unshift({
        id: Date.now(),
        name: this.newMemberData.name,
        role: this.newMemberData.role,
        department: this.newMemberData.department,
        email: this.newMemberData.email,
        phone: this.newMemberData.phone,
        grade: this.newMemberData.grade,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          this.getInitials(this.newMemberData.name)
        )}&background=e2e8f0&color=1e293b`,
        status: 'Aktif',
      });
      this.stats.totalMembers++;
      this.showToast('Üye eklendi.', 'success');
      this.closeModal();
      this.memberCurrentPage = 1;
    } else {
      this.showToast('Ad Soyad ve e-posta zorunludur.', 'error');
    }
  }
  onMemberSearch() {
    const term = this.memberSearchQuery.trim();
    if (!term || term.length < 2) {
      this.memberSearchResults = [];
      return;
    }
    this.isSearchingMembers = true;
    const lowered = term.toLowerCase();
    this.memberSearchResults = this.members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(lowered) ||
          m.department.toLowerCase().includes(lowered) ||
          m.email.toLowerCase().includes(lowered)
      )
      .map((m) => ({ name: m.name, email: m.email }));
    this.isSearchingMembers = false;
  }
  selectMemberSuggestion(user: UserSearchResult) {
    this.newMemberData.name = user.name;
    this.newMemberData.email = user.email;
    this.memberSearchQuery = `${user.name} (${user.email})`;
    this.memberSearchResults = [];
    this.memberCurrentPage = 1;
  }
  openDeleteConfirm(id: number) {
    this.clearToast();
    this.clearConfirmTimer();
    this.confirmDeleteId = id;
    this.confirmVisible = true;
    this.confirmHiding = false;
  }
  cancelDelete() {
    this.startCloseConfirm();
  }
  deleteMemberConfirmed() {
    if (this.confirmDeleteId === null) return;
    this.members = this.members.filter((m) => m.id !== this.confirmDeleteId);
    this.stats.totalMembers--;
    this.showToast('Üye Silindi', 'success');
    if (this.memberCurrentPage > this.memberTotalPages) {
      this.memberCurrentPage = this.memberTotalPages;
    }
    this.startCloseConfirm();
  }
  setMemberPage(page: number) {
    if (page < 1 || page > this.memberTotalPages) return;
    this.memberCurrentPage = page;
  }
  onMemberSearchChange() {
    this.memberCurrentPage = 1;
  }
  private startCloseConfirm() {
    this.confirmHiding = true;
    this.clearConfirmTimer();
    this.confirmTimer = setTimeout(() => {
      this.confirmVisible = false;
      this.confirmDeleteId = null;
      this.confirmHiding = false;
    }, 220);
  }
  private clearConfirmTimer() {
    if (this.confirmTimer) {
      clearTimeout(this.confirmTimer);
      this.confirmTimer = null;
    }
  }

  getInitials(name: string) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
    return initials || name.charAt(0).toUpperCase();
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.clearToast();
    this.toastMessage = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => (this.toastMessage = null), 1800);
  }
  clearToast() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toastMessage = null;
  }
}
