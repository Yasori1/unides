import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router'; // ActivatedRoute eklendi
import { FormsModule } from '@angular/forms';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { CommunityService, Community } from '../../services/community.services';

@Component({
  selector: 'app-communities-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './communities-page.component.html',
  styleUrls: ['./communities-page.component.scss'],
})
export class CommunitiesPageComponent implements OnInit {
  // Banner Animasyonu için
  heroMoveX = 0;
  heroMoveY = 0;

  // Veri Listeleri
  allCommunities: Community[] = [];
  filteredCommunities: Community[] = [];
  displayedCommunities: Community[] = [];

  // Filtre Seçenekleri
  cities: string[] = [];
  categories: string[] = [];

  // Filtreleme Değişkenleri
  searchText: string = '';
  selectedCity: string = '';
  selectedCategory: string = '';
  sortOrder: 'default' | 'member_desc' | 'member_asc' = 'default';

  // Sayfalama
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 0;
  pages: number[] = [];

  isLoading: boolean = true;

  constructor(
    private communityService: CommunityService,
    private route: ActivatedRoute, // Route servisi inject edildi
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchCommunities();
    } else {
      this.isLoading = false;
    }
  }

  fetchCommunities() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isLoading = true;

    // --- DEMO VERİSİ ---
    const demoData: Community[] = [
      {
        id: 1,
        name: 'Marmara Bilişim Kulübü',
        university: 'Marmara Üniversitesi',
        city: 'İstanbul',
        category: 'Teknoloji',
        description: 'Yazılım, siber güvenlik ve girişimcilik alanlarında etkinlikler düzenleyen, sektörün önde gelen isimlerini öğrencilerle buluşturan aktif bir topluluk.',
        coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=M+B&background=2563eb&color=fff&size=128',
        memberCount: 450,
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com'
      },
      {
        id: 2,
        name: 'İTÜ IEEE Öğrenci Kolu',
        university: 'İstanbul Teknik Üniversitesi',
        city: 'İstanbul',
        category: 'Mühendislik',
        description: 'Dünyanın en büyük teknik organizasyonu IEEE\'nin İTÜ ayağı. Robotik, enerji ve bilgisayar komiteleri ile dev projelere imza atıyoruz.',
        coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=I+E&background=09090b&color=fff&size=128',
        memberCount: 1200,
        instagram: 'https://instagram.com',
        youtube: 'https://youtube.com',
        socialMedia: 'https://linkedin.com'
      },
      {
        id: 3,
        name: 'ODTÜ Caz Topluluğu',
        university: 'Orta Doğu Teknik Üniversitesi',
        city: 'Ankara',
        category: 'Sanat & Müzik',
        description: 'Kampüsün ritmini tutan, doğaçlama geceleri ve konserler düzenleyen müzik tutkunlarının buluşma noktası.',
        coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=O+C&background=e4405f&color=fff&size=128',
        memberCount: 320,
        instagram: 'https://instagram.com',
        tiktok: 'https://tiktok.com'
      },
      {
        id: 4,
        name: 'Boğaziçi Radyo Kulübü',
        university: 'Boğaziçi Üniversitesi',
        city: 'İstanbul',
        category: 'Medya',
        description: 'Üniversitenin sesi! Yayıncılık eğitimleri, DJ atölyeleri ve canlı yayınlarla kampüs hayatının kalbi burada atıyor.',
        coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=B+R&background=71717a&color=fff&size=128',
        memberCount: 600,
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com'
      },
      {
        id: 5,
        name: 'Yıldız Teknik Dans Kulübü',
        university: 'Yıldız Teknik Üniversitesi',
        city: 'İstanbul',
        category: 'Sanat & Dans',
        description: 'Salsadan Hip-Hop\'a, tangodan modern dansa kadar geniş bir yelpazede eğitimler ve gösteriler sunan dans ailesi.',
        coverImage: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=Y+D&background=f59e0b&color=fff&size=128',
        memberCount: 280,
        instagram: 'https://instagram.com',
        youtube: 'https://youtube.com'
      },
      {
        id: 6,
        name: 'Ege Üniversitesi Havacılık',
        university: 'Ege Üniversitesi',
        city: 'İzmir',
        category: 'Spor',
        description: 'Gökyüzüne aşık olanlar için yamaç paraşütü eğitimleri ve havacılık seminerleri düzenliyoruz.',
        coverImage: 'https://images.unsplash.com/photo-1464039397811-476f652a343b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=E+H&background=3b82f6&color=fff&size=128',
        memberCount: 150,
        instagram: 'https://instagram.com'
      },
      {
        id: 7,
        name: 'Hacettepe E-Spor',
        university: 'Hacettepe Üniversitesi',
        city: 'Ankara',
        category: 'Oyun',
        description: 'League of Legends, Valorant ve CS:GO turnuvaları düzenleyen, üniversiteler arası liglerde okulumuzu temsil eden topluluk.',
        coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=H+E&background=8b5cf6&color=fff&size=128',
        memberCount: 850,
        instagram: 'https://instagram.com',
        tiktok: 'https://tiktok.com',
        youtube: 'https://youtube.com'
      },
      {
        id: 8,
        name: 'Koç Girişimcilik Kulübü',
        university: 'Koç Üniversitesi',
        city: 'İstanbul',
        category: 'İş Dünyası',
        description: 'Yarınların liderlerini bugünden yetiştiriyoruz. Startup dünyası, vaka analizleri ve networking etkinlikleri.',
        coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=K+G&background=10b981&color=fff&size=128',
        memberCount: 550,
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com'
      },
      {
        id: 9,
        name: 'Sakarya Yapay Zeka',
        university: 'Sakarya Üniversitesi',
        city: 'Sakarya',
        category: 'Teknoloji',
        description: 'Derin öğrenme, makine öğrenmesi ve veri bilimi üzerine projeler geliştiren araştırma odaklı öğrenci topluluğu.',
        coverImage: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=S+Y&background=ef4444&color=fff&size=128',
        memberCount: 300,
        socialMedia: 'https://github.com'
      },
      {
        id: 10,
        name: 'Akdeniz Sualtı Sporları',
        university: 'Akdeniz Üniversitesi',
        city: 'Antalya',
        category: 'Spor',
        description: 'Mavilikleri keşfet! Dalış eğitimleri, sualtı fotoğrafçılığı ve deniz temizliği etkinlikleri.',
        coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=A+S&background=06b6d4&color=fff&size=128',
        memberCount: 180,
        instagram: 'https://instagram.com'
      },
      {
        id: 11,
        name: 'GTÜ Rover Takımı',
        university: 'Gebze Teknik Üniversitesi',
        city: 'Kocaeli',
        category: 'Mühendislik',
        description: 'Uluslararası yarışmalar için Mars gezgini (Rover) tasarlayan ve üreten disiplinlerarası mühendislik takımı.',
        coverImage: 'https://images.unsplash.com/photo-1581092921461-eab62e97a785?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=G+R&background=d97706&color=fff&size=128',
        memberCount: 60,
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com',
        youtube: 'https://youtube.com'
      },
      {
        id: 12,
        name: 'GSÜ Münazara',
        university: 'Galatasaray Üniversitesi',
        city: 'İstanbul',
        category: 'Sosyal',
        description: 'Fikirlerin çarpıştığı arena. Ulusal turnuvalara katılım ve etkili konuşma eğitimleri.',
        coverImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        logo: 'https://ui-avatars.com/api/?name=G+M&background=881337&color=fff&size=128',
        memberCount: 220,
        instagram: 'https://instagram.com'
      }
    ];

    // Simüle edilmiş bir gecikme
    setTimeout(() => {
      this.allCommunities = demoData;
      
      // Filtre dropdownlarını doldur
      this.cities = [...new Set(demoData.map(c => c.city || 'Belirsiz'))].sort();
      this.categories = [...new Set(demoData.map(c => c.category))].sort();
      
      // --- ÖNEMLİ: URL Parametrelerini Kontrol Et ---
      const queryParams = this.route.snapshot.queryParams;
      
      if (queryParams['search']) {
        this.searchText = queryParams['search'];
      }
      
      if (queryParams['city']) {
        // Gelen şehir verimizde varsa seçili hale getir
        if (this.cities.includes(queryParams['city'])) {
           this.selectedCity = queryParams['city'];
        }
      }

      // Filtreleri uygula
      this.applyFilters();
      this.isLoading = false;
    }, 800);
  }

  // --- FİLTRELEME MANTIĞI ---
  applyFilters() {
    let temp = [...this.allCommunities];

    // 1. Arama Metni (Ad veya Üniversite içinde)
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.university.toLowerCase().includes(term)
      );
    }

    // 2. Şehir Filtresi
    if (this.selectedCity) {
      temp = temp.filter((c) => c.city === this.selectedCity);
    }

    // 3. Kategori Filtresi
    if (this.selectedCategory) {
      temp = temp.filter((c) => c.category === this.selectedCategory);
    }

    // 4. Sıralama
    if (this.sortOrder === 'member_desc') {
      temp.sort((a, b) => b.memberCount - a.memberCount);
    } else if (this.sortOrder === 'member_asc') {
      temp.sort((a, b) => a.memberCount - b.memberCount);
    }

    this.filteredCommunities = temp;
    this.currentPage = 1; // Filtre değişince ilk sayfaya dön
    this.initPagination();
  }

  resetFilters() {
    this.searchText = '';
    this.selectedCity = '';
    this.selectedCategory = '';
    this.sortOrder = 'default';
    this.applyFilters();
  }

  // --- SAYFALAMA MANTIĞI ---
  initPagination() {
    this.totalPages = Math.ceil(this.filteredCommunities.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedCommunities = this.filteredCommunities.slice(startIndex, endIndex);
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

  // --- Banner Mouse Efekti ---
  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }
}