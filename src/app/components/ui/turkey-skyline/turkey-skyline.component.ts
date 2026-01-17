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
        width: 100vw;
        height: 100%;
        min-height: 300px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .skyline-image {
        width: 100%;
        min-width: 100vw;
        height: auto;
        min-height: 100%;
        max-height: none;
        object-fit: cover;
        object-position: bottom center;
        opacity: 0.6;
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

      // Mobil: Görseli tam genişlikte göster, kenar boşluğu olmasın
      @media (max-width: 767px) {
        .skyline-container {
          align-items: flex-end;
          justify-content: center;
          height: 100%;
          bottom: 0;
          width: 100vw;
          overflow: hidden;
        }
        
        .skyline-image {
          min-width: 100vw;
          width: 100%;
          height: auto;
          min-height: 100%;
          opacity: 0.55;
          object-fit: cover;
          object-position: center bottom;
        }
      }

      @media (min-width: 1400px) {
        .skyline-image {
          max-height: none;
          opacity: 0.55;
          object-fit: cover;
        }
      }

      @media (min-width: 2560px) {
        .skyline-image {
          max-height: none;
          object-fit: cover;
          opacity: 0.55;
        }
      }
    `,
  ],
})
export class TurkeySkylineComponent { }
