import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { NgStyle } from '@angular/common';

@Component({
    selector: 'app-page-banner',
    imports: [NgStyle],
    templateUrl: './page-banner.component.html',
    styleUrl: './page-banner.component.scss'
})
export class PageBannerComponent {

    constructor (
        public router: Router
    ) {}

    @Input() pageTitle: string = '';
    @Input() backgroundImage: string = '';

}