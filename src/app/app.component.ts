import { Component } from '@angular/core';
import { ViewportScroller } from '@angular/common';
<<<<<<< Updated upstream
import { RouterOutlet, Router, Event, NavigationEnd } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
=======
import { RouterOutlet, Router, Event, NavigationEnd, ChildrenOutletContexts } from '@angular/router';
import { ChatbotWidgetComponent } from './components/chatbot/chatbot-widget.component';
import { slideInAnimation } from './animations/route-animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatbotWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [slideInAnimation]
>>>>>>> Stashed changes
})
export class AppComponent {

    title = 'Louise - Directory Listing Angular 19 Template + Admin Panel';

<<<<<<< Updated upstream
    constructor (
        private router: Router,
        private viewportScroller: ViewportScroller
    ) {
        this.router.events.subscribe((event: Event) => {
            if (event instanceof NavigationEnd) {
                // Scroll to the top after each navigation end
                this.viewportScroller.scrollToPosition([0, 0]);
            }
        });
    }

}
=======
  constructor (
    private router: Router,
    private viewportScroller: ViewportScroller,
    private contexts: ChildrenOutletContexts
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

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
}
>>>>>>> Stashed changes
