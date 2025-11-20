import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
    selector: 'app-emails',
    imports: [RouterLink, NgScrollbarModule],
    templateUrl: './emails.component.html',
    styleUrl: './emails.component.scss'
})
export class EmailsComponent {}