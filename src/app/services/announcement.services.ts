import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Announcement {
  id: number;
  title: string;
  shortDescription: string;
  content: string;
  date: string;
  image: string;
  link: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  // Mock data - Gerçek uygulamada API'den gelecek
  private mockAnnouncements: Announcement[] = [
    {
      id: 1,
      title: 'Yeni Dönem Başlangıç Etkinliği',
      shortDescription: '2024-2025 akademik yılı açılış töreni ve tanışma etkinliği düzenlenecektir.',
      content: 'Değerli öğrencilerimiz, yeni akademik yılın başlaması nedeniyle büyük bir açılış töreni düzenliyoruz. Tüm öğrencilerimizi bekliyoruz. Etkinlikte çeşitli aktiviteler ve tanışma fırsatları olacaktır.',
      date: '2024-09-15',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      link: 'https://example.com/event1',
    },
    {
      id: 2,
      title: 'Kariyer Günleri 2024',
      shortDescription: 'Büyük firmaların katılımıyla kariyer günleri düzenleniyor.',
      content: 'Kariyer Günleri etkinliğimizde birçok önde gelen firma stant açacak ve iş imkanları sunacaktır. CV hazırlama ve mülakat teknikleri hakkında workshoplar da düzenlenecektir.',
      date: '2024-10-20',
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      link: 'https://example.com/career-days',
    },
    {
      id: 3,
      title: 'Teknoloji Semineri: Yapay Zeka',
      shortDescription: 'Yapay zeka alanında uzman konuşmacılar ile seminer serisi.',
      content: 'Yapay zeka teknolojilerinin güncel durumu ve geleceği hakkında kapsamlı bir seminer düzenleniyor. Alanında uzman konuşmacılar katılacak ve soru-cevap bölümü olacaktır.',
      date: '2024-11-05',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      link: '',
    },
  ];

  getAllAnnouncements(): Observable<Announcement[]> {
    // Gerçek uygulamada: return this.http.get<Announcement[]>('/api/announcements');
    return of(this.mockAnnouncements);
  }

  getAnnouncementById(id: number): Observable<Announcement | undefined> {
    // Gerçek uygulamada: return this.http.get<Announcement>(`/api/announcements/${id}`);
    const announcement = this.mockAnnouncements.find((a) => a.id === id);
    return of(announcement);
  }
}

