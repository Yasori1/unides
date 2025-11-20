import { Component } from '@angular/core';
import { BannerComponent } from './banner/banner.component';
import { ListingsComponent } from '../../common/listings/listings.component';
import { DestinationsComponent } from '../../common/destinations/destinations.component';
import { HowItWorksComponent } from '../../common/how-it-works/how-it-works.component';
import { PlacesComponent } from '../../common/places/places.component';
import { VideoComponent } from '../../common/video/video.component';
import { FeedbackComponent } from '../../common/feedback/feedback.component';
import { DownloadAppComponent } from '../../common/download-app/download-app.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { HeaderComponent } from '../../common/header/header.component';

@Component({
    selector: 'app-home-demo-one',
    imports: [HeaderComponent, BannerComponent, ListingsComponent, DestinationsComponent, HowItWorksComponent, PlacesComponent, VideoComponent, FeedbackComponent, DownloadAppComponent, FooterComponent],
    templateUrl: './home-demo-one.component.html',
    styleUrl: './home-demo-one.component.scss'
})
export class HomeDemoOneComponent {}
