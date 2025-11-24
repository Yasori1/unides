import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService, Project } from '../../services/event.services';

@Component({
  selector: 'app-swipe-stack',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './swipe-stack.component.html',
  styleUrls: ['./swipe-stack.component.scss'],
})
export class SwipeStackComponent implements OnInit {
  @Input() cards: Project[] = [];
  @Output() requestMore = new EventEmitter<void>(); // Parent'a "daha fazla veri ver" sinyali

  isDragging = false;
  startX = 0;
  currentX = 0;
  rotation = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  // --- Mouse / Touch Başlangıç ---
  startDrag(event: MouseEvent | TouchEvent) {
    this.isDragging = true;
    this.startX = this.getClientX(event);
  }

  // --- Sürükleme Anı ---
  onDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return;

    // Dokunmatikte sayfa kaymasını engellemek için:
    // event.preventDefault();

    this.currentX = this.getClientX(event) - this.startX;
    this.rotation = this.currentX * 0.1;
  }

  // --- Bırakma Anı ---
  endDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;

    const threshold = 150;

    if (this.currentX > threshold) {
      this.swipeRight();
    } else if (this.currentX < -threshold) {
      this.swipeLeft();
    } else {
      this.resetCard();
    }
  }

  swipeRight() {
    const card = this.cards[0];
    setTimeout(() => {
      this.cards.shift();
      this.resetState();
      alert(
        `${card.title} etkinliğine katılmak istiyorsunuz! Kayıt sayfasına yönlendiriliyorsunuz...`
      );
    }, 200);
  }

  swipeLeft() {
    setTimeout(() => {
      this.cards.shift();
      this.resetState();
    }, 200);
  }

  resetCard() {
    this.currentX = 0;
    this.rotation = 0;
  }

  resetState() {
    this.currentX = 0;
    this.rotation = 0;
    this.startX = 0;
  }

  getClientX(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  }

  // Yenile Butonu Tetikleyicisi
  onRefreshClick() {
    this.requestMore.emit();
  }

  getCardStyle(index: number) {
    if (index === 0) {
      return {
        transform: `translateX(${this.currentX}px) rotate(${this.rotation}deg)`,
        transition: this.isDragging ? 'none' : 'transform 0.3s ease',
        zIndex: 100,
      };
    }
    const scale = 1 - index * 0.05;
    const translateY = index * 15;
    return {
      transform: `scale(${scale}) translateY(${translateY}px)`,
      zIndex: 100 - index,
      opacity: 1 - index * 0.2,
    };
  }
}
