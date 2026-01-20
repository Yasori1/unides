import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EventItem {
  id: number;
  title: string;
  shortDescription?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  communityId: number | string; // Backend'den Guid (string) gelebilir
  communityName?: string;
  communityLogo?: string; // Topluluk logosu
  imageUrl?: string;
  status?: 'Onaylandı' | 'Beklemede' | 'Reddedildi' | 'Revize';
  capacity?: string;
  quota?: number; // Kontenjan (number olarak)
  city?: string; // Şehir bilgisi
  rejectionReason?: string; // Red nedeni / Revize nedeni (ConfirmAbout)
}

// Backend DTO interfaces
interface EventListItemDto {
  // Backend'den gelen field adları (PascalCase veya camelCase)
  eventId?: number;
  EventId?: number;
  etkinlikId?: number;
  EtkinlikId?: number;
  eventName?: string;
  EventName?: string;
  etkinlikAdi?: string;
  EtkinlikAdi?: string;
  eventPictureLink?: string;
  EventPictureLink?: string;
  resimUrl?: string;
  ResimUrl?: string;
  eventDate?: string;
  EventDate?: string;
  eventClock?: string;
  EventClock?: string;
  eventLocation?: string;
  EventLocation?: string;
  eventKontenjan?: number;
  EventKontenjan?: number;
  eventAbout?: string;
  EventAbout?: string;
  miniAbout?: string;
  MiniAbout?: string;
  communityName?: string;
  CommunityName?: string;
  city?: string;
  City?: string;
  eventConfirm?: number;
  EventConfirm?: number;
  confirmAbout?: string;
  ConfirmAbout?: string;
  rejectionReason?: string;
  RejectionReason?: string;
  // Eski field adları (fallback)
  kisaAciklama?: string;
  baslangicTarihi?: string;
  bitisTarihi?: string;
  konum?: string;
  comId?: string; // Guid
  ComId?: string;
}

interface CreateEventDto {
  eventName: string; // Backend: EventName (required)
  eventPictureLink?: string; // Backend: EventPictureLink (optional)
  eventDate: string; // Backend: EventDate (DateOnly, required) - Format: "dd.MM.yyyy" (örn: "02.01.2026")
  eventClock: string; // Backend: EventClock (TimeOnly, required) - Format: "HH:mm"
  eventLocation?: string; // Backend: EventLocation (optional)
  eventKontenjan?: number; // Backend: EventKontenjan (optional)
  eventAbout?: string; // Backend: EventAbout (optional)
  miniAbout?: string; // Backend: MiniAbout (optional)
  // comId backend'de otomatik olarak creator'ın topluluğundan alınıyor
}

// Backend UpdateEventDto (PascalCase)
interface UpdateEventDto {
  EventName?: string;
  EventPictureLink?: string;
  EventDate?: string; // DateOnly format: "dd.MM.yyyy" veya ISO string
  EventClock?: string; // TimeOnly format: "HH:mm"
  EventLocation?: string;
  EventKontenjan?: number;
  EventAbout?: string;
  MiniAbout?: string;
}

// Swipe/magic-card bileşenleri için kullanılan mock Project tipi
export interface Project {
  id: number;
  title: string;
  category: string;
  date: string;
  description: string;
  image: string;
  status: 'active' | 'upcoming';
  location?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/Events`;



  constructor(private http: HttpClient) { }

  // Backend'den gelen relative path'i tam URL'ye çevir
  private convertImagePathToFullUrl(imagePath: string): string {
    if (!imagePath) {
      return '';
    }
    
    // String'e çevir ve trim yap
    const pathStr = String(imagePath).trim();
    
    // Zaten tam URL ise (http://, https://, data:, blob:) olduğu gibi döndür
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('data:') || pathStr.startsWith('blob:')) {
      return pathStr;
    }
    
    // Geçersiz placeholder değerleri kontrol et (küçük harf normalize edilmiş)
    const normalizedPath = pathStr.toLowerCase().trim();
    const invalidValues = ['string', 'null', 'undefined', 'none', 'placeholder', '', 'null', 'undefined'];
    
    // "string" değeri özel kontrol - backend'den placeholder olarak gelebilir
    if (normalizedPath === 'string' || normalizedPath === 'null' || normalizedPath === 'undefined') {
      return '';
    }
    
    if (invalidValues.includes(normalizedPath)) {
      return '';
    }
    
    // Çok kısa path'ler geçersiz olabilir (örn: "string" = 6 karakter)
    // Ancak backend'den gelebilecek kısa GUID'ler veya hash'ler geçerli olabilir
    // Bu yüzden sadece bilinen geçersiz değerleri kontrol ediyoruz
    
    // Relative path kontrolü - backend'den `/images/Etkinlikler/`, `/ImagesUnides/Etkinlikler/`, `/assets/img/Etkinlikler/` formatında gelebilir
    // Eğer path `/images/`, `/ImagesUnides/`, `/assets/img/` ile başlamıyorsa ve çok kısaysa geçersiz olabilir
    const isValidPath = pathStr.startsWith('/images/') || 
                        pathStr.startsWith('/ImagesUnides/') || 
                        pathStr.startsWith('/assets/img/') ||
                        pathStr.startsWith('/assets/images/');
    
    // Eğer path geçerli bir format değilse ve çok kısaysa, geçersiz olabilir
    if (!isValidPath && pathStr.length < 15) {
      // Geçersiz placeholder değerleri tekrar kontrol et
      if (invalidValues.includes(normalizedPath)) {
        return '';
      }
      // Eğer path sadece harflerden oluşuyorsa ve çok kısaysa, muhtemelen geçersiz bir placeholder
      // Ancak "string" gibi bilinen placeholder'ları zaten yukarıda kontrol ettik
      if (/^[a-zA-Z]+$/.test(pathStr) && pathStr.length < 15 && normalizedPath !== 'string') {
        // Sadece gerçekten geçersiz görünen değerleri filtrele
        return '';
      }
    }
    
    // Relative path ise tam URL'ye çevir
    // Backend'den `/assets/img/Etkinlikler/`, `/assets/img/Duyurular/`, `/assets/img/Banner/`, `/assets/img/Logo/` formatında gelebilir
    // Bunları `/ImagesUnides/Etkinlikler/`, `/ImagesUnides/Duyurular/`, `/ImagesUnides/Banner/`, `/ImagesUnides/Logo/` formatına çevir
    let finalPath = pathStr;
    if (!finalPath.startsWith('/')) {
      finalPath = '/' + finalPath;
    }
    
    // Path dönüşümü: `/assets/img/` -> `/ImagesUnides/`
    if (finalPath.startsWith('/assets/img/')) {
      finalPath = finalPath.replace('/assets/img/', '/ImagesUnides/');
    }
    // Eğer zaten `/ImagesUnides/` ile başlıyorsa olduğu gibi bırak
    // Eğer `/images/` ile başlıyorsa (küçük harf) `/ImagesUnides/` yap
    else if (finalPath.startsWith('/images/')) {
      finalPath = finalPath.replace('/images/', '/ImagesUnides/');
    }
    
    // Etkinlikler klasörü için özel kontrol - eğer path Etkinlikler içermiyorsa ve backend'den geldiyse
    // Backend'den `/ImagesUnides/Etkinlikler/` formatında gelmeli, eğer sadece dosya adı gelirse klasör ekle
    if (finalPath.startsWith('/ImagesUnides/') && !finalPath.includes('/Etkinlikler/') && !finalPath.includes('/Duyurular/') && !finalPath.includes('/Banner/') && !finalPath.includes('/Logo/')) {
      // Sadece dosya adı gelmişse Etkinlikler klasörüne ekle
      const fileName = finalPath.replace('/ImagesUnides/', '');
      if (fileName && !fileName.includes('/')) {
        finalPath = `/ImagesUnides/Etkinlikler/${fileName}`;
      }
    }
    // Eğer path `/ImagesUnides/` ile başlamıyorsa ama dosya adı gibi görünüyorsa, Etkinlikler klasörüne ekle
    else if (!finalPath.startsWith('/ImagesUnides/') && !finalPath.startsWith('http') && !finalPath.startsWith('data:') && finalPath.length > 0 && !finalPath.includes('/')) {
      // Sadece dosya adı gelmişse, Etkinlikler klasörüne ekle
      finalPath = `/ImagesUnides/Etkinlikler/${finalPath}`;
    }
    
    // Her zaman production URL'ini kullan (unidesportal.com) - direkt bağlantı
    const baseUrl = environment.apiUrl.replace('/api', '');
    const fullUrl = baseUrl + finalPath;
    return fullUrl;
  }

  private mapToEvent(dto: EventListItemDto | any): EventItem {
    // Backend'den gelen DTO'yu EventItem'a çevir
    // Backend EventListItemDto: EventId, EventName, EventPictureLink, EventDate, EventClock, EventLocation, EventKontenjan, EventAbout, MiniAbout, CommunityName, City, EventConfirm

    // EventConfirm: 0=pending, 1=accepted, 2=rejected
    // Backend'den gelen EventConfirm değerini kontrol et (camelCase, PascalCase veya farklı field adları)
    let eventConfirmValue: number = 0;

    // Farklı field adlarını kontrol et
    if (dto.eventConfirm !== undefined) {
      eventConfirmValue =
        typeof dto.eventConfirm === 'string' ? parseInt(dto.eventConfirm, 10) : dto.eventConfirm;
    } else if (dto.EventConfirm !== undefined) {
      eventConfirmValue =
        typeof dto.EventConfirm === 'string' ? parseInt(dto.EventConfirm, 10) : dto.EventConfirm;
    } else if (dto.eventConfirmStatus !== undefined) {
      eventConfirmValue =
        typeof dto.eventConfirmStatus === 'string'
          ? parseInt(dto.eventConfirmStatus, 10)
          : dto.eventConfirmStatus;
    } else if (dto.EventConfirmStatus !== undefined) {
      eventConfirmValue =
        typeof dto.EventConfirmStatus === 'string'
          ? parseInt(dto.EventConfirmStatus, 10)
          : dto.EventConfirmStatus;
    }

    // NaN kontrolü
    if (isNaN(eventConfirmValue)) {
      eventConfirmValue = 0;
    }

    // EventConfirm değerini string status'e çevir
    let status: 'Onaylandı' | 'Beklemede' | 'Reddedildi' = 'Beklemede';
    if (eventConfirmValue === 1) {
      status = 'Onaylandı';
    } else if (eventConfirmValue === 2) {
      status = 'Reddedildi';
    } else {
      // 0 veya undefined/null durumunda 'Beklemede'
      status = 'Beklemede';
    }

    // EventDate ve EventClock'u birleştirerek startDate oluştur
    const eventDate = dto.eventDate || dto.EventDate || '';
    const eventClock = dto.eventClock || dto.EventClock || '';
    let startDate: string = '';
    if (eventDate) {
      try {
        // DateOnly formatından Date objesine çevir
        const dateStr = typeof eventDate === 'string' ? eventDate : eventDate.toString();
        const timeStr = eventClock
          ? typeof eventClock === 'string'
            ? eventClock
            : eventClock.toString()
          : '00:00:00';
        
        let dateObj: Date | null = null;
        
        // Backend'den "dd.MM.yyyy" formatı gelebilir (örn: "17.01.2026")
        if (dateStr.includes('.')) {
          // "dd.MM.yyyy" formatını parse et
          const parts = dateStr.split('.');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JavaScript month is 0-indexed
            const year = parseInt(parts[2], 10);
            
            // Saat bilgisini parse et
            const timeParts = timeStr.split(':');
            const hour = parseInt(timeParts[0] || '0', 10) || 0;
            const minute = parseInt(timeParts[1] || '0', 10) || 0;
            
            dateObj = new Date(year, month, day, hour, minute);
            
            // Geçerlilik kontrolü
            if (!isNaN(dateObj.getTime())) {
              startDate = dateObj.toISOString();
            } else {
              startDate = '';
            }
          } else {
            startDate = '';
          }
        } else {
          // ISO format veya diğer formatları dene
          const dateTimeStr = `${dateStr}T${timeStr}`;
          dateObj = new Date(dateTimeStr);
          // Geçerlilik kontrolü
          if (!isNaN(dateObj.getTime())) {
            startDate = dateObj.toISOString();
          } else {
            startDate = typeof eventDate === 'string' ? eventDate : '';
          }
        }
      } catch {
        startDate = typeof eventDate === 'string' ? eventDate : '';
      }
    }

    // endDate için benzer işlem
    let endDate: string = '';
    const endEventDate = dto.endEventDate || dto.EndEventDate || '';
    const endEventClock = dto.endEventClock || dto.EndEventClock || '';
    if (endEventDate) {
      try {
        const dateStr = typeof endEventDate === 'string' ? endEventDate : endEventDate.toString();
        const timeStr = endEventClock
          ? typeof endEventClock === 'string'
            ? endEventClock
            : endEventClock.toString()
          : '00:00:00';
        const dateTimeStr = `${dateStr}T${timeStr}`;
        const dateObj = new Date(dateTimeStr);
        if (!isNaN(dateObj.getTime())) {
          endDate = dateObj.toISOString();
        } else {
          endDate = typeof endEventDate === 'string' ? endEventDate : '';
        }
      } catch {
        endDate = typeof endEventDate === 'string' ? endEventDate : '';
      }
    }

    // Fallback: baslangicTarihi ve bitisTarihi kontrolü
    if (!startDate && dto.baslangicTarihi) {
      try {
        const dateValue =
          typeof dto.baslangicTarihi === 'string' ? dto.baslangicTarihi : dto.baslangicTarihi;
        const dateObj = new Date(dateValue);
        if (!isNaN(dateObj.getTime())) {
          startDate = dateObj.toISOString();
        } else {
          startDate = typeof dateValue === 'string' ? dateValue : '';
        }
      } catch {
        startDate = typeof dto.baslangicTarihi === 'string' ? dto.baslangicTarihi : '';
      }
    }

    if (!endDate && dto.bitisTarihi) {
      try {
        const dateValue = typeof dto.bitisTarihi === 'string' ? dto.bitisTarihi : dto.bitisTarihi;
        const dateObj = new Date(dateValue);
        if (!isNaN(dateObj.getTime())) {
          endDate = dateObj.toISOString();
        } else {
          endDate = typeof dateValue === 'string' ? dateValue : '';
        }
      } catch {
        endDate = typeof dto.bitisTarihi === 'string' ? dto.bitisTarihi : '';
      }
    }

    return {
      id: dto.eventId || dto.EventId || dto.etkinlikId || dto.EtkinlikId || dto.id || 0,
      title:
        dto.eventName || dto.EventName || dto.etkinlikAdi || dto.EtkinlikAdi || dto.title || '',
      shortDescription:
        dto.miniAbout || dto.MiniAbout || dto.kisaAciklama || dto.KisaAciklama || '',
      description:
        dto.eventAbout || dto.EventAbout || dto.detayliAciklama || dto.DetayliAciklama || '',
      startDate: startDate || dto.BaslangicTarihi || '',
      endDate: endDate || dto.BitisTarihi || '',
      location: dto.eventLocation || dto.EventLocation || dto.konum || dto.Konum || '',
      communityId:
        dto.comId || dto.ComId || dto.toplulukId || dto.ToplulukId || dto.communityId || 0,
      communityName: dto.communityName || dto.CommunityName || '',
      communityLogo: dto.communityLogo || dto.CommunityLogo || undefined, // Topluluk logosu (opsiyonel)
      imageUrl: (() => {
        // Backend'den gelen image path'i al - farklı field adlarını kontrol et
        const rawImagePath = dto.eventPictureLink || dto.EventPictureLink || dto.resimUrl || dto.ResimUrl || dto.imageUrl || dto.ImageUrl || '';
        const imagePathStr = rawImagePath ? String(rawImagePath).trim() : '';
        
        // "string", "null", "undefined" gibi placeholder değerleri kontrol et
        const normalizedPath = imagePathStr.toLowerCase().trim();
        if (normalizedPath === 'string' || normalizedPath === 'null' || normalizedPath === 'undefined' || !imagePathStr) {
          return '';
        }
        
        // Debug: Backend'den gelen raw image path'i logla (sadece geçerli path'ler için)
        if (imagePathStr && imagePathStr.length > 0 && normalizedPath !== 'string') {
          console.log('[mapToEvent] Raw image path from backend:', imagePathStr, 'Event ID:', dto.eventId || dto.EventId);
        }
        
        // convertImagePathToFullUrl ile işle
        const convertedUrl = this.convertImagePathToFullUrl(imagePathStr);
        
        // Debug: Convert edilmiş URL'yi logla
        if (convertedUrl && convertedUrl.length > 0) {
          console.log('[mapToEvent] Converted image URL:', convertedUrl, 'Event ID:', dto.eventId || dto.EventId);
        }
        
        return convertedUrl;
      })(),
      status: status,
      capacity:
        dto.eventKontenjan || dto.EventKontenjan
          ? String(dto.eventKontenjan || dto.EventKontenjan)
          : undefined,
      city: dto.city || dto.City || '',
      rejectionReason: (() => {
        // Backend'den gelen tüm olası field adlarını kontrol et
        const confirmAbout = (dto as any).ConfirmAbout || (dto as any).confirmAbout || (dto as any).ConfirmAbout || (dto as any).confirmAbout;
        const rejectionReason = (dto as any).RejectionReason || (dto as any).rejectionReason;
        
        // Debug
        if (confirmAbout) {
          console.log('mapToEvent: ConfirmAbout bulundu:', confirmAbout, 'Event ID:', dto.eventId || dto.EventId);
        }
        if (rejectionReason) {
          console.log('mapToEvent: RejectionReason bulundu:', rejectionReason, 'Event ID:', dto.eventId || dto.EventId);
        }
        
        return confirmAbout || rejectionReason || undefined;
      })(),
    };
  }

  // Anasayfa için yaklaşan etkinlikleri getir (Backend: GET /api/Events/all)
  getHomeUpcomingEvents(limit: number = 6): Observable<EventItem[]> {
    // /api/Events/all endpoint'ini kullan
    return this.http.get<EventListItemDto[]>(`${this.apiUrl}/all`).pipe(
      map((list) => {
        // Tüm etkinlikleri map et
        const mappedEvents = list.map((dto) => this.mapToEvent(dto));
        // Gelecekteki etkinlikleri filtrele ve sırala
        const now = new Date();
        const futureEvents = mappedEvents
          .filter((e) => {
            if (!e.startDate) return false;
            const eventDate = new Date(e.startDate);
            return eventDate >= now;
          })
          .sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            return dateA - dateB;
          });
        // İlk limit kadarını al
        return futureEvents.slice(0, limit);
      }),
      catchError((error) => {
        console.error('Home upcoming events yüklenemedi:', error);
        return of([]);
      })
    );
  }

  // Tüm etkinlikleri getir (Backend: GET /api/Events/all)
  // Auth interceptor automatically adds Authorization header if token exists
  getAll(): Observable<EventItem[]> {
    return this.http.get<EventListItemDto[]>(`${this.apiUrl}/all`).pipe(
      map((list) => {
        // Backend'den gelen etkinlikleri map et
        const apiEvents = list.map((dto) => {
          const mapped = this.mapToEvent(dto);
          return mapped;
        });
        return apiEvents;
      }),
      catchError((error) => {
        console.error('Etkinlikler yüklenemedi:', error);
        return of([]);
      })
    );
  }

  // Status'e göre etkinlikleri getir (Backend: GET /api/Events/status?status=0&status=1&status=2)
  // status: 0=Beklemede, 1=Onaylandı, 2=Reddedildi
  // Auth interceptor automatically adds Authorization header if token exists
  getByStatus(statuses: number[]): Observable<EventItem[]> {
    // Query parametrelerini oluştur: ?status=0&status=1&status=2
    let params = new HttpParams();
    statuses.forEach((status) => {
      params = params.append('status', status.toString());
    });

    // Backend EventsByStatusDto döndürüyor: { Pending: [], Accepted: [], Rejected: [] }
    // Tüm status'leri birleştirip döndürüyoruz
    return this.http
      .get<{
        Pending: EventListItemDto[];
        Accepted: EventListItemDto[];
        Rejected: EventListItemDto[];
      }>(`${this.apiUrl}/status`, { params })
      .pipe(
        map((response: any) => {
          // Backend EventsByStatusDto döndürüyor: { Pending: [], Accepted: [], Rejected: [] }
          // Response'u kontrol et
          if (!response) {
            return [];
          }

          // Response formatını kontrol et - backend'den gelen response'un yapısını doğru parse et
          // EventsByStatusDto: { Pending: EventListItemDto[], Accepted: EventListItemDto[], Rejected: EventListItemDto[] }
          const pending = response.Pending || response.pending || [];
          const accepted = response.Accepted || response.accepted || [];
          const rejected = response.Rejected || response.rejected || [];

          // Tüm status'leri birleştir
          const allEvents: EventListItemDto[] = [...pending, ...accepted, ...rejected];

          // Eğer hiç etkinlik yoksa boş array döndür
          if (allEvents.length === 0) {
            return [];
          }

          // EventListItemDto'ları EventItem'a map et
          const mappedEvents = allEvents.map((dto) => this.mapToEvent(dto));

          return mappedEvents;
        }),
        catchError((error) => {
          // Hata durumunda boş array döndür
          return of([]);
        })
      );
  }

  // Topluluk bazlı etkinlikleri getir (Backend: GET /api/Events/community/{communityId}/events?status=0&status=1&status=2)
  // [Authorize(Policy = "CommunityAdminOnly")] - Sadece topluluk lideri görebilir
  getCommunityEvents(communityId: string, statuses?: number[]): Observable<EventItem[]> {
    // Auth interceptor automatically adds Authorization header if token exists
    // Query parametrelerini oluştur: ?status=0&status=1&status=2
    let params = new HttpParams();
    if (statuses && statuses.length > 0) {
      statuses.forEach((status) => {
        params = params.append('status', status.toString());
      });
    }

    // Backend EventsByStatusDto döndürüyor: { Pending: [], Accepted: [], Rejected: [] }
    // Auth interceptor automatically adds Authorization header if token exists
    return this.http
      .get<{
        Pending: EventListItemDto[];
        Accepted: EventListItemDto[];
        Rejected: EventListItemDto[];
      }>(`${this.apiUrl}/community/${communityId}/events`, { params })
      .pipe(
        map((response: any) => {
          if (!response) {
            return [];
          }

          // Debug: Backend'den gelen raw response'u kontrol et
          console.log('Backend raw response:', response);
          
          // EventsByStatusDto: { Pending: EventListItemDto[], Accepted: EventListItemDto[], Rejected: EventListItemDto[] }
          const pending = response.Pending || response.pending || [];
          const accepted = response.Accepted || response.accepted || [];
          const rejected = response.Rejected || response.rejected || [];

          // Debug: Rejected events'i kontrol et
          console.log('Rejected events (raw):', rejected);
          rejected.forEach((event: any, idx: number) => {
            console.log(`Rejected event ${idx}:`, {
              id: event.eventId || event.EventId,
              name: event.eventName || event.EventName,
              confirmAbout: event.ConfirmAbout || event.confirmAbout,
              allKeys: Object.keys(event)
            });
          });

          // Tüm status'leri birleştir
          const allEvents: EventListItemDto[] = [...pending, ...accepted, ...rejected];

          // EventListItemDto'ları EventItem'a map et
          const mappedEvents = allEvents.map((dto) => {
            // Debug: Backend'den gelen raw DTO'yu kontrol et
            console.log('Raw DTO:', dto);
            if (dto && ((dto as any).ConfirmAbout || (dto as any).confirmAbout)) {
              console.log('Backend\'den ConfirmAbout geldi:', (dto as any).ConfirmAbout || (dto as any).confirmAbout, 'Event ID:', dto.eventId || dto.EventId);
            }
            const mapped = this.mapToEvent(dto);
            console.log('Mapped event rejectionReason:', mapped.rejectionReason, 'Event ID:', mapped.id);
            return mapped;
          });

          return mappedEvents;
        }),
        catchError((error) => {
          // Hata durumunda boş array döndür
          return of([]);
        })
      );
  }

  // Etkinlik detayını getir (Backend: GET /api/Events/{id})
  // Auth interceptor automatically adds Authorization header if token exists
  getById(id: number): Observable<EventItem> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((dto) => this.mapToEvent(dto)),
      catchError((error: any) => {
        // 404 hatalarını sessizce handle et - event bulunamadığında normal bir durum
        if (error?.status === 404) {
          // 404 hatası için boş bir EventItem döndür veya hata fırlatma
          // Component'ler bu durumu handle edebilir
          return throwError(() => error);
        }
        // Diğer hatalar için sadece development modunda log yaz
        if (!environment.production) {
          console.warn('Etkinlik detayı yüklenemedi:', error.status || error.message);
        }
        throw error;
      })
    );
  }

  // Yeni etkinlik ekleme (Backend: POST /api/Events/create)
  // comId backend'de otomatik olarak creator'ın topluluğundan alınıyor, bu yüzden artık gerekli değil
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  createEvent(event: Partial<EventItem>): Observable<{ eventId: number }> {
    // Tarih ve saat formatlarını backend'in beklediği formata çevir
    // Backend DateOnlyJsonConverter "dd.MM.yyyy" formatını bekliyor!
    let eventDate = '';
    let eventClock = '';

    if (event.startDate) {
      const startDateObj =
        typeof event.startDate === 'string' ? new Date(event.startDate) : new Date(event.startDate);

      // Backend DateOnlyJsonConverter "dd.MM.yyyy" formatını bekliyor (örn: "02.01.2026")
      const day = String(startDateObj.getDate()).padStart(2, '0');
      const month = String(startDateObj.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
      const year = startDateObj.getFullYear();
      eventDate = `${day}.${month}.${year}`; // Format: "dd.MM.yyyy"

      // TimeOnly formatı: "HH:mm" (local timezone'da)
      const hours = String(startDateObj.getHours()).padStart(2, '0');
      const minutes = String(startDateObj.getMinutes()).padStart(2, '0');
      eventClock = `${hours}:${minutes}`;
    } else {
      // Fallback: bugünün tarihi ve saati
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      eventDate = `${day}.${month}.${year}`; // Format: "dd.MM.yyyy"
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      eventClock = `${hours}:${minutes}`;
    }

    const createDto: CreateEventDto = {
      eventName: event.title || '',
      eventPictureLink: event.imageUrl || undefined, // Fotoğraf optional
      eventDate: eventDate, // DateOnly format: "dd.MM.yyyy" (Backend DateOnlyJsonConverter bekliyor)
      eventClock: eventClock, // TimeOnly format: "HH:mm"
      eventLocation: event.location || undefined,
      eventKontenjan: event.quota || undefined,
      eventAbout: event.description || undefined, // Detaylı açıklama
      miniAbout: event.shortDescription || event.description || undefined, // Kısa açıklama
      // comId backend'de otomatik olarak creator'ın topluluğundan alınıyor
    };

    return this.http.post<{ eventId: number }>(`${this.apiUrl}/create`, createDto).pipe(
      catchError((error) => {
        console.error('Etkinlik oluşturulamadı:', error);
        throw error;
      })
    );
  }

  // Etkinlik güncelle (Backend: PUT /api/Events/update/{id})
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  updateEvent(id: number, event: Partial<EventItem>): Observable<{ updated: number }> {
    // Backend'in beklediği formata çevir (dd.MM.yyyy ve HH:mm)
    let eventDate = '';
    let eventClock = '';

    if (event.startDate) {
      const startDateObj =
        typeof event.startDate === 'string' ? new Date(event.startDate) : new Date(event.startDate);

      // DateOnly formatı: "dd.MM.yyyy" (local timezone'da)
      const year = startDateObj.getFullYear();
      const month = String(startDateObj.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
      const day = String(startDateObj.getDate()).padStart(2, '0');
      eventDate = `${day}.${month}.${year}`; // Format: "dd.MM.yyyy"

      // TimeOnly formatı: "HH:mm" (local timezone'da)
      const hours = String(startDateObj.getHours()).padStart(2, '0');
      const minutes = String(startDateObj.getMinutes()).padStart(2, '0');
      eventClock = `${hours}:${minutes}`;
    } else {
      // Fallback: bugünün tarihi ve saati
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      eventDate = `${day}.${month}.${year}`; // Format: "dd.MM.yyyy"
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      eventClock = `${hours}:${minutes}`;
    }

    // Backend UpdateEventDto formatına çevir (PascalCase)
    // imageUrl boş string ise EventPictureLink'i boş string olarak gönder (fotoğraf silme durumu)
    // imageUrl undefined/null ise EventPictureLink'i undefined olarak gönder (güncelleme yok)
    let eventPictureLink: string | undefined = undefined;
    if (event.imageUrl !== undefined && event.imageUrl !== null) {
      eventPictureLink = event.imageUrl === '' ? '' : event.imageUrl;
    }
    
    const updateDto: UpdateEventDto = {
      EventName: event.title || undefined,
      EventPictureLink: eventPictureLink,
      EventDate: eventDate || undefined, // DateOnly format: "dd.MM.yyyy"
      EventClock: eventClock || undefined, // TimeOnly format: "HH:mm"
      EventLocation: event.location || undefined,
      EventKontenjan: event.quota ? Number(event.quota) : undefined,
      EventAbout: event.description || undefined, // Detaylı açıklama
      MiniAbout: event.shortDescription || event.description || undefined, // Kısa açıklama
    };

    return this.http.put<{ updated: number }>(`${this.apiUrl}/update/${id}`, updateDto).pipe(
      catchError((error) => {
        console.error('Etkinlik güncellenemedi:', error);
        throw error;
      })
    );
  }

  // Etkinlik sil (Backend: DELETE /api/Events/delete/{id})
  // Auth interceptor automatically adds Authorization header if token exists
  deleteEvent(id: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/delete/${id}`).pipe(
      catchError((error) => {
        console.error('Etkinlik silinemedi:', error);
        throw error;
      })
    );
  }

  // Etkinlik görseli yükle (Backend: POST /api/Events/{id}/image)
  // Auth interceptor automatically adds Authorization header if token exists
  // FormData için Content-Type header'ı eklenmemeli (browser otomatik ekler)
  uploadEventImage(eventId: number, file: File): Observable<{ ImagePath: string; imagePath?: string }> {
    const formData = new FormData();
    // Backend'in beklediği parametre adı (EventImageUploadRequest.File)
    formData.append('File', file, file.name);

    // FormData için Content-Type header'ı EKLEME - browser otomatik multipart/form-data ekler
    // Topluluk banner/logo yükleme ile aynı pattern (options objesi yok)
    return this.http.post<{ ImagePath?: string; imagePath?: string }>(`${this.apiUrl}/${eventId}/image`, formData).pipe(
      map((response) => {
        // Backend'den imagePath (küçük harf) veya ImagePath (büyük harf) gelebilir
        const path = response.ImagePath || response.imagePath || '';
          // Backend'den `/assets/img/Etkinlikler/...` formatında gelir, `/ImagesUnides/Etkinlikler/...` formatına çevir
          if (path && !path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('data:')) {
            let finalPath = path;
            if (!finalPath.startsWith('/')) {
              finalPath = '/' + finalPath;
            }
            // Path dönüşümü: `/assets/img/` -> `/ImagesUnides/`
            if (finalPath.startsWith('/assets/img/')) {
              finalPath = finalPath.replace('/assets/img/', '/ImagesUnides/');
            } else if (finalPath.startsWith('/images/')) {
              finalPath = finalPath.replace('/images/', '/ImagesUnides/');
            }
            // Etkinlikler klasörü kontrolü - eğer path Etkinlikler içermiyorsa ekle
            if (finalPath.startsWith('/ImagesUnides/') && !finalPath.includes('/Etkinlikler/') && !finalPath.includes('/Duyurular/') && !finalPath.includes('/Banner/') && !finalPath.includes('/Logo/')) {
              const fileName = finalPath.replace('/ImagesUnides/', '');
              if (fileName && !fileName.includes('/')) {
                finalPath = `/ImagesUnides/Etkinlikler/${fileName}`;
              }
            }
            // Full URL oluştur
            const baseUrl = environment.apiUrl.replace('/api', '');
            const fullUrl = baseUrl + finalPath;
            return { ImagePath: fullUrl };
          }
          return { ImagePath: path };
      }),
      catchError((error) => {
        console.error('Etkinlik görseli yüklenemedi:', error);
        console.error('Hata detayı:', error.error);
        throw error;
      })
    );
  }

  // Etkinlik onayla (Backend: POST /api/Events/{id}/approve)
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  approveEvent(id: number, comment?: string): Observable<{ approved: boolean }> {
    const body = comment ? { comment } : {};

    return this.http.post<{ approved: boolean }>(`${this.apiUrl}/${id}/approve`, body).pipe(
      catchError((error) => {
        console.error('Etkinlik onaylanamadı:', error);
        throw error;
      })
    );
  }

  // Etkinlik reddet (Backend: POST /api/Events/{id}/reject)
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  rejectEvent(id: number, comment?: string): Observable<{ approved: boolean }> {
    const body = comment ? { comment } : {};

    return this.http.post<{ approved: boolean }>(`${this.apiUrl}/${id}/reject`, body).pipe(
      catchError((error) => {
        console.error('Etkinlik reddedilemedi:', error);
        throw error;
      })
    );
  }
}
