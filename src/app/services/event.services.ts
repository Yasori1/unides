import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger.util';
import { SKIP_AUTH } from '../core/http-context-tokens';

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
  /** Topluluğun üniversite adı (EventDetailDto.University) */
  university?: string;
  imageUrl?: string;
  status?: 'Onaylandı' | 'Beklemede' | 'Reddedildi' | 'Revize';
  capacity?: string;
  quota?: number; // Kontenjan (number olarak)
  /** Şehir (backend'den sadece eventCity alanı okunur, burada city olarak expose edilir) */
  city?: string;
  rejectionReason?: string; // Red nedeni / Revize nedeni (ConfirmAbout)
  /** İletişim e-postası (Backend EventDetailDto: ComMail — topluluk iletişim maili) */
  contactEmail?: string;
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
  /** Topluluğun üniversite adı (GetAllEvents, UpcomingHome, CommunityEvents, PendingEvents) */
  university?: string;
  University?: string;
  /** Etkinlik şehri (Event.EventCity — tek alan, liste ve detay DTO'da eventCity) */
  eventCity?: string;
  EventCity?: string;
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
  eventCity?: string; // Backend: EventCity (optional) — etkinlik şehri
  eventLocation?: string; // Backend: EventLocation (optional) — mekan / adres
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
  EventCity?: string; // Etkinlik şehri (manuel)
  EventLocation?: string; // Mekan / adres detayı
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

    // Tam URL ise (http/https) sadece path kısmını al — link bağlamada /ImagesUnides/ kullanılıyor
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
      try {
        const pathname = new URL(pathStr).pathname;
        if (pathname.startsWith('/ImagesUnides/')) return pathname;
        if (pathname.startsWith('/images/')) return pathname.replace('/images/', '/ImagesUnides/');
        if (pathname.startsWith('/assets/img/')) return pathname.replace('/assets/img/', '/ImagesUnides/');
        return pathname || pathStr;
      } catch {
        return pathStr;
      }
    }
    if (pathStr.startsWith('data:') || pathStr.startsWith('blob:')) {
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

    // ImagePath olarak sadece /ImagesUnides/ path döndür (link bağlamada tam URL yok)
    return finalPath;
  }

  private mapToEvent(dto: EventListItemDto | any): EventItem {
    // Backend'den gelen DTO'yu EventItem'a çevir
    // Backend EventListItemDto: EventId, EventName, ..., CommunityName, University (e.Community?.University), City, EventConfirm

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
        dto.toplulukId || dto.ToplulukId || dto.comId || dto.ComId || dto.communityId || dto.CommunityId || 0,
      communityName: dto.communityName || dto.CommunityName || '',
      university: dto.university || dto.University || '',
      communityLogo: (() => {
        // Backend'den gelen logo path'i al - farklı field adlarını kontrol et
        const rawLogoPath = dto.communityLogo || dto.CommunityLogo || dto.logoUrl || dto.LogoUrl || dto.communityLogoUrl || dto.CommunityLogoUrl || '';
        const logoPathStr = rawLogoPath ? String(rawLogoPath).trim() : '';

        // Debug: Backend'den gelen logo path'i logla (sadece development modunda)
        if (logoPathStr) {
          Logger.log('[mapToEvent] Raw logo path from backend:', logoPathStr, 'Event ID:', dto.eventId || dto.EventId);
        } else {
          Logger.warn('[mapToEvent] Logo path is empty or undefined for Event ID:', dto.eventId || dto.EventId, 'DTO keys:', Object.keys(dto));
        }

        // "string", "null", "undefined" gibi placeholder değerleri kontrol et
        const normalizedPath = logoPathStr.toLowerCase().trim();
        if (normalizedPath === 'string' || normalizedPath === 'null' || normalizedPath === 'undefined' || !logoPathStr) {
          return undefined;
        }

        // Tam URL ise (http/https) sadece path kısmını al
        if (logoPathStr.startsWith('http://') || logoPathStr.startsWith('https://')) {
          try {
            const pathname = new URL(logoPathStr).pathname;
            if (pathname.startsWith('/ImagesUnides/')) return pathname;
            if (pathname.startsWith('/images/')) return pathname.replace('/images/', '/ImagesUnides/');
            if (pathname.startsWith('/assets/img/')) return pathname.replace('/assets/img/', '/ImagesUnides/');
            return pathname || logoPathStr;
          } catch {
            return logoPathStr;
          }
        }
        if (logoPathStr.startsWith('data:') || logoPathStr.startsWith('blob:')) {
          return logoPathStr;
        }

        // Logo için özel path dönüşümü - Logo klasörüne yönlendir
        let finalLogoPath = logoPathStr;
        if (!finalLogoPath.startsWith('/')) {
          finalLogoPath = '/' + finalLogoPath;
        }

        // Path dönüşümü: `/assets/img/` -> `/ImagesUnides/`
        if (finalLogoPath.startsWith('/assets/img/')) {
          finalLogoPath = finalLogoPath.replace('/assets/img/', '/ImagesUnides/');
        }
        else if (finalLogoPath.startsWith('/images/')) {
          finalLogoPath = finalLogoPath.replace('/images/', '/ImagesUnides/');
        }

        // Logo klasörü için özel kontrol
        if (finalLogoPath.startsWith('/ImagesUnides/') && !finalLogoPath.includes('/Logo/') && !finalLogoPath.includes('/Etkinlikler/') && !finalLogoPath.includes('/Duyurular/') && !finalLogoPath.includes('/Banner/')) {
          const fileName = finalLogoPath.replace('/ImagesUnides/', '');
          if (fileName && !fileName.includes('/')) {
            finalLogoPath = `/ImagesUnides/Logo/${fileName}`;
          }
        }
        else if (!finalLogoPath.startsWith('/ImagesUnides/') && !finalLogoPath.startsWith('http') && !finalLogoPath.startsWith('data:') && finalLogoPath.length > 0 && !finalLogoPath.includes('/')) {
          finalLogoPath = `/ImagesUnides/Logo/${finalLogoPath}`;
        }

        return finalLogoPath;
      })(), // Topluluk logosu (opsiyonel)
      imageUrl: (() => {
        // Backend'den gelen image path'i al - farklı field adlarını kontrol et
        const rawImagePath = dto.eventPictureLink || dto.EventPictureLink || dto.resimUrl || dto.ResimUrl || dto.imageUrl || dto.ImageUrl || '';
        const imagePathStr = rawImagePath ? String(rawImagePath).trim() : '';

        // "string", "null", "undefined" gibi placeholder değerleri kontrol et
        const normalizedPath = imagePathStr.toLowerCase().trim();
        if (normalizedPath === 'string' || normalizedPath === 'null' || normalizedPath === 'undefined' || !imagePathStr) {
          return '';
        }

        // Debug: Backend'den gelen raw image path'i logla (sadece development modunda ve geçerli path'ler için)
        if (imagePathStr && imagePathStr.length > 0 && normalizedPath !== 'string') {
          Logger.log('[mapToEvent] Raw image path from backend:', imagePathStr, 'Event ID:', dto.eventId || dto.EventId);
        }

        // convertImagePathToFullUrl ile işle
        const convertedUrl = this.convertImagePathToFullUrl(imagePathStr);

        // Debug: Convert edilmiş URL'yi logla (sadece development modunda)
        if (convertedUrl && convertedUrl.length > 0) {
          Logger.log('[mapToEvent] Converted image URL:', convertedUrl, 'Event ID:', dto.eventId || dto.EventId);
        }

        return convertedUrl;
      })(),
      status: status,
      capacity:
        dto.eventKontenjan || dto.EventKontenjan
          ? String(dto.eventKontenjan || dto.EventKontenjan)
          : undefined,
      quota: (() => {
        // Backend'den gelen kontenjan değerini number olarak map et
        // Önce tüm olası field adlarını kontrol et
        const kontenjan = dto.eventKontenjan ?? dto.EventKontenjan ?? (dto as any).kontenjan ?? (dto as any).Kontenjan;

        // Debug: Backend'den gelen kontenjan değerini logla (sadece development modunda)
        Logger.log('[mapToEvent] Kontenjan kontrolü - Raw value:', kontenjan, 'Tip:', typeof kontenjan, 'Event ID:', dto.eventId || dto.EventId);
        Logger.log('[mapToEvent] DTO eventKontenjan:', dto.eventKontenjan, 'EventKontenjan:', dto.EventKontenjan);

        // null, undefined veya boş string kontrolü
        if (kontenjan === null || kontenjan === undefined || kontenjan === '') {
          Logger.warn('[mapToEvent] Kontenjan bulunamadı veya boş, Event ID:', dto.eventId || dto.EventId, 'DTO keys:', Object.keys(dto));
          return 0; // Sınırsız gösterilir
        }

        // String ise number'a çevir
        const numValue = typeof kontenjan === 'number' ? kontenjan : Number(kontenjan);

        // NaN kontrolü yap
        if (isNaN(numValue)) {
          Logger.warn('[mapToEvent] Kontenjan number\'a çevrilemedi:', kontenjan, 'Event ID:', dto.eventId || dto.EventId);
          return 0; // Sınırsız gösterilir
        }

        // Negatif değerler için 0 döndür (sınırsız gösterilir)
        // 0 ve pozitif değerler için direkt döndür (0 da geçerli bir değer olabilir, ama genelde sınırsız anlamına gelir)
        const result = numValue >= 0 ? numValue : 0;
        return result;
      })(),
      city: dto.eventCity || dto.EventCity || '',
      contactEmail: (() => {
        const raw = (dto as any).comMail ?? (dto as any).ComMail ?? (dto as any).contactEmail ?? (dto as any).ContactEmail;
        const s = typeof raw === 'string' ? raw.trim() : '';
        return s || undefined;
      })(),
      rejectionReason: (() => {
        // Backend'den gelen tüm olası field adlarını kontrol et
        const confirmAbout = (dto as any).ConfirmAbout || (dto as any).confirmAbout || (dto as any).ConfirmAbout || (dto as any).confirmAbout;
        const rejectionReason = (dto as any).RejectionReason || (dto as any).rejectionReason;

        return confirmAbout || rejectionReason || undefined;
      })(),
    };
  }

  /**
   * Backend: GET /api/Events/all?page=&pageSize=&search=&city=&sortBy=&sortOrder=
   * sortBy=name → etkinlik adına göre Türkçe A–Z/Z–A; sortBy=date veya boş → tarihe göre (en yakın/en uzak).
   * sortOrder=asc veya boş → tarih için en yakın önce, isim için A–Z; sortOrder=desc → tersi.
   * Filtre/sıralama değişince page=1 ile, sayfa değişince sadece page ile yeniden istek atın.
   */
  getEventsPage(
    page: number = 1,
    pageSize: number = 12,
    filters?: { search?: string; city?: string; sortBy?: 'name' | 'date'; sortOrder?: 'asc' | 'desc' }
  ): Observable<{
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    items: EventItem[];
  }> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (filters?.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters?.city?.trim()) params = params.set('city', filters.city.trim());
    if (filters?.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters?.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    return this.http
      .get<{ page?: number; pageSize?: number; totalCount?: number; totalPages?: number; items?: any[] }>(
        `${this.apiUrl}/all`,
        { params }
      )
      .pipe(
        map((response) => {
          const rawItems = response.items ?? (Array.isArray(response) ? response : []);
          const items = rawItems.map((dto) => this.mapToEvent(dto));
          return {
            page: response.page ?? page,
            pageSize: response.pageSize ?? pageSize,
            totalCount: response.totalCount ?? items.length,
            totalPages: response.totalPages ?? Math.max(1, Math.ceil((response.totalCount ?? items.length) / pageSize)),
            items,
          };
        }),
        catchError(() => {
          return of({ page: 1, pageSize: pageSize, totalCount: 0, totalPages: 0, items: [] });
        })
      );
  }

  /**
   * Anasayfa için yaklaşan etkinlikler.
   * Backend: GET /api/Events/upcoming/home — AllowAnonymous, sabit 6 etkinlik (GetHomePageEventsQuery(6)).
   */
  getUpcomingEventsForHome(): Observable<EventItem[]> {
    const context = new HttpContext().set(SKIP_AUTH, true);
    return this.http.get<any[]>(`${this.apiUrl}/upcoming/home`, { context }).pipe(
      map((list) => (Array.isArray(list) ? list : []).map((dto) => this.mapToEvent(dto))),
      catchError(() => of([]))
    );
  }

  // Eski davranış: GET /api/Events/all ile sayfalı çekip client'ta filtreler (geriye dönük uyumluluk)
  getHomeUpcomingEvents(limit: number = 6): Observable<EventItem[]> {
    return this.getEventsPage(1, Math.max(limit, 12)).pipe(
      map((res) => {
        const mappedEvents = res.items;
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
        return futureEvents.slice(0, limit);
      }),
      catchError(() => of([]))
    );
  }

  // Tüm etkinlikleri getir (Backend: GET /api/Events/all — sayfalı; tek sayfa büyük pageSize)
  getAll(): Observable<EventItem[]> {
    return this.getEventsPage(1, 9999).pipe(
      map((res) => res.items),
      catchError(() => of([]))
    );
  }

  /** Sayfalı status response tipi (Backend: page, pageSize, pendingTotalCount, acceptedTotalCount, rejectedTotalCount, pending, accepted, rejected) */
  getByStatusPagedResponse(page: number, pageSize: number, statuses: number[]): Observable<{
    items: EventItem[];
    page: number;
    pageSize: number;
    pendingTotalCount: number;
    acceptedTotalCount: number;
    rejectedTotalCount: number;
    totalCount: number;
  }> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    statuses.forEach((status) => {
      params = params.append('status', status.toString());
    });

    return this.http.get<any>(`${this.apiUrl}/status`, { params }).pipe(
      map((response: any) => {
        if (!response) {
          return {
            items: [],
            page: 1,
            pageSize: pageSize,
            pendingTotalCount: 0,
            acceptedTotalCount: 0,
            rejectedTotalCount: 0,
            totalCount: 0,
          };
        }
        const pending = response.Pending || response.pending || [];
        const accepted = response.Accepted || response.accepted || [];
        const rejected = response.Rejected || response.rejected || [];
        const pendingTotalCount = response.pendingTotalCount ?? response.PendingTotalCount ?? 0;
        const acceptedTotalCount = response.acceptedTotalCount ?? response.AcceptedTotalCount ?? 0;
        const rejectedTotalCount = response.rejectedTotalCount ?? response.RejectedTotalCount ?? 0;

        const allDtos: EventListItemDto[] = [...pending, ...accepted, ...rejected];
        const items = allDtos.map((dto) => this.mapToEvent(dto));

        const totalCount =
          Number(pendingTotalCount) + Number(acceptedTotalCount) + Number(rejectedTotalCount);
        return {
          items,
          page: response.page ?? page,
          pageSize: response.pageSize ?? pageSize,
          pendingTotalCount: Number(pendingTotalCount),
          acceptedTotalCount: Number(acceptedTotalCount),
          rejectedTotalCount: Number(rejectedTotalCount),
          totalCount,
        };
      }),
      catchError(() =>
        of({
          items: [],
          page: 1,
          pageSize: pageSize,
          pendingTotalCount: 0,
          acceptedTotalCount: 0,
          rejectedTotalCount: 0,
          totalCount: 0,
        })
      )
    );
  }

  // Status'e göre etkinlikleri getir (Backend: GET /api/Events/status?status=0&status=1&status=2) — sayfasız, geriye dönük uyumluluk
  getByStatus(statuses: number[]): Observable<EventItem[]> {
    return this.getByStatusPagedResponse(1, 9999, statuses).pipe(map((res) => res.items));
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

          const pending = response.Pending || response.pending || [];
          const accepted = response.Accepted || response.accepted || [];
          const rejected = response.Rejected || response.rejected || [];

          const allEvents: EventListItemDto[] = [...pending, ...accepted, ...rejected];

          const mappedEvents = allEvents.map((dto) => this.mapToEvent(dto));

          return mappedEvents;
        }),
        catchError((error) => {
          // Hata durumunda boş array döndür
          return of([]);
        })
      );
  }

  // Etkinlik detayı — Ana sayfa / public: sadece onaylı + aktif (GET /api/Events/{id})
  getById(id: number): Observable<EventItem> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((dto) => this.mapToEvent(dto)),
      catchError((error: any) => {
        if (error?.status === 404) return throwError(() => error);
        throw error;
      })
    );
  }

  // Etkinlik detayı — Kurumsal / GSB dashboard: GET /api/Events/admin/{eventId}
  // Response: EventDetailDto (eventId, eventName, eventPictureLink, eventDate, eventClock, eventCity, eventLocation, eventKontenjan, eventAbout, miniAbout, eventConfirm, confirmAbout, updatedAt, confirmUpdatedAt, communityId, communityName, university, comMail)
  getByIdAdmin(eventId: number): Observable<EventItem> {
    return this.http.get<any>(`${this.apiUrl}/admin/${eventId}`).pipe(
      map((dto) => this.mapToEvent(dto)),
      catchError((error: any) => {
        if (error?.status === 404) return throwError(() => error);
        throw error;
      })
    );
  }

  // Yeni etkinlik ekleme
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

    // Backend .NET çoğu zaman PascalCase bekler (EventName, EventDate, ...)
    // EventPictureLink her zaman gönderiliyor (görsel yoksa null) - backend'de property varlığı beklenebilir
    const payload: Record<string, unknown> = {
      EventName: event.title || '',
      EventDate: eventDate,
      EventClock: eventClock,
      EventCity: event.city?.trim() || null,
      EventLocation: event.location?.trim() || '',
      EventAbout: event.description || '',
      MiniAbout: event.shortDescription || event.description || '',
      EventPictureLink: event.imageUrl || null,
    };
    if (event.quota != null) {
      const num = Number(event.quota);
      if (!Number.isNaN(num)) payload['EventKontenjan'] = num;
    }

    return this.http.post<{ eventId: number }>(`${this.apiUrl}/create`, payload).pipe(
      catchError((error) => {
        const errBody = error?.error;
        const msg = error?.error?.message || error?.error?.title || error?.message || 'Sunucu hatası';
        const detail = error?.error?.detail || error?.error?.errors || error?.error;
        // Backend CreateEventCommandHandler 500: topluluk bulunamadı / aktif değil / yetki yok (backend read-only)
        if (error?.status === 500) {
          const backendMsg = typeof errBody === 'string' && errBody.length > 0 ? errBody : null;
          (error as any).message = backendMsg ?? 'Etkinlik oluşturulamadı. Giriş yaptığınız hesabın topluluk yöneticisi (lider) olması ve topluluğunuzun aktif olması gerekir.';
        }
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
      EventCity: event.city?.trim() || undefined, // Etkinlik şehri (manuel)
      EventLocation: event.location?.trim() || undefined, // Mekan / adres
      EventKontenjan: event.quota ? Number(event.quota) : undefined,
      EventAbout: event.description || undefined, // Detaylı açıklama
      MiniAbout: event.shortDescription || event.description || undefined, // Kısa açıklama
    };

    return this.http.put<{ updated: number }>(`${this.apiUrl}/update/${id}`, updateDto).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // Etkinlik sil (Backend: DELETE /api/Events/delete/{id})
  // Auth interceptor automatically adds Authorization header if token exists
  deleteEvent(id: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/delete/${id}`).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // Etkinlik görseli yükle (Backend: POST /api/Events/{id}/image)
  // Auth interceptor automatically adds Authorization header if token exists
  // FormData için Content-Type header'ı eklenmemeli (browser otomatik ekler)
  uploadEventImage(eventId: number, file: File): Observable<{ ImagePath: string; imagePath?: string }> {
    const uploadUrl = `${this.apiUrl}/${eventId}/image`;
    const formData = new FormData();
    // Backend'in beklediği parametre adı (EventImageUploadRequest.File)
    formData.append('File', file, file.name);

    // FormData için Content-Type header'ı EKLEME - browser otomatik multipart/form-data ekler
    // Topluluk banner/logo yükleme ile aynı pattern (options objesi yok)
    return this.http.post<{ ImagePath?: string; imagePath?: string }>(uploadUrl, formData).pipe(
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
          return { ImagePath: finalPath };
        }
        // Backend tam URL döndüyse path kısmını al
        if (path.startsWith('http')) {
          try {
            const pathname = new URL(path).pathname;
            const norm = pathname.startsWith('/images/') ? pathname.replace('/images/', '/ImagesUnides/') : pathname.startsWith('/assets/img/') ? pathname.replace('/assets/img/', '/ImagesUnides/') : pathname;
            return { ImagePath: norm.startsWith('/ImagesUnides/') ? norm : '/ImagesUnides/' + norm.replace(/^\//, '') };
          } catch {
            return { ImagePath: path };
          }
        }
        return { ImagePath: path };
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  // Etkinlik onayla
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  approveEvent(id: number, comment?: string): Observable<{ approved: boolean }> {
    const body = comment ? { comment } : {};

    return this.http.post<{ approved: boolean }>(`${this.apiUrl}/${id}/approve`, body).pipe(
      catchError((error) => {
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
        throw error;
      })
    );
  }
}
