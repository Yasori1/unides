import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-corporate-login',
  standalone: true,
  imports: [CommonModule, RouterModule],

  templateUrl: './corporate-login.html',
  styleUrls: ['./corporate-login.scss'],
})
export class CorporateLoginComponent {
  emailError: boolean = false;

  validateStudentEmail(event: any) {
    const email = event.target.value;
    if (!email) {
      this.emailError = false;
      return;
    }
    if (email.includes('@') && !email.endsWith('.edu.tr')) {
      this.emailError = true;
    } else {
      this.emailError = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.emailError) {
      alert('Lütfen geçerli bir kurumsal e-posta giriniz.');
    } else {
      console.log('Kurumsal giriş formu gönderildi.');
    }
  }
}
