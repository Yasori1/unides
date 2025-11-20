import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-my-listings',
    imports: [RouterLink, NgClass, NgIf],
    templateUrl: './my-listings.component.html',
    styleUrl: './my-listings.component.scss'
})
export class MyListingsComponent {

	// Tabs
    currentTab = 'tab1';
    switchTab(event: MouseEvent, tab: string) {
        event.preventDefault();
        this.currentTab = tab;
    }

}