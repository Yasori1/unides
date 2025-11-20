import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

@Component({
    selector: 'app-categories',
    imports: [RouterLink, NgIf, NgClass],
    templateUrl: './categories.component.html',
    styleUrl: './categories.component.scss'
})
export class CategoriesComponent {

    constructor (
        public router: Router
    ) {}

    // Category Item
    categoryItem = [
        {
            icon: 'bx-shopping-bag',
            title: 'Shops',
            listingItem: '60',
            detailsLinkURL: 'listings-2',
            image: 'images/categories/img1.jpg'
        },
        {
            icon: 'bx-bed',
            title: 'Hotels',
            listingItem: '21',
            detailsLinkURL: 'listings-2',
            image: 'images/categories/img2.jpg'
        },
        {
            icon: 'bx-drink',
            title: 'Restaurant',
            listingItem: '58',
            detailsLinkURL: 'listings-2',
            image: 'images/categories/img3.jpg'
        },
        {
            icon: 'bx-dumbbell',
            title: 'Fitness',
            listingItem: '99',
            detailsLinkURL: 'listings-2',
            image: 'images/categories/img4.jpg'
        },
        {
            icon: 'bx-calendar-star',
            title: 'Events',
            listingItem: '21',
            detailsLinkURL: 'listings-2',
            image: 'images/categories/img5.jpg'
        },
        {
            icon: 'bx-walk',
            title: 'Services',
            listingItem: '49',
            detailsLinkURL: 'listings-2',
            image: 'images/categories/img6.jpg'
        },
        {
            icon: 'bx-building-house',
            title: 'Hospital',
            listingItem: '21',
            detailsLinkURL: 'listings-2',
            image: 'images/categories/img7.jpg'
        },
        {
            icon: 'bx-cog',
            title: 'Others',
            listingItem: '12',
            detailsLinkURL: 'listings-2',
            image: 'images/categories/img8.jpg'
        }
    ]

}