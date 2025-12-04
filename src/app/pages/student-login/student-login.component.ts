import { Component } from '@angular/core';
import { BannerComponent } from '../home/banner/banner.component';
import { DestinationsComponent } from '../../common/destinations/destinations.component';
import { HowItWorksComponent } from '../../common/how-it-works/how-it-works.component';
import { PlacesComponent } from '../../common/places/places.component';
import { VideoComponent } from '../../common/video/video.component';
import { FeedbackComponent } from '../../common/feedback/feedback.component';
import { DownloadAppComponent } from '../../common/download-app/download-app.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { HeaderComponent } from '../../common/header/header.component';
import { LatestCommunitiesComponent } from '../../common/latest-communities/latest-communities.component';
import { PartnersComponent } from '../partners/partners.component';
import { CookieNoticeComponent } from '../../components/ui/cookie-notice/cookie-notice.component';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [
    HeaderComponent,
    BannerComponent,
    LatestCommunitiesComponent,
    PartnersComponent,
    DestinationsComponent,
    HowItWorksComponent,
    PlacesComponent,
    VideoComponent,
    FeedbackComponent,
    DownloadAppComponent,
    FooterComponent,
    CookieNoticeComponent,
  ],
  templateUrl: './student-login.component.html',
  styleUrl: './student-login.component.scss',
})
export class StudentLoginComponent {}

