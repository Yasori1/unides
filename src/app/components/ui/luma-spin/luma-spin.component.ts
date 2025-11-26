import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-luma-spin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="luma-loader">
      <span class="spin-shape"></span>
      <span class="spin-shape delay"></span>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
        line-height: 0;
      }
      .luma-loader {
        position: relative;
        width: 30px; /* Buton için küçültüldü (Orijinal: 65px) */
        height: 30px;
      }
      .spin-shape {
        position: absolute;
        border-radius: 50px;
        /* Buton koyu olduğu için shadow rengini beyaz (#fff) yaptım */
        box-shadow: inset 0 0 0 2px #ffffff;
        animation: loaderAnim 2.5s infinite;
      }
      .delay {
        animation-delay: -1.25s;
      }

      /* Keyframes - Boyutlara göre oransal olarak uyarlandı (30px baz alındı) */
      /* Orijinalde 65px için 35px inset kullanılıyordu (~%54). 30px için ~16px. */
      @keyframes loaderAnim {
        0% {
          inset: 0 16px 16px 0;
        }
        12.5% {
          inset: 0 16px 0 0;
        }
        25% {
          inset: 16px 16px 0 0;
        }
        37.5% {
          inset: 16px 0 0 0;
        }
        50% {
          inset: 16px 0 0 16px;
        }
        62.5% {
          inset: 0 0 0 16px;
        }
        75% {
          inset: 0 0 16px 16px;
        }
        87.5% {
          inset: 0 0 16px 0;
        }
        100% {
          inset: 0 16px 16px 0;
        }
      }
    `,
  ],
})
export class LumaSpinComponent {}
