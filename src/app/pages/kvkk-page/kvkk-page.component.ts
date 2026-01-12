import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

@Component({
  selector: 'app-kvkk-page',
  standalone: true,
  imports: [CommonModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './kvkk-page.component.html',
  styleUrls: ['./kvkk-page.component.scss'],
})
export class KvkkPageComponent {
  heroMoveX: number = 0;
  heroMoveY: number = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - 200;
      this.heroMoveX = x / 30;
      this.heroMoveY = y / 30;
    }
  }
}
