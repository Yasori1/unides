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
    {
      id: 3,
      title: 'Dijital Girişimcilik Akademisi',
      category: 'Kariyer & Eğitim',
      date: 'Her Cumartesi',
      description: 'Fikrini girişime dönüştürmek isteyenler için 8 haftalık eğitim programı.',
      image:
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop',
      status: 'active',
      location: 'Online',
    },
    {
      id: 4,
      title: 'Yapay Zeka ve Sanat Sergisi',
      category: 'Kültür & Sanat',
      date: 'Ocak 2026',
      description: 'Yapay zeka araçlarıyla üretilen eserlerin sergileneceği büyük buluşma.',
      image:
        'https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?q=80&w=1000&auto=format&fit=crop',
      status: 'upcoming',
      location: 'İzmir',
    },
    {
      id: 5,
      title: 'Kış Müzik Festivali',
      category: 'Eğlence',
      date: '15 Şubat 2026',
      description: 'Ünlü grupların sahne alacağı, karlar altında sıcak bir müzik şöleni.',
      image:
        'https://images.unsplash.com/photo-1459749411177-287ce3276916?q=80&w=1000&auto=format&fit=crop',
      status: 'upcoming',
      location: 'Uludağ',
    },
    {
      id: 6,
      title: 'Robotik Atölyesi',
      category: 'Teknoloji',
      date: 'Her Çarşamba',
      description: 'Kendi robotunu tasarla ve kodla. Malzemeler bizden!',
      image:
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop',
      status: 'active',
      location: 'Maker Lab',
    },
  ];

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
    return this.http.get<any[]>(`${this.apiUrl}/all`).pipe(
      map((list) => list.map((dto) => this.mapToEvent(dto))),
      catchError((error) => {
        console.error('Etkinlikler yüklenemedi:', error);
        return of([]);
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
