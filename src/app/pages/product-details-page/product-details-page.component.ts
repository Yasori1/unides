import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { NgClass } from '@angular/common';
import { QuantityCounterComponent } from './quantity-counter/quantity-counter.component';

@Component({
    selector: 'app-product-details-page',
    imports: [RouterLink, NgClass, QuantityCounterComponent, HeaderComponent, PageBannerComponent, FooterComponent],
    templateUrl: './product-details-page.component.html',
    styleUrl: './product-details-page.component.scss'
})
export class ProductDetailsPageComponent {

    // Accordion
    openSectionIndex: number = 0;
    toggleSection(index: number): void {
        if (this.openSectionIndex === index) {
            this.openSectionIndex = -1;
        } else {
            this.openSectionIndex = index;
        }
    }
    isSectionOpen(index: number): boolean {
        return this.openSectionIndex === index;
    }

}