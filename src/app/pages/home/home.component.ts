import { Component } from '@angular/core';
import { BannerComponent } from './banner/banner.component';
import { ListingsComponent } from '../../common/listings/listings.component';
import { VideoComponent } from '../../common/video/video.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { HeaderComponent } from '../../common/header/header.component';
import { LatestCommunitiesComponent } from '../../common/latest-communities/latest-communities.component';
import { PartnersComponent } from '../../pages/partners/partners.component';
import { CookieNoticeComponent } from '../../components/ui/cookie-notice/cookie-notice.component';

@Component({
  selector: 'app-home',
  standalone: true, // Standalone modunu açıkça belirtiyoruz
  imports: [
    HeaderComponent,
    BannerComponent,
    LatestCommunitiesComponent,
    PartnersComponent, // <--- YENİ EKLENEN BİLEŞEN
    VideoComponent,
    FooterComponent,
    CookieNoticeComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
