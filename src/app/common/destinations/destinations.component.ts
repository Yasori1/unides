import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

@Component({
    selector: 'app-destinations',
    imports: [RouterLink, NgClass, NgIf],
    templateUrl: './destinations.component.html',
    styleUrl: './destinations.component.scss'
})
export class DestinationsComponent {

    constructor (
        public router: Router
    ) {}

}