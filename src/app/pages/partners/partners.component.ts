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
  // Logo listesi (Şimdilik örnek SVG linkleri, ileride kendi assetlerinizi koyabilirsiniz)
  logos = [
    { src: 'https://svgl.app/library/nvidia-wordmark-light.svg', alt: 'Nvidia' },
    { src: 'https://svgl.app/library/supabase_wordmark_light.svg', alt: 'Supabase' },
    { src: 'https://svgl.app/library/openai_wordmark_light.svg', alt: 'OpenAI' },
    { src: 'https://svgl.app/library/turso-wordmark-light.svg', alt: 'Turso' },
    { src: 'https://svgl.app/library/vercel_wordmark.svg', alt: 'Vercel' },
    { src: 'https://svgl.app/library/github_wordmark_light.svg', alt: 'GitHub' },
    { src: 'https://svgl.app/library/claude-ai-wordmark-icon_light.svg', alt: 'Claude AI' },
    { src: 'https://svgl.app/library/clerk-wordmark-light.svg', alt: 'Clerk' },
  ];
}
