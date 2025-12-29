import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { BlogSidebarComponent } from '../../common/blog-sidebar/blog-sidebar.component';

@Component({
    selector: 'app-blog-details-page',
    imports: [RouterLink, SiteNavbarComponent, PageBannerComponent, BlogSidebarComponent, SiteFooterComponent],
    templateUrl: './blog-details-page.component.html',
    styleUrl: './blog-details-page.component.scss'
})
export class BlogDetailsPageComponent {}