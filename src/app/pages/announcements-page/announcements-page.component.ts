import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { AnnouncementService, Announcement } from '../../services/announcement.services';

// Arayüzü genişletiyoruz (Category alanı ekledik)
export interface ExtendedAnnouncement extends Announcement {
  category?: 'Genel' | 'Bakanlık';
}

@Component({
  selector: 'app-announcements-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent],
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
      this.fetchAnnouncements();
    } else {
      this.isLoading = false;
    }
  }

  fetchAnnouncements() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.isLoading = true;

    // Gerçek servis çağrısı
    this.announcementService.getAllAnnouncements().subscribe({
      next: (data) => {
        // Mevcut verilere 'Genel' kategorisi atayalım
        const generalData: ExtendedAnnouncement[] = data.map(item => ({ ...item, category: 'Genel' }));
        
        // --- DEMO BAKANLIK VERİLERİ (Hata Düzeltildi: 'link' alanı eklendi) ---
        const ministryData: ExtendedAnnouncement[] = [
          {
            id: 901,
            title: 'YÖK 2024-2025 Akademik Takvim Genelgesi Yayınlandı',
            shortDescription: 'Yükseköğretim Kurulu tarafından üniversitelerin akademik takvimlerine ilişkin yeni usul ve esaslar belirlenmiştir.',
            content: '', 
            date: '2024-08-15',
            image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop',
            category: 'Bakanlık',
            link: 'yok-akademik-takvim-2024' // Eklendi
          },
          {
            id: 902,
            title: 'Gençlik ve Spor Bakanlığı GSB Burs Başvuruları',
            shortDescription: '2024-2025 eğitim öğretim yılı için GSB burs ve kredi başvuruları başlamıştır. Son başvuru tarihini kaçırmayın.',
            content: '',
            date: '2024-09-01',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop',
            category: 'Bakanlık',
            link: 'gsb-burs-basvurulari' // Eklendi
          },
          {
            id: 903,
            title: 'TÜBİTAK 2209-A Proje Destek Miktarları Artırıldı',
            shortDescription: 'Sanayi ve Teknoloji Bakanlığı, üniversite öğrencilerine yönelik proje destek limitlerinde güncellemeye gitti.',
            content: '',
            date: '2024-10-10',
            image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=1000&auto=format&fit=crop',
            category: 'Bakanlık',
            link: 'tubitak-destek-artisi' // Eklendi
          }
        ];

        // Verileri birleştir
        this.allAnnouncements = [...ministryData, ...generalData];
        
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Duyurular yüklenemedi:', err);
        this.isLoading = false;
      },
    });
  }

  // --- FİLTRELEME MANTIĞI ---
  applyFilters() {
    let temp = [...this.allAnnouncements];

    // 1. Arama Metni
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(
        (a) =>
          a.title.toLowerCase().includes(term) || a.shortDescription.toLowerCase().includes(term)
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
       // Varsayılan: Tarihe göre sırala
       temp.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    this.filteredAnnouncements = temp;
    this.currentPage = 1;
    this.initPagination();
  }

  resetFilters() {
    this.searchText = '';
    this.sortOrder = 'default';
    this.selectedCategory = 'all';
    this.applyFilters();
  }

  // --- SAYFALAMA MANTIĞI ---
  initPagination() {
    this.totalPages = Math.ceil(this.filteredAnnouncements.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedAnnouncements = this.filteredAnnouncements.slice(startIndex, endIndex);
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

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}