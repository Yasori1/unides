import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-bookmarks',
    imports: [RouterLink],
    templateUrl: './bookmarks.component.html',
    styleUrl: './bookmarks.component.scss'
})
export class BookmarksComponent {}