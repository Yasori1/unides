import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
    selector: 'app-email-read',
    imports: [RouterLink, NgScrollbarModule],
    templateUrl: './email-read.component.html',
    styleUrl: './email-read.component.scss'
})
export class EmailReadComponent {}