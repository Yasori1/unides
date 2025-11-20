import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
    selector: 'app-listings-page4',
    imports: [RouterLink, HeaderComponent, PageBannerComponent, FooterComponent],
    templateUrl: './listings-page4.component.html',
    styleUrl: './listings-page4.component.scss'
})
export class ListingsPage4Component {}