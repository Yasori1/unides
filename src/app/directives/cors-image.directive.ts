import { Directive, ElementRef, OnInit, OnDestroy, Renderer2, inject, AfterViewInit } from '@angular/core';
import { ImageCorsService } from '../services/image-cors.service';

/**
 * CORS Image Directive
 * ERR_BLOCKED_BY_ORB hatasını çözmek için image'ları blob URL'e çevirir
 * Kullanım: <img [src]="imageUrl" appCorsImage />
 * 
 * Directive, image'ları no-cors mode'da fetch ile yükleyip blob URL'e çevirir.
 * Bu sayede ERR_BLOCKED_BY_ORB hatası önlenir.
 */
@Directive({
  selector: 'img[appCorsImage]',
  standalone: true,
})
export class CorsImageDirective implements OnInit, AfterViewInit, OnDestroy {
  private el: ElementRef<HTMLImageElement> = inject(ElementRef);
  private renderer = inject(Renderer2);
  private imageCorsService = inject(ImageCorsService);
  private observer?: MutationObserver;
  private originalSrc?: string;
  private blobUrl?: string;
  private lastCheckedSrc?: string;
  private checkTimer?: any;

  ngOnInit(): void {
    // MutationObserver ile src attribute değişikliklerini dinle
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          const newSrc = this.el.nativeElement.getAttribute('src') || this.el.nativeElement.src;
          if (newSrc !== this.originalSrc && newSrc && newSrc !== this.lastCheckedSrc) {
            this.lastCheckedSrc = newSrc;
            this.handleSrcChange(newSrc);
          }
        }
      });
    });

    // src attribute'unu gözlemle
    this.observer.observe(this.el.nativeElement, {
      attributes: true,
      attributeFilter: ['src'],
      attributeOldValue: true,
    });
  }

  ngAfterViewInit(): void {
    // İlk src değerini al ve işle
    setTimeout(() => {
      const currentSrc = this.el.nativeElement.getAttribute('src') || this.el.nativeElement.src;
      if (currentSrc && currentSrc !== this.originalSrc && !currentSrc.startsWith('blob:')) {
        this.handleSrcChange(currentSrc);
      }
    }, 0);

    // Periyodik kontrol (Angular property binding değişikliklerini yakalamak için)
    // Interval süresini artırarak gereksiz kontrolleri azalt
    this.checkTimer = setInterval(() => {
      const currentSrc = this.el.nativeElement.getAttribute('src') || this.el.nativeElement.src;
      // Blob URL'e zaten çevrilmişse tekrar işlem yapma
      if (currentSrc && currentSrc.startsWith('blob:')) {
        return;
      }
      // Orijinal src ile aynıysa veya zaten işlenmişse tekrar işlem yapma
      if (currentSrc && currentSrc !== this.originalSrc && currentSrc !== this.lastCheckedSrc && !currentSrc.startsWith('blob:')) {
        // Boş veya geçersiz URL'leri atla
        if (currentSrc && currentSrc.trim().length > 0 && !currentSrc.includes('undefined') && !currentSrc.includes('null')) {
          this.lastCheckedSrc = currentSrc;
          this.handleSrcChange(currentSrc);
        }
      }
    }, 500); // Interval süresini 200ms'den 500ms'ye çıkar
  }

  private async handleSrcChange(src: string): Promise<void> {
    // Geçersiz URL'leri atla
    if (!src || src.trim().length === 0 || src.includes('undefined') || src.includes('null') || src.toLowerCase() === 'string') {
      return;
    }

    // Zaten blob URL veya data URL ise işlem yapma
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      return;
    }

    // Eğer aynı src zaten işleniyorsa tekrar işlem yapma
    if (this.originalSrc === src && this.blobUrl) {
      return;
    }

    // Eski blob URL'i temizle
    if (this.blobUrl && this.originalSrc) {
      this.imageCorsService.revokeBlobUrl(this.originalSrc);
    }

    this.originalSrc = src;

    // Blob URL'e çevir
    await this.loadImageAsBlob(src);
  }

  private async loadImageAsBlob(src: string): Promise<void> {
    try {
      const blobUrl = await this.imageCorsService.getBlobUrl(src);
      
      // Blob URL başarıyla oluşturulduysa kullan
      if (blobUrl && blobUrl.startsWith('blob:')) {
        this.blobUrl = blobUrl;
        // Observer'ı geçici olarak durdur (sonsuz döngüyü önlemek için)
        if (this.observer) {
          this.observer.disconnect();
        }
        this.renderer.setAttribute(this.el.nativeElement, 'src', blobUrl);
        // Observer'ı tekrar başlat
        if (this.observer) {
          this.observer.observe(this.el.nativeElement, {
            attributes: true,
            attributeFilter: ['src'],
          });
        }
      } else {
        // Blob URL oluşturulamadı, orijinal URL'yi kullan
        // crossorigin="anonymous" ekleyerek tekrar dene
        this.renderer.setAttribute(this.el.nativeElement, 'crossorigin', 'anonymous');
        this.renderer.setAttribute(this.el.nativeElement, 'src', src);
      }
    } catch (error) {
      // Hata durumunda orijinal URL'yi kullan ve crossorigin ekle
      this.renderer.setAttribute(this.el.nativeElement, 'crossorigin', 'anonymous');
      this.renderer.setAttribute(this.el.nativeElement, 'src', src);
      console.warn('CORS image directive: Blob URL oluşturulamadı, orijinal URL kullanılıyor', error);
    }
  }

  ngOnDestroy(): void {
    // Observer'ı durdur
    if (this.observer) {
      this.observer.disconnect();
    }

    // Timer'ı temizle
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }

    // Blob URL'i temizle
    if (this.blobUrl && this.originalSrc) {
      this.imageCorsService.revokeBlobUrl(this.originalSrc);
    }
  }
}
