import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SafeStorage } from '../../../utils/security.utils';

@Component({
    selector: 'app-cookie-consent',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="cookie-banner" *ngIf="showBanner" [class.fade-out]="isClosing">
      <div class="cookie-content">
        <div class="cookie-icon">
          <i class="bx bx-cookie"></i>
        </div>
        <div class="cookie-text">
          <h3>Çerez Politikası</h3>
          <p>
            Deneyiminizi geliştirmek, siber güvenliği artırmak ve trafiği analiz etmek için çerezleri kullanıyoruz. 
            Sitemizi kullanarak çerez kullanımımızı kabul etmiş olursunuz.
          </p>
        </div>
        <div class="cookie-actions">
          <button class="btn-secondary" (click)="openInfo()">Bilgi Al</button>
          <button class="btn-primary" (click)="accept()">Kabul Et</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .cookie-banner {
      position: fixed;
      bottom: 24px;
      right: 24px;
      max-width: 480px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      padding: 24px;
      z-index: 9999;
      animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .cookie-banner.fade-out {
      animation: slideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .cookie-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cookie-icon {
      width: 48px;
      height: 48px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cookie-icon i {
      font-size: 28px;
      color: #3b82f6;
    }

    .cookie-text h3 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
    }

    .cookie-text p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
      color: #64748b;
    }

    .cookie-actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    .btn-primary, .btn-secondary {
      flex: 1;
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    @keyframes slideIn {
      from { transform: translateY(100px) scale(0.9); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    @keyframes slideOut {
      from { transform: translateY(0) scale(1); opacity: 1; }
      to { transform: translateY(100px) scale(0.9); opacity: 0; }
    }

    @media (max-width: 576px) {
      .cookie-banner {
        bottom: 0;
        right: 0;
        left: 0;
        max-width: 100%;
        border-radius: 20px 20px 0 0;
        padding: 20px;
      }
    }
  `]
})
export class CookieConsentComponent implements OnInit {
    showBanner = false;
    isClosing = false;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            // Check if user already accepted
            const consent = SafeStorage.get('cookie_consent');
            if (!consent) {
                // Show banner after a short delay for better UX
                setTimeout(() => {
                    this.showBanner = true;
                }, 1500);
            }
        }
    }

    accept(): void {
        this.isClosing = true;
        setTimeout(() => {
            SafeStorage.set('cookie_consent', 'accepted');
            this.showBanner = false;
        }, 400);
    }

    openInfo(): void {
        // Redirect to privacy policy or open a modal
        window.open('/privacy-policy', '_blank');
    }
}
