import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
    selector: 'app-messages',
    imports: [RouterLink, NgScrollbarModule],
    templateUrl: './messages.component.html',
    styleUrl: './messages.component.scss'
})
export class MessagesComponent {}