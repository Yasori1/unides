import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-turkey-skyline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skyline-container">
      <!-- Turkey skyline image removed to prevent 404 errors -->
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
        object-fit: contain;
        object-position: bottom center;
        opacity: 0.4;
      }

      // Tablet: Arka plan görselini optimize et
      @media (min-width: 768px) and (max-width: 1024px) {
        .skyline-image {
          max-height: 400px;
          opacity: 0.3;
          object-fit: contain;
          object-position: center bottom;
        }
      }

      // Mobil: Görseli alt kısma sabitle, küçült
      @media (max-width: 767px) {
        .skyline-container {
          align-items: flex-end;
          justify-content: center;
          height: 50%;
          bottom: 0;
        }
        
        .skyline-image {
          max-height: 200px;
          opacity: 0.25;
          object-fit: contain;
          object-position: center bottom;
          width: 100%;
        }
      }

      @media (min-width: 1400px) {
        .skyline-image {
          max-height: 600px;
          opacity: 0.45;
          object-fit: contain;
        }
      }

      @media (min-width: 2560px) {
        .skyline-image {
          max-height: 700px;
          object-fit: contain;
          opacity: 0.45;
        }
      }
    `,
  ],
})
export class TurkeySkylineComponent {}
