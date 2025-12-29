import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

@Component({
    selector: 'app-shop-page',
    imports: [RouterLink, SiteNavbarComponent, PageBannerComponent, SiteFooterComponent],
    templateUrl: './shop-page.component.html',
    styleUrl: './shop-page.component.scss'
})
export class ShopPageComponent {}