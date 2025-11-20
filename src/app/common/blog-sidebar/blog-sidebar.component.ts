import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-blog-sidebar',
    imports: [RouterLink],
    templateUrl: './blog-sidebar.component.html',
    styleUrl: './blog-sidebar.component.scss'
})
export class BlogSidebarComponent {}