import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ReminderPopupService,
  ReminderPopupListItem,
} from '../../services/reminder-popup.service';

const STORAGE_PREFIX = 'unides_reminder_popup_seen_';

@Component({
  selector: 'app-site-reminder-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './site-reminder-popup.component.html',
  styleUrls: ['./site-reminder-popup.component.scss'],
})
export class SiteReminderPopupComponent implements OnInit, OnDestroy {
  visible = false;
  item: ReminderPopupListItem | null = null;

  private bodyScrollLocked = false;
  private scrollY = 0;

  constructor(
    private reminderService: ReminderPopupService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.reminderService.getActive().subscribe({
      next: (list) => {
        const unseen = (list || []).find((n) => !localStorage.getItem(STORAGE_PREFIX + n.id));
        if (unseen) {
          this.item = unseen;
          this.visible = true;
          this.lockBodyScroll();
        }
      },
      error: () => {
        /* sessiz */
      },
    });
  }

  imageSrc(): string {
    if (!this.item?.imageUrl) return '';
    return this.reminderService.resolveImageUrl(this.item.imageUrl);
  }

  dismiss(): void {
    if (this.item) {
      try {
        localStorage.setItem(STORAGE_PREFIX + this.item.id, '1');
      } catch {
        /* quota */
      }
    }
    this.visible = false;
    this.item = null;
    this.unlockBodyScroll();
  }

  ngOnDestroy(): void {
    if (this.bodyScrollLocked) {
      this.unlockBodyScroll();
    }
  }

  /** Pop-up açıkken sayfa / arka plan kaymasın (mobil dahil). */
  private lockBodyScroll(): void {
    if (!isPlatformBrowser(this.platformId) || this.bodyScrollLocked) return;
    this.scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    this.bodyScrollLocked = true;
  }

  private unlockBodyScroll(): void {
    if (!isPlatformBrowser(this.platformId) || !this.bodyScrollLocked) return;
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('top');
    document.body.style.removeProperty('left');
    document.body.style.removeProperty('right');
    document.body.style.removeProperty('width');
    window.scrollTo(0, this.scrollY);
    this.bodyScrollLocked = false;
  }

  openLink(url: string | null | undefined): void {
    if (!url?.trim()) return;
    const u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) {
      window.open(u, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://${u}`, '_blank', 'noopener,noreferrer');
    }
  }
}
