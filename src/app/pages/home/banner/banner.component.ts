import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Spline viewer etiketini tanimasi icin gerekli
})
export class BannerComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // SSR sırasında document kullanma, sadece browser'da çalıştır
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Spline Viewer scriptini dinamik olarak yukluyoruz
    // Bu islem React'teki import Spline mantiginin Angular karsiligidir.
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js';
    document.head.appendChild(script);
  }
}
