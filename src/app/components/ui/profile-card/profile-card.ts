import {
  Component,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  website?: string;
}

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-card.html',
  styleUrls: ['./profile-card.scss'],
})
export class ProfileCardComponent {
  @Input() name: string = 'Developer Name';
  @Input() title: string = 'Role';
  @Input() image: string = '';
  @Input() work: string = '';
  @Input() socialLinks?: SocialLinks;
}
