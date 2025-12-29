import { Component } from '@angular/core';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { VideoComponent } from '../../common/video/video.component';
import { PartnersComponent } from '../../common/partners/partners.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';

@Component({
    selector: 'app-how-it-works-page',
    imports: [SiteNavbarComponent, PageBannerComponent, VideoComponent, PartnersComponent, SiteFooterComponent],
    templateUrl: './how-it-works-page.component.html',
    styleUrl: './how-it-works-page.component.scss'
})
export class HowItWorksPageComponent {}