import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { VideoComponent } from '../../common/video/video.component';
import { FeedbackComponent } from '../../common/feedback/feedback.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
    selector: 'app-team-page',
    imports: [HeaderComponent, PageBannerComponent, VideoComponent, FeedbackComponent, FooterComponent],
    templateUrl: './team-page.component.html',
    styleUrl: './team-page.component.scss'
})
export class TeamPageComponent {}