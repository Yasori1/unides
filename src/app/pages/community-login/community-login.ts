import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-community-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './community-login.html',
  styleUrls: ['./community-login.scss'],
})
export class CommunityLoginComponent {
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
      alert('Lütfen geçerli bir e-posta giriniz.');
    } else {
      console.log('Topluluk giriş formu gönderildi.');
    }
  }
}
