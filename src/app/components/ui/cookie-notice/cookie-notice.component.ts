import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-cookie-notice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-notice.component.html',
  styleUrls: ['./cookie-notice.component.scss'],
})
export class CookieNoticeComponent implements OnInit, OnDestroy {
  visible: boolean = false;
  showPolicyModal: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // localStorage'dan cookie kabul durumunu kontrol et
      const cookieAccepted = localStorage.getItem('cookie_accepted');
      if (!cookieAccepted) {
        this.visible = true;
      }
    }
  }

  ngOnDestroy(): void {
    // Component yok edildiğinde scroll'u geri aç
    this.enableBodyScroll();
  }

  acceptCookies(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('cookie_accepted', 'true');
      this.visible = false;
    }
  }

  openPolicyModal(): void {
    this.showPolicyModal = true;
    this.disableBodyScroll();
  }

  closePolicyModal(): void {
    this.showPolicyModal = false;
    this.enableBodyScroll();
  }

  private disableBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  private enableBodyScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }
}
