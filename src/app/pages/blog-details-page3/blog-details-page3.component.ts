import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { BlogSidebarComponent } from '../../common/blog-sidebar/blog-sidebar.component';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';

@Component({
    selector: 'app-blog-details-page3',
    imports: [RouterLink, HeaderComponent, PageBannerComponent, BlogSidebarComponent, FooterComponent, CarouselModule],
    templateUrl: './blog-details-page3.component.html',
    styleUrl: './blog-details-page3.component.scss'
})
export class BlogDetailsPage3Component {

    // Owl Carousel
    blogDetailsImagesSlides: OwlOptions = {
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