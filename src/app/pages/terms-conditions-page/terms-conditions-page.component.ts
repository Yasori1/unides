import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

@Component({
  selector: 'app-terms-conditions-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './terms-conditions-page.component.html',
  styleUrls: ['./terms-conditions-page.component.scss'],
})
export class TermsConditionsPageComponent {
  heroMoveX = 0;
  heroMoveY = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }
}
