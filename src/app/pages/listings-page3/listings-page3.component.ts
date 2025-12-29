import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

@Component({
    selector: 'app-listings-page3',
    imports: [RouterLink, SiteNavbarComponent, PageBannerComponent, SiteFooterComponent],
    templateUrl: './listings-page3.component.html',
    styleUrl: './listings-page3.component.scss'
})
export class ListingsPage3Component {}