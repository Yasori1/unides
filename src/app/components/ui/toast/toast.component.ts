import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../services/toast.services';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent {
  // Değişkeni tanımlıyoruz ama değer atamıyoruz
  toasts$;

  // Servisi constructor'da inject ediyoruz ve değişkeni burada bağlıyoruz
  constructor(public toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }
}
