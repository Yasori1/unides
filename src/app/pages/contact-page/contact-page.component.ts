import {
  Component,
  Inject,
  PLATFORM_ID,
  OnInit,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { Logger } from '../../utils/logger.util';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, SiteNavbarComponent, SiteFooterComponent, FormsModule],
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.scss'],
})
export class ContactPageComponent implements OnInit, AfterViewInit {
  heroMoveX = 0;
  heroMoveY = 0;
  message: string = '';
  messageLength: number = 0;

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    Logger.log('İletişim sayfası yüklendi.');
  }

  ngAfterViewInit() {
    // Scroll animasyonlarını tetikleyen Observer
    if (isPlatformBrowser(this.platformId)) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target as HTMLElement;
              target.classList.add('reveal-active');
              revealObserver.unobserve(target);
            }
          });
        },
        { threshold: 0.15 }
      );

      this.animItems.forEach((item) => revealObserver.observe(item.nativeElement));
    }
  }

  // Hero bölümündeki blob'un mouse ile hareketi
  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }

  // 3D Kart Tilt Efekti
  cardTilt(event: MouseEvent, cardElement: HTMLElement) {
    const rect = cardElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Dönüş açılarını hesapla
    const rotateX = ((y - centerY) / centerY) * -10; // -10 derece max tilt
    const rotateY = ((x - centerX) / centerX) * 10;

    cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }

  // Karttan çıkınca sıfırla
  cardReset(cardElement: HTMLElement) {
    cardElement.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
  }

  onMessageInput() {
    this.messageLength = this.message.length;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    alert('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
  }
}
