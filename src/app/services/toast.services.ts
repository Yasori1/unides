import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  // Bildirimleri tutan havuz
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(message: string, type: 'success' | 'error' = 'success') {
    const currentToasts = this.toastsSubject.value;
    const newToast: Toast = {
      id: Date.now(),
      message,
      type,
    };

    // Yeni bildirimi ekle
    this.toastsSubject.next([...currentToasts, newToast]);

    // 3 saniye sonra otomatik sil
    setTimeout(() => {
      this.remove(newToast.id);
    }, 3000);
  }

  remove(id: number) {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter((t) => t.id !== id));
  }
}
