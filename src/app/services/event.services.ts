import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import { delay } from 'rxjs/operators';

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
  imageUrl?: string;
  status?: 'Onaylandı' | 'Beklemede' | 'Reddedildi' | 'Revize';
  capacity?: string;
  city?: string; // Şehir bilgisi
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
  // Eski field adları (fallback)
  kisaAciklama?: string;
  baslangicTarihi?: string;
  bitisTarihi?: string;
  konum?: string;
  comId?: string; // Guid
  ComId?: string;
}

interface CreateEventDto {
  etkinlikAdi: string;
  resimUrl?: string;
  kisaAciklama?: string;
  detayliAciklama?: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  konum?: string;
  comId: string; // Guid
}

interface UpdateEventDto {
  etkinlikAdi: string;
  resimUrl?: string;
  kisaAciklama?: string;
  detayliAciklama?: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  konum?: string;
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
  private apiUrl = '/api/Events';
  // Magic-card ve swipe-stack için mock veri havuzu
  private baseProjects: Project[] = [
    {
      id: 1,
      title: 'Kampüs Kodluyor Hackathonu',
      category: 'Yazılım & Teknoloji',
      date: '25 Kasım 2025',
      description:
        '48 saat sürecek maratonda takımlar en iyi dijital çözümü üretmek için yarışıyor.',
      image:
        'https://images.unsplash.com/photo-1504384308090-c54be3852f33?q=80&w=1000&auto=format&fit=crop',
      status: 'active',
      location: 'İstanbul Kampüs',
    },
    {
      id: 2,
      title: 'Sürdürülebilir Kampüs Zirvesi',
      category: 'Sosyal Sorumluluk',
      date: '10 Aralık 2025',
      description: 'Yeşil bir gelecek için üniversiteler arası işbirliği projeleri konuşuluyor.',
      image:
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1000&auto=format&fit=crop',
      status: 'upcoming',
      location: 'Ankara',
    },
    // ...
  ];

  // In-memory mock events for cross-component communication demo
  private mockEvents: EventItem[] = [];

  constructor(private http: HttpClient) {}

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
        // DateOnly ve TimeOnly'yi birleştir
        const dateTimeStr = `${dateStr}T${timeStr}`;
        const dateObj = new Date(dateTimeStr);
        // Geçerlilik kontrolü
        if (!isNaN(dateObj.getTime())) {
          startDate = dateObj.toISOString();
        } else {
          startDate = typeof eventDate === 'string' ? eventDate : '';
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
      imageUrl: dto.eventPictureLink || dto.EventPictureLink || dto.resimUrl || dto.ResimUrl || '',
      status: status,
      capacity:
        dto.eventKontenjan || dto.EventKontenjan
          ? String(dto.eventKontenjan || dto.EventKontenjan)
          : undefined,
      city: dto.city || dto.City || '',
    };
  }

  // Tüm etkinlikleri getir (Backend: GET /api/Events/all)
  getAll(): Observable<EventItem[]> {
    // Get auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`,
        })
      : undefined;

    return this.http.get<EventListItemDto[]>(`${this.apiUrl}/all`, { headers }).pipe(
      map((list) => {
        // Backend'den gelen etkinlikleri map et
        const apiEvents = list.map((dto) => {
          const mapped = this.mapToEvent(dto);
          return mapped;
        });
        // Mock events'i kaldırdık, sadece backend'den gelenleri döndürüyoruz
        return apiEvents;
      }),
      catchError((error) => {
        // Hata durumunda boş array döndür
        return of([]);
      })
    );
  }

  // Status'e göre etkinlikleri getir (Backend: GET /api/Events/status?status=0&status=1&status=2)
  // status: 0=Beklemede, 1=Onaylandı, 2=Reddedildi
  getByStatus(statuses: number[]): Observable<EventItem[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('Etkinlikleri görmek için giriş yapmanız gerekiyor.');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

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
      }>(`${this.apiUrl}/status`, { headers, params })
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('Etkinlikleri görmek için giriş yapmanız gerekiyor.');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Query parametrelerini oluştur: ?status=0&status=1&status=2
    let params = new HttpParams();
    if (statuses && statuses.length > 0) {
      statuses.forEach((status) => {
        params = params.append('status', status.toString());
      });
    }

    // Backend EventsByStatusDto döndürüyor: { Pending: [], Accepted: [], Rejected: [] }
    return this.http
      .get<{
        Pending: EventListItemDto[];
        Accepted: EventListItemDto[];
        Rejected: EventListItemDto[];
      }>(`${this.apiUrl}/community/${communityId}/events`, { headers, params })
      .pipe(
        map((response: any) => {
          if (!response) {
            return [];
          }

          // EventsByStatusDto: { Pending: EventListItemDto[], Accepted: EventListItemDto[], Rejected: EventListItemDto[] }
          const pending = response.Pending || response.pending || [];
          const accepted = response.Accepted || response.accepted || [];
          const rejected = response.Rejected || response.rejected || [];

          // Tüm status'leri birleştir
          const allEvents: EventListItemDto[] = [...pending, ...accepted, ...rejected];

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

  // Etkinlik detayını getir (Backend: GET /api/Events/{id})
  getById(id: number): Observable<EventItem> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`,
        })
      : undefined;

    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map((dto) => this.mapToEvent(dto)),
      catchError((error) => {
        // Hata durumunda sessizce handle et, component'te fallback var
        return of(null as any);
      })
    );
  }

  // Yeni etkinlik ekleme (Backend: POST /api/Events/create)
  createEvent(event: Partial<EventItem> & { comId: string }): Observable<{ eventId: number }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('Etkinlik oluşturmak için giriş yapmanız gerekiyor.');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const createDto: CreateEventDto = {
      etkinlikAdi: event.title || '',
      resimUrl: event.imageUrl,
      kisaAciklama: event.shortDescription || event.description,
      detayliAciklama: event.description,
      baslangicTarihi: event.startDate
        ? typeof event.startDate === 'string'
          ? event.startDate
          : new Date(event.startDate).toISOString()
        : new Date().toISOString(),
      bitisTarihi: event.endDate
        ? typeof event.endDate === 'string'
          ? event.endDate
          : new Date(event.endDate).toISOString()
        : new Date().toISOString(),
      konum: event.location,
      comId:
        event.comId ||
        (typeof event.communityId === 'string' ? event.communityId : String(event.communityId)),
    };

    return this.http
      .post<{ eventId: number }>(`${this.apiUrl}/create`, createDto, { headers })
      .pipe(
        catchError((error) => {
          console.error('Etkinlik oluşturulamadı:', error);
          throw error;
        })
      );
  }

  // Etkinlik güncelle (Backend: PUT /api/Events/update/{id})
  updateEvent(id: number, event: Partial<EventItem>): Observable<{ updated: number }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('Etkinlik güncellemek için giriş yapmanız gerekiyor.');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const updateDto: UpdateEventDto = {
      etkinlikAdi: event.title || '',
      resimUrl: event.imageUrl,
      kisaAciklama: event.shortDescription || event.description,
      detayliAciklama: event.description,
      baslangicTarihi: event.startDate
        ? typeof event.startDate === 'string'
          ? event.startDate
          : new Date(event.startDate).toISOString()
        : new Date().toISOString(),
      bitisTarihi: event.endDate
        ? typeof event.endDate === 'string'
          ? event.endDate
          : new Date(event.endDate).toISOString()
        : new Date().toISOString(),
      konum: event.location,
    };

    return this.http
      .put<{ updated: number }>(`${this.apiUrl}/update/${id}`, updateDto, { headers })
      .pipe(
        catchError((error) => {
          console.error('Etkinlik güncellenemedi:', error);
          throw error;
        })
      );
  }

  // Etkinlik sil (Backend: DELETE /api/Events/delete/{id})
  deleteEvent(id: number): Observable<{ deleted: boolean }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('Etkinlik silmek için giriş yapmanız gerekiyor.');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.delete<{ deleted: boolean }>(`${this.apiUrl}/delete/${id}`, { headers }).pipe(
      catchError((error) => {
        console.error('Etkinlik silinemedi:', error);
        throw error;
      })
    );
  }

  // Etkinlik onayla (Backend: POST /api/Events/{id}/approve)
  approveEvent(id: number, comment?: string): Observable<{ approved: boolean }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('Etkinlik onaylamak için giriş yapmanız gerekiyor.');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const body = comment ? { comment } : {};

    return this.http
      .post<{ approved: boolean }>(`${this.apiUrl}/${id}/approve`, body, { headers })
      .pipe(
        catchError((error) => {
          console.error('Etkinlik onaylanamadı:', error);
          throw error;
        })
      );
  }

  // Etkinlik reddet (Backend: POST /api/Events/{id}/reject)
  rejectEvent(id: number, comment?: string): Observable<{ approved: boolean }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('Etkinlik reddetmek için giriş yapmanız gerekiyor.');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const body = comment ? { comment } : {};

    return this.http
      .post<{ approved: boolean }>(`${this.apiUrl}/${id}/reject`, body, { headers })
      .pipe(
        catchError((error) => {
          console.error('Etkinlik reddedilemedi:', error);
          throw error;
        })
      );
  }

  // --- Magic-card / swipe-stack mock veri kaynakları ---
  getEvents(): Observable<Project[]> {
    let bigData: Project[] = [];
    for (let i = 0; i < 15; i++) {
      const batch = this.baseProjects.map((p) => ({
        ...p,
        id: p.id + i * 100,
        title: i === 0 ? p.title : `${p.title} #${i}`,
      }));
      bigData = [...bigData, ...batch];
    }
    return of(bigData).pipe(delay(300));
  }

  getRandomSwipeEvents(count: number, excludedIds: number[]): Observable<Project[]> {
    let bigData: Project[] = [];
    for (let i = 0; i < 15; i++) {
      const batch = this.baseProjects.map((p) => ({
        ...p,
        id: p.id + i * 100,
        title: `${p.title} (Öneri)`,
      }));
      bigData = [...bigData, ...batch];
    }

    const available = bigData.filter((p) => !excludedIds.includes(p.id));
    const shuffled = available.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    return of(selected).pipe(delay(300));
  }
}
