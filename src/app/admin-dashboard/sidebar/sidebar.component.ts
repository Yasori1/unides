import { Component } from '@angular/core';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ToggleService } from '../header/toggle.service';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-sidebar',
    imports: [RouterLink, NgClass, RouterLinkActive, NgScrollbarModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

    isToggled = false;

    constructor(
        private toggleService: ToggleService
    ) {
        this.toggleService.isToggled$.subscribe(isToggled => {
            this.isToggled = isToggled;
        });
    }

    toggle() {
        this.toggleService.toggle();
    }

}