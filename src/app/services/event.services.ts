import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  status?: 'Onaylandı' | 'Beklemede' | 'Reddedildi';
  capacity?: string;
}

// Backend DTO interfaces
interface EventListItemDto {
  etkinlikId: number;
  etkinlikAdi: string;
  resimUrl?: string;
  kisaAciklama?: string;
  baslangicTarihi: string;
  bitisTarihi: string;
  konum?: string;
  comId: string; // Guid
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
    return {
      id: dto.etkinlikId || dto.EtkinlikId || dto.id || 0,
      title: dto.etkinlikAdi || dto.EtkinlikAdi || dto.title || '',
      shortDescription: dto.kisaAciklama || dto.KisaAciklama || '',
      description: dto.detayliAciklama || dto.DetayliAciklama || '',
      startDate: dto.baslangicTarihi 
        ? (typeof dto.baslangicTarihi === 'string' ? dto.baslangicTarihi : new Date(dto.baslangicTarihi).toISOString())
        : (dto.BaslangicTarihi || ''),
      endDate: dto.bitisTarihi
        ? (typeof dto.bitisTarihi === 'string' ? dto.bitisTarihi : new Date(dto.bitisTarihi).toISOString())
        : (dto.BitisTarihi || ''),
      location: dto.konum || dto.Konum || '',
      communityId: dto.comId || dto.ComId || dto.toplulukId || dto.ToplulukId || 0,
      imageUrl: dto.resimUrl || dto.ResimUrl || '',
      status: 'Beklemede', // Backend'de status yok, varsayılan olarak Beklemede
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
        const apiEvents = list.map((dto) => this.mapToEvent(dto));
        // Mock events'i kaldırdık, sadece backend'den gelenleri döndürüyoruz
        return apiEvents;
      }),
      catchError((error) => {
        console.error('Etkinlikler yüklenemedi:', error);
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
        console.error('Etkinlik detayı yüklenemedi:', error);
        throw error;
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
        ? (typeof event.startDate === 'string' ? event.startDate : new Date(event.startDate).toISOString())
        : new Date().toISOString(),
      bitisTarihi: event.endDate
        ? (typeof event.endDate === 'string' ? event.endDate : new Date(event.endDate).toISOString())
        : new Date().toISOString(),
      konum: event.location,
      comId: event.comId || (typeof event.communityId === 'string' ? event.communityId : String(event.communityId)),
    };

    return this.http.post<{ eventId: number }>(`${this.apiUrl}/create`, createDto, { headers }).pipe(
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
        ? (typeof event.startDate === 'string' ? event.startDate : new Date(event.startDate).toISOString())
        : new Date().toISOString(),
      bitisTarihi: event.endDate
        ? (typeof event.endDate === 'string' ? event.endDate : new Date(event.endDate).toISOString())
        : new Date().toISOString(),
      konum: event.location,
    };

    return this.http.put<{ updated: number }>(`${this.apiUrl}/update/${id}`, updateDto, { headers }).pipe(
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
