import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { BlogSidebarComponent } from '../../common/blog-sidebar/blog-sidebar.component';

@Component({
    selector: 'app-blog-right-sidebar-page',
    imports: [RouterLink, HeaderComponent, PageBannerComponent, BlogSidebarComponent, FooterComponent],
    templateUrl: './blog-right-sidebar-page.component.html',
    styleUrl: './blog-right-sidebar-page.component.scss'
})
export class BlogRightSidebarPageComponent {}