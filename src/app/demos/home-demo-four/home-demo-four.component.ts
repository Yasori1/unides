import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { BannerComponent } from './banner/banner.component';
import { CategoriesComponent } from '../../common/categories/categories.component';
import { HowItWorksComponent } from '../../common/how-it-works/how-it-works.component';
import { DestinationsComponent } from '../../common/destinations/destinations.component';
import { DownloadAppComponent } from '../../common/download-app/download-app.component';
import { BlogComponent } from '../../common/blog/blog.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { LatestListingsComponent } from '../../common/latest-listings/latest-listings.component';
import { ListingsComponent } from '../../common/listings/listings.component';

@Component({
    selector: 'app-home-demo-four',
    imports: [HeaderComponent, BannerComponent, LatestListingsComponent, CategoriesComponent, ListingsComponent, HowItWorksComponent, DestinationsComponent, DownloadAppComponent, BlogComponent, FooterComponent],
    templateUrl: './home-demo-four.component.html',
    styleUrl: './home-demo-four.component.scss'
})
export class HomeDemoFourComponent {}