import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { TrendingListingsComponent } from '../../common/trending-listings/trending-listings.component';
import { PopularListingsComponent } from '../../common/popular-listings/popular-listings.component';
import { RecentListingsComponent } from '../../common/recent-listings/recent-listings.component';

@Component({
    selector: 'app-listings-page5',
    imports: [HeaderComponent, PageBannerComponent, TrendingListingsComponent, PopularListingsComponent, RecentListingsComponent, FooterComponent],
    templateUrl: './listings-page5.component.html',
    styleUrl: './listings-page5.component.scss'
})
export class ListingsPage5Component {}