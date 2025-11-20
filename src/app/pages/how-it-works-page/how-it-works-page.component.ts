import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { VideoComponent } from '../../common/video/video.component';
import { PartnersComponent } from '../../common/partners/partners.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';

@Component({
    selector: 'app-how-it-works-page',
    imports: [HeaderComponent, PageBannerComponent, VideoComponent, PartnersComponent, FooterComponent],
    templateUrl: './how-it-works-page.component.html',
    styleUrl: './how-it-works-page.component.scss'
})
export class HowItWorksPageComponent {}