import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-turkey-skyline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skyline-container">
      <img 
        src="assets/turkey-skyline.png" 
        alt="Türkiye Skyline" 
        class="skyline-image"
        onerror="this.style.display='none'"
      />
    </div>
  `,
  styles: [
    `
      .skyline-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 0;
        pointer-events: none;
      }

      .skyline-image {
        width: 100%;
        height: auto;
        max-height: 500px;
        min-width: 100%;
        object-fit: cover;
        object-position: bottom center;
        opacity: 0.4;
      }

      @media (max-width: 768px) {
        .skyline-image {
          max-height: 350px;
          opacity: 0.35;
        }
      }

      @media (min-width: 1400px) {
        .skyline-image {
          max-height: 600px;
          opacity: 0.45;
        }
      }

      @media (min-width: 2560px) {
        .skyline-image {
          max-height: 700px;
          min-width: 100%;
          object-fit: cover;
          opacity: 0.45;
        }
      }
    `,
  ],
})
export class TurkeySkylineComponent {}
