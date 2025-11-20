import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
    selector: 'app-to-do-list',
    imports: [RouterLink, NgScrollbarModule],
    templateUrl: './to-do-list.component.html',
    styleUrl: './to-do-list.component.scss'
})
export class ToDoListComponent {}