import { ViewportScroller, isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, Event, NavigationEnd } from '@angular/router';
import { ChatbotWidgetComponent } from './components/chatbot/chatbot-widget.component';
import { SessionTimeoutWarningComponent } from './components/ui/session-timeout-warning/session-timeout-warning.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatbotWidgetComponent, SessionTimeoutWarningComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  title = 'ÜNİDES - Gençlik ve Spor Bakanlığı';

  constructor(
    private router: Router,
    private viewportScroller: ViewportScroller,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // 🛡️ CLICKJACKING KORUMASI
    // Uygulamanın bir iFrame içinde açılmasını engeller
    if (isPlatformBrowser(this.platformId)) {
      if (window.self !== window.top) {
        window.top!.location.href = window.self.location.href;
      }
    }
    // Router olaylarını dinle
    this.router.events.subscribe((event: Event) => {
      // Navigasyon bittiğinde (sayfa değiştiğinde)
      if (event instanceof NavigationEnd) {
        // Sayfayı en üste kaydır (Scroll to top)
        this.viewportScroller.scrollToPosition([0, 0]);
      }
    });
  }
}