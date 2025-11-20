import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
    selector: 'app-shop-page',
    imports: [RouterLink, HeaderComponent, PageBannerComponent, FooterComponent],
    templateUrl: './shop-page.component.html',
    styleUrl: './shop-page.component.scss'
})
export class ShopPageComponent {}