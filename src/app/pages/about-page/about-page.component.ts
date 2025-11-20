import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { VideoComponent } from '../../common/video/video.component';
import { TeamComponent } from '../../common/team/team.component';
import { FunfactsComponent } from '../../common/funfacts/funfacts.component';
import { PartnersComponent } from '../../common/partners/partners.component';
import { FeedbackComponent } from '../../common/feedback/feedback.component';
import { InstagramComponent } from '../../common/instagram/instagram.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
    selector: 'app-about-page',
    imports: [HeaderComponent, PageBannerComponent, VideoComponent, TeamComponent, FunfactsComponent, PartnersComponent, FeedbackComponent, InstagramComponent, FooterComponent],
    templateUrl: './about-page.component.html',
    styleUrl: './about-page.component.scss'
})
export class AboutPageComponent {}