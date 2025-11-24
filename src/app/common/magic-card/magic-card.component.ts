import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService, Project } from '../../services/event.services';

@Component({
  selector: 'app-magic-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './magic-card.component.html',
  styleUrls: ['./magic-card.component.scss'],
})
export class MagicCardComponent {
  @Input() project!: Project;
  @ViewChild('card', { static: true }) cardRef!: ElementRef<HTMLDivElement>;

  mouseX = 0;
  mouseY = 0;

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    const card = this.cardRef.nativeElement;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    // Tilt Effect (Hafif Eğim)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5; // -5 derece max eğim
    const rotateY = ((x - centerX) / centerX) * 5;

    card.style.setProperty('--rotate-x', `${rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    const card = this.cardRef.nativeElement;
    // Mouse gidince kartı düzelt
    card.style.setProperty('--rotate-x', `0deg`);
    card.style.setProperty('--rotate-y', `0deg`);
  }
}
