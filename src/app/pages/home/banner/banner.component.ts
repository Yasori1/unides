import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Spline viewer etiketini tanimasi icin gerekli
})
export class BannerComponent implements OnInit {
  ngOnInit(): void {
    // Spline Viewer scriptini dinamik olarak yukluyoruz
    // Bu islem React'teki import Spline mantiginin Angular karsiligidir.
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.9.59/build/spline-viewer.js';
    document.head.appendChild(script);
  }
}
