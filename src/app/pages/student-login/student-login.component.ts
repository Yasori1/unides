import { Component } from '@angular/core';
import { BannerComponent } from '../home/banner/banner.component';
import { VideoComponent } from '../../common/video/video.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { LatestCommunitiesComponent } from '../../common/latest-communities/latest-communities.component';
import { PartnersComponent } from '../partners/partners.component';
import { CookieNoticeComponent } from '../../components/ui/cookie-notice/cookie-notice.component';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [
    SiteNavbarComponent,
    BannerComponent,
    LatestCommunitiesComponent,
    PartnersComponent,
    VideoComponent,
    SiteFooterComponent,
    CookieNoticeComponent,
  ],
  templateUrl: './student-login.component.html',
  styleUrl: './student-login.component.scss',
})
export class StudentLoginComponent {}

