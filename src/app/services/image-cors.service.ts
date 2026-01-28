import { Injectable } from '@angular/core';
import { Logger } from '../utils/logger.util';

/**
 * Image CORS Service
 * CORS sorununu çözmek için image'ları fetch ile blob olarak yükleyip blob URL'e çevirir
 * Proxy kullanmadan CORS sorununu çözer
 */
@Injectable({
  providedIn: 'root',
})
export class ImageCorsService {
  // Blob URL cache - aynı image'ı tekrar yüklememek için
  private blobUrlCache = new Map<string, string>();

  /**
   * Image URL'ini blob URL'e çevirir (ERR_BLOCKED_BY_ORB hatasını önler)
   * @param imageUrl Image URL'i
   * @returns Blob URL veya orijinal URL (hata durumunda)
   */
  async getBlobUrl(imageUrl: string): Promise<string> {
    if (!imageUrl) {
      return '';
    }

    // Zaten blob URL veya data URL ise olduğu gibi döndür
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    // Cache'de varsa direkt döndür
    if (this.blobUrlCache.has(imageUrl)) {
      return this.blobUrlCache.get(imageUrl)!;
    }

    try {
      // Image'ı yeni bir Image objesi ile yükle ve canvas'a çiz
      // Bu yöntem ERR_BLOCKED_BY_ORB hatasını önler
      return await this.loadImageViaCanvas(imageUrl);
    } catch (error) {
      // Hata durumunda orijinal URL'yi döndür
      Logger.warn('Image blob URL oluşturulamadı, orijinal URL kullanılıyor:', imageUrl, error);
      return imageUrl;
    }
  }

  /**
   * Image'ı canvas'a çizip blob URL'e çevirir (ERR_BLOCKED_BY_ORB hatasını önler)
   */
  private async loadImageViaCanvas(imageUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      
      // Önce crossorigin="anonymous" ile dene
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          // Canvas oluştur
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          // Canvas'a çiz
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Canvas context alınamadı, orijinal URL'yi döndür
            resolve(imageUrl);
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          
          // Canvas'ı blob'a çevir
          canvas.toBlob((blob) => {
            if (blob && blob.size > 0) {
              // Blob URL oluştur
              const blobUrl = URL.createObjectURL(blob);
              
              // Cache'e ekle
              this.blobUrlCache.set(imageUrl, blobUrl);
              
              resolve(blobUrl);
            } else {
              // Blob oluşturulamadı, orijinal URL'yi döndür
              resolve(imageUrl);
            }
          }, 'image/png');
        } catch (error) {
          // Canvas'a çizilemedi (CORS hatası olabilir), orijinal URL'yi döndür
          resolve(imageUrl);
        }
      };
      
      img.onerror = () => {
        // CORS hatası veya image yüklenemedi
        // crossorigin olmadan tekrar dene
        const img2 = new Image();
        
        img2.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img2.naturalWidth;
            canvas.height = img2.naturalHeight;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(imageUrl);
              return;
            }
            
            ctx.drawImage(img2, 0, 0);
            
            canvas.toBlob((blob) => {
              if (blob && blob.size > 0) {
                const blobUrl = URL.createObjectURL(blob);
                this.blobUrlCache.set(imageUrl, blobUrl);
                resolve(blobUrl);
              } else {
                resolve(imageUrl);
              }
            }, 'image/png');
          } catch (error) {
            resolve(imageUrl);
          }
        };
        
        img2.onerror = () => {
          // Yine de yüklenemedi, orijinal URL'yi döndür
          resolve(imageUrl);
        };
        
        // crossorigin olmadan yükle
        img2.src = imageUrl;
      };
      
      // Image'ı yükle
      img.src = imageUrl;
    });
  }

  /**
   * Image URL'ini blob URL'e çevirir (sync versiyon - cache'den döner)
   * @param imageUrl Image URL'i
   * @returns Blob URL veya orijinal URL
   */
  getBlobUrlSync(imageUrl: string): string {
    if (!imageUrl) {
      return '';
    }

    // Zaten blob URL veya data URL ise olduğu gibi döndür
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    // Cache'de varsa direkt döndür
    if (this.blobUrlCache.has(imageUrl)) {
      return this.blobUrlCache.get(imageUrl)!;
    }

    // Cache'de yoksa async yükleme başlat ve şimdilik orijinal URL'yi döndür
    this.getBlobUrl(imageUrl).catch(() => {
      // Hata durumunda sessizce devam et
    });

    return imageUrl;
  }

  /**
   * Cache'i temizle ve blob URL'leri serbest bırak
   */
  clearCache(): void {
    this.blobUrlCache.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });
    this.blobUrlCache.clear();
  }

  /**
   * Belirli bir image URL'inin cache'ini temizle
   */
  revokeBlobUrl(imageUrl: string): void {
    const blobUrl = this.blobUrlCache.get(imageUrl);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      this.blobUrlCache.delete(imageUrl);
    }
  }
}
