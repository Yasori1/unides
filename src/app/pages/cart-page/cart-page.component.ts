import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { QuantityCounterComponent } from './quantity-counter/quantity-counter.component';

@Component({
    selector: 'app-cart-page',
    imports: [RouterLink, HeaderComponent, PageBannerComponent, QuantityCounterComponent, FooterComponent],
    templateUrl: './cart-page.component.html',
    styleUrl: './cart-page.component.scss'
})
export class CartPageComponent {}