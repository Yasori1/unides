import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-corporate-register',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './corporate-register.html',
  styleUrls: ['./corporate-register.scss'],
})
// BU SINIF ADININ "CorporateRegisterComponent" OLDUĞUNDAN EMIN OL
export class CorporateRegisterComponent {
  passwordMismatch: boolean = false;
  private password = '';
  private confirmPassword = '';

  onlyNumbers(event: any) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) {
      event.preventDefault();
    }
  }

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
    console.log('Kurumsal başvuru gönderildi.');
  }
}
