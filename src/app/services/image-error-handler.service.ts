import { Injectable } from '@angular/core';

/**
 * Image Error Handler Service
 * Placeholder görsellerin sürekli istek atmasını engeller ve image loading hatalarını yönetir
 * 
 * Sistem Mimarisi:
 * - Failed image cache: Başarısız yüklenen görselleri cache'ler, tekrar istek atılmasını engeller
 * - Placeholder management: Placeholder görsellerin varlığını kontrol eder
 * - Error recovery: Hata durumunda uygun fallback mekanizması sağlar
 * - Performance optimization: Gereksiz network isteklerini önler
 */
@Injectable({
  providedIn: 'root',
})
export class ImageErrorHandlerService {
  // Başarısız yüklenen görselleri cache'le (sonsuz döngüyü önlemek için)
  private failedImages = new Set<string>();
  
  // Placeholder görsellerin varlığını kontrol etmek için cache
  private placeholderExists = new Map<string, boolean>();
  
  // Varsayılan placeholder'lar (data URI veya mevcut asset'ler)
  private readonly defaultPlaceholders = {
    announcement: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5EdXl1cnUgR8O2cnNlbGk8L3RleHQ+PC9zdmc+',
    event: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FdGtpbGlrPC90ZXh0Pjwvc3ZnPg==',
    logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5MPC90ZXh0Pjwvc3ZnPg==',
    cover: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjMyIiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QmFubmVyPC90ZXh0Pjwvc3ZnPg==',
    avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BPC90ZXh0Pjwvc3ZnPg==',
  };

  /**
   * Image error handler - Placeholder görsellerin sürekli istek atmasını engeller
   * @param event Error event
   * @param placeholderType Placeholder tipi (announcement, event, logo, cover, avatar)
   * @returns void
   */
  handleImageError(event: Event, placeholderType: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar' = 'cover'): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;

    const currentSrc = img.src;
    
    // Eğer bu görsel daha önce başarısız olduysa, tekrar deneme
    if (this.failedImages.has(currentSrc)) {
      // Sonsuz döngüyü önle - onerror handler'ı kaldır
      img.onerror = null;
      // Data URI placeholder kullan (network isteği gerektirmez)
      img.src = this.getPlaceholder(placeholderType, true);
      return;
    }

    // İlk hata - cache'e ekle
    this.failedImages.add(currentSrc);

    // Eğer mevcut src zaten placeholder path'i içeriyorsa, direkt data URI kullan
    const placeholderPath = this.getPlaceholderPath(placeholderType);
    if (currentSrc.includes(placeholderPath) || currentSrc.includes('placeholder')) {
      img.onerror = null; // Sonsuz döngüyü önle
      img.src = this.getPlaceholder(placeholderType, true); // Data URI kullan (network isteği gerektirmez)
      return;
    }

    // Placeholder path'i kontrol et - eğer daha önce başarısız olduysa direkt data URI kullan
    if (this.placeholderExists.has(placeholderPath)) {
      const exists = this.placeholderExists.get(placeholderPath);
      if (!exists) {
        // Placeholder yoksa direkt data URI kullan (network isteği gerektirmez)
        img.onerror = null;
        img.src = this.getPlaceholder(placeholderType, true);
        return;
      }
    }

    // Placeholder'ı yükle (ilk deneme)
    // Ancak önce placeholder'ın varlığını kontrol et
    const checkImg = new Image();
    checkImg.onload = () => {
      // Placeholder mevcut - cache'e kaydet
      this.placeholderExists.set(placeholderPath, true);
      // Eğer img hala aynı placeholder path'ini bekliyorsa, yükle
      if (img.src === placeholderPath || img.src.includes(placeholderPath)) {
        // Zaten yükleniyor, bir şey yapma
      }
    };
    checkImg.onerror = () => {
      // Placeholder yoksa cache'e kaydet ve data URI kullan
      this.placeholderExists.set(placeholderPath, false);
      // Eğer img hala placeholder path'ini bekliyorsa, data URI'ye geç
      if (img.src === placeholderPath || img.src.includes(placeholderPath)) {
        img.onerror = null;
        img.src = this.getPlaceholder(placeholderType, true);
      }
    };
    
    // Placeholder'ı kontrol et
    checkImg.src = placeholderPath;
    
    // Eğer placeholder kontrolü tamamlanmadan önce img hata verirse, placeholder'ı yükle
    img.src = placeholderPath;
  }

  /**
   * Placeholder path'i al
   * @param type Placeholder tipi
   * @returns Placeholder path
   */
  private getPlaceholderPath(type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar'): string {
    const placeholderPaths: Record<string, string> = {
      announcement: 'assets/img/placeholder-announcement.jpg',
      event: 'assets/images/page-title1.jpg',
      logo: 'assets/img/placeholder-logo.svg',
      cover: 'assets/img/placeholder-cover.svg',
      avatar: 'assets/img/placeholder-avatar.svg',
    };
    return placeholderPaths[type] || placeholderPaths['cover'];
  }

  /**
   * Placeholder URL'i al (data URI veya path)
   * @param type Placeholder tipi
   * @param forceDataUri Data URI zorla kullan (sonsuz döngüyü önlemek için)
   * @returns Placeholder URL
   */
  private getPlaceholder(
    type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar',
    forceDataUri: boolean = false
  ): string {
    // Eğer data URI zorlanıyorsa, direkt data URI döndür
    if (forceDataUri) {
      return this.defaultPlaceholders[type] || this.defaultPlaceholders['cover'];
    }

    const placeholderPath = this.getPlaceholderPath(type);
    
    // Placeholder'ın varlığını kontrol et (cache'den)
    if (this.placeholderExists.has(placeholderPath)) {
      const exists = this.placeholderExists.get(placeholderPath);
      if (!exists) {
        // Placeholder yoksa data URI kullan
        return this.defaultPlaceholders[type] || this.defaultPlaceholders['cover'];
      }
    }

    // İlk kez kontrol ediliyorsa, placeholder path'i döndür
    return placeholderPath;
  }

  /**
   * Placeholder görselinin varlığını kontrol et ve cache'le
   * @param path Placeholder path
   * @returns Promise<boolean>
   */
  async checkPlaceholderExists(path: string): Promise<boolean> {
    if (this.placeholderExists.has(path)) {
      return this.placeholderExists.get(path) || false;
    }

    try {
      const response = await fetch(path, { method: 'HEAD' });
      const exists = response.ok;
      this.placeholderExists.set(path, exists);
      return exists;
    } catch {
      this.placeholderExists.set(path, false);
      return false;
    }
  }

  /**
   * Başarısız görsel cache'ini temizle
   */
  clearFailedImagesCache(): void {
    this.failedImages.clear();
  }

  /**
   * Belirli bir görseli failed cache'den kaldır
   */
  removeFromFailedCache(imageUrl: string): void {
    this.failedImages.delete(imageUrl);
  }

  /**
   * Tüm cache'leri temizle
   */
  clearAllCaches(): void {
    this.failedImages.clear();
    this.placeholderExists.clear();
  }

  /**
   * Placeholder URL'i al - eğer placeholder yoksa data URI döndür
   * @param type Placeholder tipi
   * @returns Placeholder URL (path veya data URI)
   */
  getPlaceholderUrl(type: 'announcement' | 'event' | 'logo' | 'cover' | 'avatar' = 'cover'): string {
    const placeholderPath = this.getPlaceholderPath(type);
    
    // Placeholder'ın varlığını kontrol et
    if (this.placeholderExists.has(placeholderPath)) {
      const exists = this.placeholderExists.get(placeholderPath);
      if (!exists) {
        // Placeholder yoksa data URI döndür (network isteği gerektirmez)
        return this.defaultPlaceholders[type] || this.defaultPlaceholders['cover'];
      }
      // Placeholder mevcut, path'i döndür
      return placeholderPath;
    }
    
    // İlk kez kontrol ediliyorsa, placeholder'ın varlığını kontrol et
    // Bu kontrol asenkron olacak, bu yüzden önce path'i döndür
    // Ancak kontrolü başlat ki bir sonraki çağrıda cache'den okunabilsin
    this.checkPlaceholderExistsAsync(placeholderPath);
    
    // İlk çağrıda path'i döndür (eğer dosya yoksa, handleImageError çağrılacak)
    return placeholderPath;
  }

  /**
   * Placeholder'ın varlığını asenkron olarak kontrol et ve cache'le
   * @param path Placeholder path
   */
  private checkPlaceholderExistsAsync(path: string): void {
    // Eğer zaten kontrol ediliyorsa, tekrar kontrol etme
    if (this.placeholderExists.has(path)) {
      return;
    }

    // Geçici olarak "checking" durumunu işaretle (null = kontrol ediliyor)
    // Bu sayede aynı anda birden fazla kontrol başlatılmaz
    this.placeholderExists.set(path, true); // Geçici olarak true, kontrol sonrası güncellenecek

    const checkImg = new Image();
    checkImg.onload = () => {
      // Placeholder mevcut
      this.placeholderExists.set(path, true);
    };
    checkImg.onerror = () => {
      // Placeholder yok
      this.placeholderExists.set(path, false);
    };
    checkImg.src = path;
  }
}
