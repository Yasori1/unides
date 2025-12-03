import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http'; 
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { BlogSidebarComponent } from '../../common/blog-sidebar/blog-sidebar.component';

// Duyuru veri modeli (Entity ile uyumlu)
export interface Announcement {
  annid: number;
  title: string;
  shortDescription: string;
  annDate: string; 
  description: string;
  link?: string;
  imagePath?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-announcements-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HttpClientModule,
    HeaderComponent,
    PageBannerComponent,
    BlogSidebarComponent,
    FooterComponent,
  ],
  templateUrl: './announcements-page.component.html',
  styleUrls: ['./announcements-page.component.scss'],
})
export class AnnouncementsPageComponent implements OnInit {
  // Sayfalama konfigürasyonu
  page: number = 0;
  maxPage: number = 1; 

  // Arayüz ayarları
  charLimit: number = 150; // Kartlarda gösterilecek maksimum özet uzunluğu
  
  // Servis bağlantı ayarları
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7256/api/Announcements'; 

  // Duyuru listesi verileri
  // Not: Geliştirme aşamasında test amaçlı statik veriler kullanıldı.
  announcements: Announcement[] = [
    {
      annid: 101,
      title: 'Gençlik Merkezi Kayıtları Başladı!',
      shortDescription: 'Yeni dönem gençlik merkezi atölye ve kurs kayıtlarımız başlamıştır. Detaylı bilgi ve başvuru için portalı ziyaret edebilirsiniz. Kontenjanlar sınırlıdır.',
      annDate: '2025-12-01T10:00:00', 
      description: 'Uzun açıklama metni...',
      imagePath: 'assets/images/kayit.jpg'
    },
    {
      annid: 102,
      title: 'Sistem Bakım Çalışması Hakkında',
      shortDescription: 'Değerli kullanıcılarımız, 5 Aralık gecesi sistemlerimizde planlı bakım çalışması yapılacaktır. Bu süre zarfında kısa süreli kesintiler yaşanabilir.',
      annDate: '2025-11-20T14:30:00',
      description: 'Uzun açıklama metni...',
    }
  ];

  constructor(private route: ActivatedRoute) {
    // URL query parametresinden aktif sayfa numarasını okuma
    this.page = parseInt(this.route.snapshot.queryParams['page'] ?? "0");
  }

  ngOnInit(): void {
    // Servis entegrasyonu tamamlandığında veri çekme işlemi buradan başlatılacak
    // this.getAnnouncements(); 
  }

  /**
   * API üzerinden tüm duyuruları getirir ve tarihe göre (Yeniden > Eskiye) sıralar.
   */
  getAnnouncements() {
    this.http.get<Announcement[]>(`${this.apiUrl}/list`).subscribe({
      next: (data) => {
        this.announcements = data;
        this.announcements.sort((a, b) => new Date(b.annDate).getTime() - new Date(a.annDate).getTime());
      },
      error: (err) => {
        console.error('Veri çekme hatası:', err);
      }
    });
  }

  /**
   * Duyurunun yayınlanma tarihine göre "Yeni" olup olmadığını kontrol eder.
   * Kriter: Son 7 gün içinde yayınlanmış olması.
   * @param dateString ISO formatında tarih
   */
  isNew(dateString: string): boolean {
    if (!dateString) return false;
    const today = new Date();
    const announceDate = new Date(dateString);
    const diffTime = today.getTime() - announceDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 7;
  }
}