import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { QuantityCounterComponent } from './quantity-counter/quantity-counter.component';

@Component({
    selector: 'app-cart-page',
    imports: [RouterLink, SiteNavbarComponent, PageBannerComponent, QuantityCounterComponent, SiteFooterComponent],
    templateUrl: './cart-page.component.html',
    styleUrl: './cart-page.component.scss'
})
export class CartPageComponent {}