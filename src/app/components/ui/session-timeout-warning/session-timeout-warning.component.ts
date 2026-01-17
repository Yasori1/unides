import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfkDetectionService } from '../../../services/afk-detection.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-session-timeout-warning',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="timeout-overlay" *ngIf="showWarning" (click)="stayLoggedIn()">
      <div class="timeout-modal" (click)="$event.stopPropagation()">
        <div class="warning-icon">
          <i class="bx bx-time-five"></i>
        </div>
        <h3>Oturum Süresi Doluyor</h3>
        <p class="countdown">
          <span class="time">{{ formatTime(remainingSeconds) }}</span>
          <span class="label">içinde çıkış yapılacak</span>
        </p>
        <p class="message">
          Uzun süredir aktif olmadınız. Devam etmek için bir tuşa basın veya butona tıklayın.
        </p>
        <div class="actions">
          <button class="stay-btn" (click)="stayLoggedIn()">
            <i class="bx bx-check"></i>
            Oturumu Devam Ettir
          </button>
          <button class="logout-btn" (click)="logout()">
            <i class="bx bx-log-out"></i>
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .timeout-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .timeout-modal {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }

    .warning-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      animation: pulse 1.5s infinite;
    }

    .warning-icon i {
      font-size: 32px;
      color: white;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    h3 {
      margin: 0 0 16px;
      font-size: 1.4rem;
      color: #1e293b;
      font-weight: 600;
    }

    .countdown {
      margin: 0 0 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .countdown .time {
      font-size: 2.5rem;
      font-weight: 700;
      color: #dc2626;
      font-family: 'Courier New', monospace;
    }

    .countdown .label {
      font-size: 0.9rem;
      color: #64748b;
    }

    .message {
      margin: 0 0 24px;
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .stay-btn {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .stay-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .logout-btn {
      background: #f1f5f9;
      color: #64748b;
    }

    .logout-btn:hover {
      background: #e2e8f0;
      color: #475569;
    }
  `]
})
export class SessionTimeoutWarningComponent implements OnInit, OnDestroy {
    showWarning = false;
    remainingSeconds = 120;
    private countdownInterval: any = null;
    private subscriptions: Subscription[] = [];

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private afkService: AfkDetectionService
    ) { }

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            // Listen for warning
            this.subscriptions.push(
                this.afkService.onWarning.subscribe((seconds) => {
                    this.remainingSeconds = seconds;
                    this.showWarning = true;
                    this.startCountdown();
                })
            );

            // Listen for warning dismissed
            this.subscriptions.push(
                this.afkService.onWarningDismissed.subscribe(() => {
                    this.hideWarning();
                })
            );

            // Listen for AFK detected (logout happened)
            this.subscriptions.push(
                this.afkService.onAfkDetected.subscribe(() => {
                    this.hideWarning();
                })
            );
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.stopCountdown();
    }

    stayLoggedIn(): void {
        // Reset the AFK timer
        this.afkService.resetTimer();
        this.hideWarning();
    }

    logout(): void {
        // Trigger manual logout
        this.hideWarning();
        // AfkService will handle the actual logout
        this.afkService.stop();
        // Navigate to home
        window.location.href = '/';
    }

    formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    private startCountdown(): void {
        this.stopCountdown();
        this.countdownInterval = setInterval(() => {
            this.remainingSeconds--;
            if (this.remainingSeconds <= 0) {
                this.stopCountdown();
            }
        }, 1000);
    }

    private stopCountdown(): void {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    private hideWarning(): void {
        this.showWarning = false;
        this.stopCountdown();
    }
}
