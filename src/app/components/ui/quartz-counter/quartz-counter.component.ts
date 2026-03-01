import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class QuartzCounterComponent implements OnInit, OnChanges {
  @Input() value: number = 0;
  @Input() label: string = '';

  slots: QuartzSlot[] = [];
  private previousValue: number = -1;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.buildSlots(this.value, -1);
    this.previousValue = this.value;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      const newVal = this.value;
      const oldVal = this.previousValue;
      this.buildSlots(newVal, oldVal);
      this.previousValue = newVal;
    }
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
