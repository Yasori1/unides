import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

@Component({
    selector: 'app-checkout-page',
    imports: [RouterLink, SiteNavbarComponent, PageBannerComponent, SiteFooterComponent],
    templateUrl: './checkout-page.component.html',
    styleUrl: './checkout-page.component.scss'
})
export class CheckoutPageComponent {}