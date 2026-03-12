import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface QuartzSlot {
  type: 'digit' | 'separator';
  current?: string;
  next?: string;
}

@Component({
  selector: 'app-quartz-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quartz-counter.component.html',
  styleUrls: ['./quartz-counter.component.scss'],
})
export class QuartzCounterComponent implements OnInit, OnChanges, OnDestroy {
  @Input() value: number = 0;
  @Input() label: string = '';

  slots: QuartzSlot[] = [];
  private previousValue: number = -1;
  private animFrameId: number | null = null;
  private countUpTarget: number = 0;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (this.previousValue < 0) {
      this.buildSlots(0, -1);
      this.previousValue = 0;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      const newVal = this.value;
      const oldVal = this.previousValue;

      if (oldVal <= 0 && newVal > 0) {
        // İlk gerçek veri geldi: 0'dan hedefe doğru say
        this.previousValue = newVal;
        this.startCountUp(newVal);
      } else if (oldVal >= 0 && newVal !== oldVal) {
        // Canlı güncelleme: flip animasyonu
        this.buildSlots(newVal, oldVal);
        this.previousValue = newVal;
      } else {
        this.buildSlots(newVal, -1);
        this.previousValue = newVal;
      }
    }
  }

  ngOnDestroy(): void {
    if (this.animFrameId !== null && isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  private startCountUp(targetValue: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.buildSlots(targetValue, -1);
      return;
    }

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.countUpTarget = targetValue;
    const duration = 1800;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic: hızlı başla, hedefe yaklaşırken yavaşla
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * targetValue);

      this.buildSlots(current, -1);

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        this.animFrameId = null;
        this.buildSlots(targetValue, -1);
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  private buildSlots(newValue: number, oldValue: number): void {
    const newDigits = newValue.toString().replace(/\D/g, '').split('');
    const oldDigits = (oldValue < 0 ? newValue : oldValue).toString().replace(/\D/g, '').split('');
    const len = Math.max(newDigits.length, oldDigits.length, 1);
    while (newDigits.length < len) newDigits.unshift('0');
    while (oldDigits.length < len) oldDigits.unshift('0');

    this.slots = [];
    for (let i = 0; i < len; i++) {
      if (i > 0 && (len - i) % 3 === 0) {
        this.slots.push({ type: 'separator' });
      }
      const newDigit = newDigits[i] || '0';
      const oldDigit = oldDigits[i] || '0';
      const isChange = oldValue >= 0 && oldDigit !== newDigit;
      this.slots.push({
        type: 'digit',
        current: isChange ? oldDigit : newDigit,
        next: isChange ? newDigit : undefined,
      });
    }
    this.cdr.markForCheck();

    if (oldValue >= 0) {
      this.slots.forEach((slot) => {
        if (slot.type === 'digit' && slot.next !== undefined) {
          const nextVal = slot.next;
          setTimeout(() => {
            slot.current = nextVal;
            slot.next = undefined;
            this.cdr.markForCheck();
          }, 600);
        }
      });
    }
  }
}
