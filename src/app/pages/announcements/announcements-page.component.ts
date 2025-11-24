import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { BlogSidebarComponent } from '../../common/blog-sidebar/blog-sidebar.component';

@Component({
  selector: 'app-announcements-page',
  imports: [
    CommonModule,
    RouterLink,
    HeaderComponent,
    PageBannerComponent,
    BlogSidebarComponent,
    FooterComponent,
  ],
  templateUrl: './announcements-page.component.html',
  styleUrls: ['./announcements-page.component.scss'],
})
export class AnnouncementsPageComponent {
  page: number;
  maxPage: number;

  announcements = [
    {
      id: 6,
      title: 'Yaz Kampı Başvuruları Açıldı!',
      except:
        'Yaz aylarında düzenlenecek olan kampımıza başvurular başladı. Detaylı bilgi için tıklayın.',
      community: 'Yazılım Topluluğu',
      date: '20 Kasım 2025',
    },
    {
      id: 7,
      title: 'Debate Tartışma Gecesi',
      except:
        '“Yapay Zeka, İnsanlığa Tehdit mi?” temasıyla perşembe akşamı merkez kampüste buluşuyoruz.',
      community: 'Debate Topluluğu',
      date: '18 Kasım 2025',
    },
    {
      id: 8,
      title: 'Sanat Sergisi Başlıyor',
      except: '25 Kasım’da kampüs galerisinde topluluk üyelerinin eserleri sergilenecek.',
      community: 'Sanat Topluluğu',
      date: '22 Kasım 2025',
    },
    {
      id: 9,
      title: 'Spor Topluluğu Turnuvası',
      except: 'Basketbol 3x3 turnuvası için takımlar aranıyor! Katılım için son günler.',
      community: 'Spor Topluluğu',
      date: '15 Kasım 2025',
    },
  ];

  isNew(dateString: string): boolean {
    const today = new Date();
    const announceDate = new Date(dateString);
    const diffTime = today.getTime() - announceDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }

  constructor(private route : ActivatedRoute) {
    this.page = parseInt(this.route.snapshot.queryParams['page'] ?? "0");
    this.maxPage = 2;
  }
}
