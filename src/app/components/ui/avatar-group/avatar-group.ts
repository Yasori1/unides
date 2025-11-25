import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AvatarUser {
  name: string;
  role: string;
  image: string;
}

@Component({
  selector: 'app-avatar-group',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-group.html',
  styleUrls: ['./avatar-group.scss'],
})
export class AvatarGroupComponent {
  @Input() users: AvatarUser[] = [];
  @Input() size: number = 60; // Avatar boyutu
  @Input() overlap: number = -15; // İç içe geçme miktarı
  @Input() variant: 'uniform' | 'centered' = 'uniform'; // Dizilim tipi

  hoveredIndex: number | null = null;

  get containerStyle() {
    return {
      gap: `${this.overlap}px`,
    };
  }

  getAvatarStyle(index: number) {
    const isHovered = this.hoveredIndex === index;
    const isCenter = this.variant === 'centered' && index === Math.floor(this.users.length / 2);

    // Centered modunda ortadaki büyük durur
    let currentSize = this.size;
    if (this.variant === 'centered' && isCenter) currentSize += 15;

    return {
      width: `${currentSize}px`,
      height: `${currentSize}px`,
      zIndex: isHovered ? 100 : isCenter ? 50 : this.users.length - index, // Hoverda en üste çıkar
      transform: isHovered ? 'scale(1.15) translateY(-5px)' : 'scale(1) translateY(0)',
    };
  }
}
