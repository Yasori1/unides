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

  // Aktif zamanlayıcıyı tutmak için değişken
  private currentTimeout: any = null;

  show(message: string, type: 'success' | 'error' = 'success') {
    // 1. Eğer halihazırda bekleyen bir silme işlemi varsa iptal et
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    const newToast: Toast = {
      id: Date.now(),
      message,
      type,
    };

    // 2. Mevcut listeyi TEMİZLE ve sadece YENİ bildirimi ekle (Tekil Görünüm Mantığı)
    // Bu sayede asla üst üste binmezler.
    this.toastsSubject.next([newToast]);

    // 3. 3 saniye sonra silmek için yeni zamanlayıcı kur
    this.currentTimeout = setTimeout(() => {
      this.remove(newToast.id);
    }, 3000);
  }

  remove(id: number) {
    const currentToasts = this.toastsSubject.value;
    // Listeden ilgili ID'yi çıkar
    this.toastsSubject.next(currentToasts.filter((t) => t.id !== id));
  }
}
