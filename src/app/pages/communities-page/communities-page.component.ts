import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FaqComponent } from '../../common/faq/faq.component';
import { PartnersComponent } from '../../common/partners/partners.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { LatestCommunitiesComponent } from '../../common/latest-communities/latest-communities.component';

@Component({
    selector: 'app-communities-page',
    imports: [HeaderComponent, LatestCommunitiesComponent, FooterComponent],
    templateUrl: './communities-page.component.html',
    styleUrl: './communities-page.component.scss'
})
export class CommunitiesPageComponent {}
