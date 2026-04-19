import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AnnouncementService, Announcement } from '../../services/announcement.services';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { Logger } from '../../utils/logger.util';

// Extended Announcement Interface to include link? and category?
interface ExtendedAnnouncement extends Omit<Announcement, 'link'> {
  category?: 'Genel' | 'Bakanlık';
  link?: string;
  applicationLink?: string;
}

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './announcement-detail.component.html',
  styleUrls: ['./announcement-detail.component.scss'],
})
export class AnnouncementDetailComponent implements OnInit {
  announcement: ExtendedAnnouncement | null = null;
  recentAnnouncements: ExtendedAnnouncement[] = [];
  isLoading = true;
  heroMoveX = 0;
  heroMoveY = 0;
  copyLinkSuccess = false;

  // demoMinistryData kaldırıldı - artık backend'den veri çekiliyor
  private demoMinistryData_DEPRECATED: ExtendedAnnouncement[] = [
    {
      id: 901,
      title: 'YÖK 2024-2025 Akademik Takvim Genelgesi Yayınlandı',
      shortDescription: 'Yükseköğretim Kurulu tarafından üniversitelerin akademik takvimlerine ilişkin yeni usul ve esaslar belirlenmiştir.',
      content: '<p>Yükseköğretim Kurulu (YÖK) tarafından 81 ildeki üniversitelere gönderilen genelge ile 2024-2025 eğitim öğretim yılı akademik takvimi belirlenmiştir. Bu kapsamda güz ve bahar dönemlerinin başlangıç ve bitiş tarihleri, sınav dönemleri ve tatil süreleri yeniden düzenlenmiştir. Öğrencilerin ders kayıt işlemlerini belirtilen tarihler arasında yapmaları önem arz etmektedir.</p><p>Detaylı takvim ve yönergeler üniversitelerin web sitelerinde duyurulacaktır.</p>',
      date: '2024-08-15',
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop',
      category: 'Bakanlık',
      link: 'yok-akademik-takvim-2024'
    },
    {
      id: 902,
      title: 'Gençlik ve Spor Bakanlığı GSB Burs Başvuruları',
      shortDescription: '2024-2025 eğitim öğretim yılı için GSB burs ve kredi başvuruları başlamıştır. Son başvuru tarihini kaçırmayın.',
      content: '<p>Gençlik ve Spor Bakanlığı (GSB) Kredi ve Yurtlar Genel Müdürlüğü tarafından yürütülen burs ve öğrenim kredisi başvuruları e-Devlet üzerinden erişime açılmıştır.</p><p>Başvurular 15 Ekim 2024 tarihine kadar devam edecektir. Maddi desteğe ihtiyaç duyan tüm üniversite öğrencileri başvurularını zamanında tamamlamalıdır.</p>',
      date: '2024-09-01',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop',
      category: 'Bakanlık',
      link: 'gsb-burs-basvurulari'
    },
    {
      id: 903,
      title: 'TÜBİTAK 2209-A Proje Destek Miktarları Artırıldı',
      shortDescription: 'Sanayi ve Teknoloji Bakanlığı, üniversite öğrencilerine yönelik proje destek limitlerinde güncellemeye gitti.',
      content: '<p>TÜBİTAK Bilim İnsanı Destek Programları Başkanlığı (BİDEB) tarafından yürütülen 2209-A Üniversite Öğrencileri Araştırma Projeleri Destekleme Programı kapsamında destek üst limitleri artırıldı.</p><p>Yeni düzenleme ile birlikte öğrencilerin araştırma projelerine verilen destek miktarı önemli ölçüde yükseltildi. Başvuru şartları ve güncel kılavuza TÜBİTAK resmi web sitesinden ulaşabilirsiniz.</p>',
      date: '2024-10-10',
      image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=1000&auto=format&fit=crop',
      category: 'Bakanlık',
      link: 'tubitak-destek-artisi'
    },
    {
      id: 904,
      title: 'ÜNİDES 2025 Destek Programı Başvuruları Açıldı',
      shortDescription: 'Üniversite topluluklarının proje ve etkinliklerine yönelik destek programı için başvurular başladı.',
      content: '<p>Gençlik ve Spor Bakanlığı tarafından yürütülen Üniversite Öğrenci Toplulukları İş Birliği ve Destek Programı (ÜNİDES) 2025 yılı başvuruları başladı.</p><p>Program kapsamında üniversite topluluklarının gerçekleştireceği kültürel, sanatsal ve sportif faaliyetlere nakdi destek sağlanacak. Başvurular proje yönetim sistemi üzerinden online olarak alınacaktır.</p>',
      date: '2024-11-05',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1000&auto=format&fit=crop',
      category: 'Bakanlık',
      link: 'unides-destek-programi-2025'
    },
    {
      id: 905,
      title: 'Genç Ofis Etkinlik Takvimi Güncellendi',
      shortDescription: '81 ildeki Genç Ofis etkinlikleri için yeni takvim duyuruldu. Takvim üzerinden takip edebilirsiniz.',
      content: '<p>Gençlik Merkezleri bünyesinde üniversite kampüslerinde faaliyet gösteren Genç Ofislerin yeni dönem etkinlik takvimi yayınlandı.</p><p>Kişisel gelişim atölyeleri, dil kursları, sanat eğitimleri ve gönüllülük faaliyetlerinin yer aldığı takvime bakanlık portalından ulaşabilirsiniz. Tüm etkinlikler ücretsizdir.</p>',
      date: '2024-11-18',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1000&auto=format&fit=crop',
      category: 'Bakanlık',
      link: 'genc-ofis-etkinlik-takvimi'
    },
    {
      id: 906,
      title: 'Topluluklar Arası İş Birliği Çağrısı',
      shortDescription: 'Üniversite toplulukları için ortak proje ve etkinlik çağrısı yayınlandı. Detaylar duyuruda.',
      content: '<p>Farklı üniversitelerdeki öğrenci topluluklarının bir araya gelerek ortak projeler geliştirmesini teşvik etmek amacıyla yeni bir iş birliği çağrısı yayınlandı.</p><p>Bu çağrı kapsamında, en az iki farklı üniversiteden toplulukların ortaklaşa düzenleyeceği ulusal veya bölgesel etkinliklere öncelikli destek verilecektir.</p>',
      date: '2024-12-02',
      image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=1000&auto=format&fit=crop',
      category: 'Bakanlık',
      link: 'topluluk-isbirligi-cagrisi'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private announcementService: AnnouncementService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.route.paramMap.subscribe(params => {
        const id = Number(params.get('id'));
        if (id) {
          this.loadAnnouncement(id);
        }
      });
    }
  }

  loadAnnouncement(id: number) {
    this.isLoading = true;
    this.announcement = null;
    
    // Önce backend'den veri çek
    this.announcementService.getAnnouncementById(id).subscribe({
      next: (data) => {
        if (data) {
          this.announcement = {
            ...data,
            category: 'Genel', // Servisten gelenlere varsayılan kategori
            link: data.link || '',
            applicationLink: data.applicationLink || '',
          };
          this.loadRecentAnnouncements(id);
          this.isLoading = false;
        } else {
          // Backend'den veri gelmediyse hata göster
          this.isLoading = false;
          this.isLoading = false;
        }
      },
      error: (err) => {
        Logger.error('Duyuru detayı yüklenemedi:', err);
        this.isLoading = false;
      }
    });
  }

  loadRecentAnnouncements(currentId: number) {
    // GET /api/Announcements/latest — backend 4 adet döndürür; mevcut duyuruyu hariç tutup göster
    this.announcementService.getLatestAnnouncements().subscribe({
      next: (announcements) => {
        const filtered = announcements.filter(a => a.id !== currentId);
        this.recentAnnouncements = filtered.slice(0, 4).map(a => ({
          ...a,
          category: 'Genel',
          link: a.link || ''
        }));
      },
      error: (err) => {
        Logger.error('İlgili duyurular yüklenemedi:', err);
        this.recentAnnouncements = [];
      }
    });
  }

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - 200;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }

  copyToClipboard() {
    if (isPlatformBrowser(this.platformId)) {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        this.copyLinkSuccess = true;
        setTimeout(() => (this.copyLinkSuccess = false), 2000);
      });
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  // Metni HTML formatına çevir: \n\n paragraf, \n <br> olarak gösterilir
  formatContent(content: string): string {
    if (!content) return '';
    
    // Eğer zaten HTML formatındaysa (tag'ler varsa), olduğu gibi döndür
    if (content.includes('<') && content.includes('>')) {
      return content;
    }
    
    // HTML karakterlerini escape et
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Çift satır sonlarını paragraf olarak ayır
    const paragraphs = escaped.split(/\n\n+/);
    
    // Her paragrafı <p> etiketi içine al ve tek satır sonlarını <br> yap
    const formatted = paragraphs
      .map(para => {
        // Paragraf içindeki tek satır sonlarını <br> yap
        const withBreaks = para.replace(/\n/g, '<br>');
        // Boş paragrafları atla
        if (withBreaks.trim() === '') return '';
        return `<p>${withBreaks.trim()}</p>`;
      })
      .filter(p => p !== '')
      .join('');
    
    return formatted || escaped.replace(/\n/g, '<br>');
  }
}
