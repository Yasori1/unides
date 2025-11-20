import { NgIf } from '@angular/common';
import { Component } from '@angular/core';

@Component({
    selector: 'app-video',
    imports: [NgIf],
    templateUrl: './video.component.html',
    styleUrl: './video.component.scss'
})
export class VideoComponent {

    // Video Popup
    isOpen = false;
    openPopup(): void {
        this.isOpen = true;
    }
    closePopup(): void {
        this.isOpen = false;
    }

}