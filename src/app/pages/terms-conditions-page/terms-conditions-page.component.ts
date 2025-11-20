import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
    selector: 'app-terms-conditions-page',
    imports: [HeaderComponent, PageBannerComponent, FooterComponent],
    templateUrl: './terms-conditions-page.component.html',
    styleUrl: './terms-conditions-page.component.scss'
})
export class TermsConditionsPageComponent {}