import { Component } from '@angular/core';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { VideoComponent } from '../../common/video/video.component';
import { FeedbackComponent } from '../../common/feedback/feedback.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

@Component({
    selector: 'app-team-page',
    imports: [SiteNavbarComponent, PageBannerComponent, VideoComponent, FeedbackComponent, SiteFooterComponent],
    templateUrl: './team-page.component.html',
    styleUrl: './team-page.component.scss'
})
export class TeamPageComponent {}