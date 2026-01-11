import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnnouncementService, Announcement } from '../../services/announcement.services';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

// --- Interface Tanımı (DÜZELTİLDİ) ---
// Omit kullanarak Announcement içindeki orijinal 'link' tanımını çıkardık
// ve aşağıda kendi isteğe bağlı 'link?' tanımımızı ekledik.
interface ExtendedAnnouncement extends Omit<Announcement, 'link'> {
  category?: 'Genel' | 'Bakanlık';
  link?: string;
}

@Component({
  selector: 'app-announcements-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SiteNavbarComponent, SiteFooterComponent, FormsModule],
  templateUrl: './announcements-page.component.html',
  styleUrls: ['./announcements-page.component.scss'],
})
export class AnnouncementsPageComponent implements OnInit {
  // Banner Animasyonu
  heroMoveX = 0;
  heroMoveY = 0;

  // Veri Listeleri
  allAnnouncements: ExtendedAnnouncement[] = [];
  filteredAnnouncements: ExtendedAnnouncement[] = [];
  displayedAnnouncements: ExtendedAnnouncement[] = [];

  // Filtreleme
  searchText: string = '';
  sortOrder: 'default' | 'date_desc' | 'date_asc' = 'default';
  selectedCategory: 'all' | 'Genel' | 'Bakanlık' = 'all';

  // Sayfalama
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 0;
  pages: number[] = [];

  isLoading: boolean = true;

  constructor(
    private announcementService: AnnouncementService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAnnouncements();
    }
  }

  loadAnnouncements() {
    this.isLoading = true;
    this.announcementService.getAllAnnouncements().subscribe({
      next: (data) => {
        // Mevcut verilere 'Genel' kategorisi atayalım
        // data.map içinde gelen objeyi ExtendedAnnouncement tipine uyduruyoruz
        const generalData: ExtendedAnnouncement[] = (data || []).map(item => ({ 
          ...item, 
          category: 'Genel',
          // Eğer servisten gelen veride link yoksa boş string veya undefined gelebilir
          link: item.link || '' 
        }));
        
        // --- DEMO BAKANLIK VERİLERİ ---
        const ministryData: ExtendedAnnouncement[] = [
          {
            id: 901,
            title: 'YÖK 2024-2025 Akademik Takvim Genelgesi Yayınlandı',
            shortDescription: 'Yükseköğretim Kurulu tarafından üniversitelerin akademik takvimlerine ilişkin yeni usul ve esaslar belirlenmiştir.',
            content: '', 
            date: '2024-08-15',
            image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop',
            category: 'Bakanlık',
            link: 'yok-akademik-takvim-2024'
          },
          {
            id: 902,
            title: 'Gençlik ve Spor Bakanlığı GSB Burs Başvuruları',
            shortDescription: '2024-2025 eğitim öğretim yılı için GSB burs ve kredi başvuruları başlamıştır. Son başvuru tarihini kaçırmayın.',
            content: '',
            date: '2024-09-01',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop',
            category: 'Bakanlık',
            link: 'gsb-burs-basvurulari'
          },
          {
            id: 903,
            title: 'TÜBİTAK 2209-A Proje Destek Miktarları Artırıldı',
            shortDescription: 'Sanayi ve Teknoloji Bakanlığı, üniversite öğrencilerine yönelik proje destek limitlerinde güncellemeye gitti.',
            content: '',
            date: '2024-10-10',
            image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=1000&auto=format&fit=crop',
            category: 'Bakanlık',
            link: 'tubitak-destek-artisi'
          },
          {
            id: 904,
            title: 'ÜNİDES 2025 Destek Programı Başvuruları Açıldı',
            shortDescription: 'Üniversite topluluklarının proje ve etkinliklerine yönelik destek programı için başvurular başladı.',
            content: '',
            date: '2024-11-05',
            image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1000&auto=format&fit=crop',
            category: 'Bakanlık',
            link: 'unides-destek-programi-2025'
          },
          {
            id: 905,
            title: 'Genç Ofis Etkinlik Takvimi Güncellendi',
            shortDescription: '81 ildeki Genç Ofis etkinlikleri için yeni takvim duyuruldu. Takvim üzerinden takip edebilirsiniz.',
            content: '',
            date: '2024-11-18',
            image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000&auto=format&fit=crop',
            category: 'Bakanlık',
            link: 'genc-ofis-etkinlik-takvimi'
          },
          {
            id: 906,
            title: 'Topluluklar Arası İş Birliği Çağrısı',
            shortDescription: 'Üniversite toplulukları için ortak proje ve etkinlik çağrısı yayınlandı. Detaylar duyuruda.',
            content: '',
            date: '2024-12-02',
            image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1000&auto=format&fit=crop',
            category: 'Bakanlık',
            link: 'topluluk-isbirligi-cagrisi'
          }
        ];

        // Verileri birleştir
        this.allAnnouncements = [...ministryData, ...generalData];
        
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Duyurular yüklenirken hata oluştu:', err);
        this.isLoading = false;
        this.allAnnouncements = [];
        this.filteredAnnouncements = [];
      }
    });
  }

  // --- FİLTRELEME MANTIĞI ---
  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value;
    this.applyFilters();
  }

  applyFilters() {
    let temp = [...this.allAnnouncements];

    // 1. Arama Metni (Türkçe Karakter Destekli)
    if (this.searchText.trim()) {
      const term = this.searchText.toLocaleLowerCase('tr-TR');
      temp = temp.filter(
        (a) =>
          (a.title && a.title.toLocaleLowerCase('tr-TR').includes(term)) ||
          (a.shortDescription && a.shortDescription.toLocaleLowerCase('tr-TR').includes(term))
      );
    }

    // 2. Kategori Filtresi
    if (this.selectedCategory !== 'all') {
      temp = temp.filter(a => a.category === this.selectedCategory);
    }

    // 3. Sıralama
    if (this.sortOrder === 'date_desc') {
      temp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (this.sortOrder === 'date_asc') {
      temp.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
       // Varsayılan: Tarihe göre (Yeni -> Eski)
       temp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    this.filteredAnnouncements = temp;
    this.currentPage = 1;
    this.initPagination();
  }

  // --- SAYFALAMA ---
  initPagination() {
    this.totalPages = Math.ceil(this.filteredAnnouncements.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayedAnnouncements = this.filteredAnnouncements.slice(start, end);
    
    // Sayfa değiştiğinde yukarı kaydır
    if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.updateDisplayedData();
    }
  }

  // --- YARDIMCI FONKSİYONLAR ---
  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - 200;
      this.heroMoveX = x / 30;
      this.heroMoveY = y / 30;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }
}