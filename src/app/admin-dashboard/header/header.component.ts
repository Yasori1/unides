import { NgClass, NgIf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToggleService } from './toggle.service';

@Component({
    selector: 'app-header',
    imports: [RouterLink, NgClass, NgIf],
    templateUrl: './header.component.html',
    styleUrl: './header.component.scss'
})
export class HeaderComponent {

    // Dropdown Menu
    isProfileMenuOpen = false;
    toggleProfileMenu() {
        this.isProfileMenuOpen = !this.isProfileMenuOpen;
    }
    @HostListener('document:click', ['$event'])
    handleClickOutside(event: Event) {
        const target = event.target as HTMLElement;
        if (!target.closest('.profile-menu-dropdown')) {
            this.isProfileMenuOpen = false;
        }
    }

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