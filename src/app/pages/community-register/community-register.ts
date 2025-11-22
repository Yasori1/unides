import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-community-register',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './community-register.html',
  styleUrls: ['./community-register.scss'],
})
// BU SINIF ADININ "CommunityRegisterComponent" OLDUĞUNDAN EMIN OL
export class CommunityRegisterComponent {
  passwordMismatch: boolean = false;
  private password = '';
  private confirmPassword = '';

  checkPasswords(event: any, type: string) {
    const val = event.target.value;
    if (type === 'p1') this.password = val;
    else this.confirmPassword = val;
    this.passwordMismatch =
      this.confirmPassword && this.password !== this.confirmPassword ? true : false;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.passwordMismatch) {
      alert('Şifreler eşleşmiyor!');
      return;
    }
    console.log('Topluluk oluşturma isteği gönderildi.');
  }
}
