import { Component } from '@angular/core';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { TrendingListingsComponent } from '../../common/trending-listings/trending-listings.component';
import { PopularListingsComponent } from '../../common/popular-listings/popular-listings.component';
import { RecentListingsComponent } from '../../common/recent-listings/recent-listings.component';

@Component({
    selector: 'app-listings-page5',
    imports: [SiteNavbarComponent, PageBannerComponent, TrendingListingsComponent, PopularListingsComponent, RecentListingsComponent, SiteFooterComponent],
    templateUrl: './listings-page5.component.html',
    styleUrl: './listings-page5.component.scss'
})
export class ListingsPage5Component {}