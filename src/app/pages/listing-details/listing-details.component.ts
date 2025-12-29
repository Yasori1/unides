import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { QuantityCounterComponent } from './quantity-counter/quantity-counter.component';

@Component({
    selector: 'app-listing-details',
    imports: [RouterLink, CarouselModule, QuantityCounterComponent, SiteNavbarComponent, PageBannerComponent, SiteFooterComponent],
    templateUrl: './listing-details.component.html',
    styleUrl: './listing-details.component.scss'
})
export class ListingDetailsComponent {

    // Owl Carousel
    listingDetailsImagesSlides: OwlOptions = {
        items: 1,
		nav: true,
		loop: true,
		dots: false,
		autoplay: true,
		smartSpeed: 500,
		animateIn: 'fadeIn',
		animateOut: 'fadeOut',
		autoplayHoverPause: true,
		navText: [
			"<i class='flaticon-left'></i>",
			"<i class='flaticon-right'></i>"
		]
    }

}