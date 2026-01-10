import { Component } from '@angular/core';
import { ViewportScroller, CommonModule } from '@angular/common';
import { RouterOutlet, Router, Event, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  title = 'ÜNİDES - Gençlik ve Spor Bakanlığı';
  showGlobalBackground = true;

  constructor (
    private router: Router,
    private viewportScroller: ViewportScroller
  ) {
    // Router olaylarını dinle
    this.router.events.subscribe((event: Event) => {
      // Navigasyon bittiğinde (sayfa değiştiğinde)
      if (event instanceof NavigationEnd) {
        // Sayfayı en üste kaydır (Scroll to top)
        this.viewportScroller.scrollToPosition([0, 0]);

        // Dashboard sayfalarında global arka planı gizle
        // "dashboard" kelimesini içeren URL'lerde arkaplan gizlenir
        this.showGlobalBackground = !event.url.includes('dashboard');
      }
    });
  }
}