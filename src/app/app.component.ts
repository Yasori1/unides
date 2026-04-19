import { Component } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { RouterOutlet, Router, Event, NavigationEnd } from '@angular/router';
import { ChatbotWidgetComponent } from './components/chatbot/chatbot-widget.component';
import { SiteReminderPopupComponent } from './components/site-reminder-popup/site-reminder-popup.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatbotWidgetComponent, SiteReminderPopupComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  title = 'ÜNİDES - Gençlik ve Spor Bakanlığı';

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
      }
    });
  }
}