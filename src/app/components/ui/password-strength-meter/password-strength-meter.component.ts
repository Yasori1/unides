import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { checkPasswordStrength, PasswordStrength } from '../../../utils/password-strength.utils';

@Component({
  selector: 'app-password-strength-meter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="password-strength" *ngIf="password">
      <!-- Strength Bar -->
      <div class="strength-bar-container">
        <div class="strength-bar">
          <div 
            class="strength-fill" 
            [style.width.%]="(strength.score / 4) * 100"
            [style.background-color]="strength.color"
          ></div>
        </div>
        <span class="strength-label" [style.color]="strength.color">
          {{ strength.label }}
        </span>
      </div>

      <!-- Feedback -->
      <div class="feedback" *ngIf="showFeedback && strength.feedback.length > 0">
        <ul>
          <li *ngFor="let item of strength.feedback">
            <i class="bx bx-x-circle"></i>
            {{ item }}
          </li>
        </ul>
      </div>

      <!-- Requirements Met -->
      <div class="requirements" *ngIf="showRequirements">
        <div class="requirement" [class.met]="hasMinLength">
          <i [class]="hasMinLength ? 'bx bx-check-circle' : 'bx bx-circle'"></i>
          En az 8 karakter
        </div>
        <div class="requirement" [class.met]="hasUppercase">
          <i [class]="hasUppercase ? 'bx bx-check-circle' : 'bx bx-circle'"></i>
          Büyük harf
        </div>
        <div class="requirement" [class.met]="hasLowercase">
          <i [class]="hasLowercase ? 'bx bx-check-circle' : 'bx bx-circle'"></i>
          Küçük harf
        </div>
        <div class="requirement" [class.met]="hasNumber">
          <i [class]="hasNumber ? 'bx bx-check-circle' : 'bx bx-circle'"></i>
          Rakam
        </div>
      </div>

      <!-- Security Tip -->
      <div class="security-tip">
        <i class="bx bx-info-circle"></i>
        <span>
          Mailinle aynı olmamalı.<br>
          Memleketin plakası olmamalı.<br>
          Sonuna bir noktalama işareti koymayı düşünebilirsin.
        </span>
      </div>
    </div>
  `,
  styles: [`
    .password-strength {
      margin-top: 8px;
    }

    .strength-bar-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .strength-bar {
      flex: 1;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .strength-fill {
      height: 100%;
      border-radius: 3px;
      transition: all 0.3s ease;
    }

    .strength-label {
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 70px;
      text-align: right;
    }

    .feedback {
      margin-top: 8px;
    }

    .feedback ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .feedback li {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #dc2626;
      margin-bottom: 4px;
    }

    .feedback li i {
      font-size: 1rem;
    }

    .requirements {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .requirement {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #94a3b8;
      transition: color 0.2s ease;
    }

    .requirement.met {
      color: #22c55e;
    }

    .requirement i {
      font-size: 1rem;
    }

    .security-tip {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 10px 12px;
      background: rgba(59, 130, 246, 0.05);
      border-left: 3px solid #3b82f6;
      border-radius: 4px;
      color: #64748b;
      font-size: 0.8rem;
      line-height: 1.4;
    }

    .security-tip i {
      font-size: 1.1rem;
      color: #3b82f6;
      flex-shrink: 0;
    }
  `]
})
export class PasswordStrengthMeterComponent implements OnChanges {
  @Input() password: string = '';
  @Input() showFeedback: boolean = true;
  @Input() showRequirements: boolean = false;

  strength: PasswordStrength = {
    score: 0,
    label: '',
    color: '#cbd5e1',
    feedback: [],
    isValid: false,
  };

  hasMinLength = false;
  hasUppercase = false;
  hasLowercase = false;
  hasNumber = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.updateStrength();
    }
  }

  private updateStrength(): void {
    this.strength = checkPasswordStrength(this.password);

    // Update individual requirements
    this.hasMinLength = this.password.length >= 8;
    this.hasUppercase = /[A-Z]/.test(this.password);
    this.hasLowercase = /[a-z]/.test(this.password);
    this.hasNumber = /[0-9]/.test(this.password);
  }
}
