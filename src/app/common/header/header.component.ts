import { NgClass, NgIf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { HeadroomModule } from '@ctrl/ngx-headroom';

@Component({
    selector: 'app-header',
    imports: [RouterLink, RouterLinkActive, NgClass, CarouselModule, HeadroomModule, NgIf],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {

    constructor (
        public router: Router
    ) {}

    // Language Dropdown Menu
    languageClassApplied = false;
    languageToggleClass() {
        this.languageClassApplied = !this.languageClassApplied;
    }

	// Responsive Menu Trigger
    classApplied = false;
    toggleClass() {
        this.classApplied = !this.classApplied;
    }

	// Search Overlay
    searchClassApplied = false;
    searchToggleClass() {
        this.searchClassApplied = !this.searchClassApplied;
    }

    // Owl Carousel
    partnersSlides: OwlOptions = {
		nav: false,
		loop: true,
		dots: false,
		autoplay: true,
		smartSpeed: 500,
		autoplayHoverPause: true,
		navText: [
			"<i class='flaticon-left'></i>",
			"<i class='flaticon-right-arrow'></i>"
		],
        responsive: {
			0: {
				items: 2
			},
			515: {
				items: 3
			},
			695: {
				items: 4
			},
			935: {
				items: 5
			},
			1115: {
				items: 7
			}
		}
    }

	// Responsive Navbar Accordion
    openSectionIndex: number = -1;
    openSectionIndex2: number = -1;
    openSectionIndex3: number = -1;
    toggleSection(index: number): void {
        if (this.openSectionIndex === index) {
            this.openSectionIndex = -1;
        } else {
            this.openSectionIndex = index;
        }
    }
    toggleSection2(index: number): void {
        if (this.openSectionIndex2 === index) {
            this.openSectionIndex2 = -1;
        } else {
            this.openSectionIndex2 = index;
        }
    }
    toggleSection3(index: number): void {
        if (this.openSectionIndex3 === index) {
            this.openSectionIndex3 = -1;
        } else {
            this.openSectionIndex3 = index;
        }
    }
    isSectionOpen(index: number): boolean {
        return this.openSectionIndex === index;
    }
    isSectionOpen2(index: number): boolean {
        return this.openSectionIndex2 === index;
    }
    isSectionOpen3(index: number): boolean {
        return this.openSectionIndex3 === index;
    }

    // Navbar Sticky
    isSticky: boolean = false;
    @HostListener('window:scroll', [])
    checkScroll() {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollPosition >= 50) {
            this.isSticky = true;
        } else {
            this.isSticky = false;
        }
    }

}
