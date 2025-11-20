import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';

@Component({
    selector: 'app-listings',
    imports: [RouterLink, CarouselModule, NgClass, NgIf],
    templateUrl: './listings.component.html',
    styleUrl: './listings.component.scss'
})
export class ListingsComponent {

	constructor (
        public router: Router
    ) {}

	// Owl Carousel
    listingsSlides: OwlOptions = {
		nav: false,
		loop: true,
		margin: 25,
		dots: true,
		autoplay: true,
		smartSpeed: 500,
		autoplayHoverPause: true,
		navText: [
			"<i class='flaticon-left'></i>",
			"<i class='flaticon-right-arrow'></i>"
		],
        responsive: {
			0: {
				items: 1
			},
			515: {
				items: 1
			},
			695: {
				items: 1
			},
			935: {
				items: 2
			},
			1115: {
				items: 3
			}
		}
    }

	// Tabs
    currentTab = 'tab1';
    switchTab(event: MouseEvent, tab: string) {
        event.preventDefault();
        this.currentTab = tab;
    }

}