import { Component } from '@angular/core';
import { HeaderComponent } from '../../common/header/header.component';
import { BannerComponent } from './banner/banner.component';
import { ListingsComponent } from './listings/listings.component';
import { InstagramComponent } from '../../common/instagram/instagram.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
    selector: 'app-home-demo-three',
    imports: [HeaderComponent, BannerComponent, ListingsComponent, InstagramComponent, FooterComponent],
    templateUrl: './home-demo-three.component.html',
    styleUrl: './home-demo-three.component.scss'
})
export class HomeDemoThreeComponent {}