import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { BlogSidebarComponent } from '../../common/blog-sidebar/blog-sidebar.component';

@Component({
    selector: 'app-blog-left-sidebar-page',
    imports: [RouterLink, HeaderComponent, PageBannerComponent, BlogSidebarComponent, FooterComponent],
    templateUrl: './blog-left-sidebar-page.component.html',
    styleUrl: './blog-left-sidebar-page.component.scss'
})
export class BlogLeftSidebarPageComponent {}