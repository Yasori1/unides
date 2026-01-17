import { Injectable } from '@angular/core';
import { Observable, of, shareReplay } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  observable?: Observable<T>;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private ongoingRequests = new Map<string, Observable<any>>();
  
  // Varsayılan cache süresi: 30 saniye
  private defaultTTL = 30 * 1000; // 30 seconds in milliseconds

  constructor() {}

  /**
   * Cache'den veri getir veya yoksa yeni istek yap
   * @param key Cache anahtarı (örn: 'announcements', 'events', 'communities')
   * @param request$ API isteğini döndüren Observable factory
   * @param ttl Cache süresi (milisaniye), varsayılan 30 saniye
   */
  get<T>(key: string, request$: () => Observable<T>, ttl: number = this.defaultTTL): Observable<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Cache varsa ve süresi dolmamışsa, cache'den dön
    if (cached && (now - cached.timestamp) < ttl) {
      console.log(`[Cache HIT] ${key} - ${Math.round((now - cached.timestamp) / 1000)}s önce alındı`);
      return of(cached.data);
    }

    // Aynı istek zaten yapılıyorsa, onu bekle (중복 istek engelleme)
    const ongoing = this.ongoingRequests.get(key);
    if (ongoing) {
      console.log(`[Cache WAIT] ${key} - Devam eden istek bekleniyor`);
      return ongoing;
    }

    // Yeni istek yap
    console.log(`[Cache MISS] ${key} - Yeni istek yapılıyor`);
    const newRequest$ = request$().pipe(
      tap((data) => {
        // İstek tamamlandığında cache'e kaydet
        this.cache.set(key, {
          data,
          timestamp: Date.now()
        });
        // Devam eden istekleri temizle
        this.ongoingRequests.delete(key);
      }),
      shareReplay(1) // Aynı anda birden fazla subscriber için tekrar istek yapma
    );

    // Devam eden isteği kaydet
    this.ongoingRequests.set(key, newRequest$);

    return newRequest$;
  }

  /**
   * Belirli bir cache entry'sini temizle
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.ongoingRequests.delete(key);
    console.log(`[Cache INVALIDATE] ${key}`);
  }

  /**
   * Belirli bir prefix ile başlayan tüm cache'leri temizle
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.ongoingRequests.delete(key);
    });
    console.log(`[Cache INVALIDATE PATTERN] ${pattern} - ${keysToDelete.length} entries cleared`);
  }

  /**
   * Tüm cache'i temizle
   */
  clear(): void {
    this.cache.clear();
    this.ongoingRequests.clear();
    console.log('[Cache CLEAR] Tüm cache temizlendi');
  }

  /**
   * Cache istatistiklerini göster (debug için)
   */
  getStats(): { size: number; keys: string[]; ages: { key: string; age: number }[] } {
    const now = Date.now();
    const keys: string[] = [];
    const ages: { key: string; age: number }[] = [];
    
    this.cache.forEach((entry, key) => {
      keys.push(key);
      ages.push({
        key,
        age: Math.round((now - entry.timestamp) / 1000) // saniye cinsinden
      });
    });

    return {
      size: this.cache.size,
      keys,
      ages
    };
  }
}
