import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partners.component.html',
  styleUrls: ['./partners.component.scss'],
})
export class PartnersComponent {
  // Güncellenmiş Logo Listesi
  logos = [
    { src: 'images/logos/itü.jpg', alt: 'Nvidia' },
    { src: 'images/logos/odtü.jpg', alt: 'Supabase' },
    { src: 'images/logos/bogazici.png', alt: 'OpenAI' },
    { src: 'images/logos/ytü.png', alt: 'Turso' },
    { src: 'images/logos/hacettepe.png', alt: 'Vercel' },
    { src: 'images/logos/ege.png', alt: 'GitHub' },
    { src: 'images/logos/marmara.png', alt: 'Claude AI' },
    { src: 'images/logos/koç.png', alt: 'Clerk' },
  ];
}
