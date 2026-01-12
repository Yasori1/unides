import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface EventItem {
  id: number;
  title: string;
  shortDescription?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  communityId: number;
  communityName?: string;
  imageUrl?: string;
  status?: 'Onaylandı' | 'Beklemede' | 'Reddedildi';
  capacity?: string;
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

  private mapToEvent(dto: any): EventItem {
    return {
      id: dto.etkinlikId || dto.EtkinlikId || dto.id || 0,
      title: dto.etkinlikAdi || dto.EtkinlikAdi || dto.title || '',
      shortDescription: dto.kisaAciklama || dto.KisaAciklama || '',
      description: dto.detayliAciklama || dto.DetayliAciklama || '',
      startDate: dto.baslangicTarihi || dto.BaslangicTarihi,
      endDate: dto.bitisTarihi || dto.BitisTarihi,
      location: dto.konum || dto.Konum || '',
      communityId: dto.toplulukId || dto.ToplulukId || 0,
      imageUrl: dto.resimUrl || dto.ResimUrl || '',
      status: 'Beklemede',
    };
  }

  getAll(): Observable<EventItem[]> {
    // API çağrısı yap, hata alırsan veya sonuç dönerse üzerine mock verileri ekle
    return this.http.get<any[]>(`${this.apiUrl}/all`).pipe(
      map((list) => {
        const apiEvents = list.map((dto) => this.mapToEvent(dto));
        return [...this.mockEvents, ...apiEvents];
      }),
      catchError((error) => {
        console.error('Etkinlikler yüklenemedi (API), mock veri dönülüyor:', error);
        return of([...this.mockEvents]);
      })
    );
  }

  // Yeni etkinlik ekleme (Mock)
  addEvent(event: Partial<EventItem>): Observable<EventItem> {
    const newItem: EventItem = {
      id: Date.now(), // Basit ID üretimi
      title: event.title || '',
      description: event.description || '',
      shortDescription: event.shortDescription || event.description || '',
      startDate: event.startDate || '',
      location: event.location || '',
      imageUrl: event.imageUrl || '',
      communityId: event.communityId || 0,
      communityName: event.communityName || '',
      status: 'Beklemede',
      ...event
    } as EventItem;
    
    this.mockEvents.unshift(newItem);
    return of(newItem).pipe(delay(500)); // Network gecikmesi simülasyonu
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
