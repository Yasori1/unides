import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FaqComponent } from '../../common/faq/faq.component';
import { PartnersComponent } from '../../common/partners/partners.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
    selector: 'app-faq-page',
    imports: [HeaderComponent, PageBannerComponent, FaqComponent, PartnersComponent, FooterComponent],
    templateUrl: './faq-page.component.html',
    styleUrl: './faq-page.component.scss'
})
export class FaqPageComponent {}