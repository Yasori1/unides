import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { BannerComponent } from './banner/banner.component';
import { CategoriesComponent } from '../../common/categories/categories.component';
import { DestinationsComponent } from '../../common/destinations/destinations.component';
import { TrendingListingsComponent } from '../../common/trending-listings/trending-listings.component';
import { PopularListingsComponent } from '../../common/popular-listings/popular-listings.component';
import { RecentListingsComponent } from '../../common/recent-listings/recent-listings.component';
import { HowItWorksComponent } from '../../common/how-it-works/how-it-works.component';
import { FeedbackComponent } from '../../common/feedback/feedback.component';
import { PartnersComponent } from '../../common/partners/partners.component';
import { BlogComponent } from '../../common/blog/blog.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
    selector: 'app-home-demo-two',
    imports: [HeaderComponent, BannerComponent, CategoriesComponent, TrendingListingsComponent, PopularListingsComponent, RecentListingsComponent, DestinationsComponent, HowItWorksComponent, FeedbackComponent, PartnersComponent, BlogComponent, FooterComponent],
    templateUrl: './home-demo-two.component.html',
    styleUrl: './home-demo-two.component.scss'
})
export class HomeDemoTwoComponent {}