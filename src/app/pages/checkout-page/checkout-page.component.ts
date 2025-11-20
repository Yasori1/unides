import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
    selector: 'app-checkout-page',
    imports: [RouterLink, HeaderComponent, PageBannerComponent, FooterComponent],
    templateUrl: './checkout-page.component.html',
    styleUrl: './checkout-page.component.scss'
})
export class CheckoutPageComponent {}