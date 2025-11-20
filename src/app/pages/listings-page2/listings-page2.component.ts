import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
    selector: 'app-listings-page2',
    imports: [RouterLink, HeaderComponent, PageBannerComponent, FooterComponent],
    templateUrl: './listings-page2.component.html',
    styleUrl: './listings-page2.component.scss'
})
export class ListingsPage2Component {}