import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.services';

export interface Announcement {
  id: number;
  title: string;
  shortDescription: string;
  content: string;
  date: string;
  image: string;
  link: string;
}

// Backend'den gelen format (camelCase - API response)
interface AnnouncementListItemDto {
  annId: number;
  title: string;
  shortDescription: string;
  annDate?: string; // List endpoint'inde annDate dönüyor (camelCase)
  imagePath?: string;
  link?: string;
}

interface AnnouncementDetailDto {
  annId?: number;
  AnnId?: number; // PascalCase fallback
  title?: string;
  Title?: string; // PascalCase fallback
  shortDescription?: string;
  ShortDescription?: string; // PascalCase fallback
  eventDate?: string; // Detail endpoint'inde eventDate dönüyor (camelCase)
  EventDate?: string; // PascalCase fallback
  annDate?: string; // Bazen annDate de olabilir
  AnnDate?: string; // PascalCase fallback
  description?: string; // camelCase
  Description?: string; // PascalCase fallback
  link?: string;
  Link?: string; // PascalCase fallback
  imagePath?: string;
  ImagePath?: string; // PascalCase fallback
}

// Backend'e gönderilecek format (Swagger'a göre camelCase)
interface CreateAnnouncementRequest {
  title: string;
  shortDescription?: string;
  annDate?: string;
  description?: string;
  link?: string;
  imagePath?: string;
}

interface UpdateAnnouncementRequest {
  annId?: number; // Backend body'de de bekliyor
  title: string;
  shortDescription?: string;
  annDate?: string;
  description?: string;
  link?: string;
  imagePath?: string;
}

// Mock Data for fallback
const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 901,
    title: 'YÖK 2024-2025 Akademik Takvim Genelgesi Yayınlandı',
    shortDescription: 'Yükseköğretim Kurulu tarafından üniversitelerin akademik takvimlerine ilişkin yeni usul ve esaslar belirlenmiştir.',
    content: 'Yükseköğretim Kurulu (YÖK) tarafından 81 ildeki üniversitelere gönderilen genelge ile 2024-2025 eğitim öğretim yılı akademik takvimi belirlenmiştir. <br><br> <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop" alt="Akademik Takvim Görseli"> <br><br> Bu kapsamda güz ve bahar dönemlerinin başlangıç ve bitiş tarihleri, sınav dönemleri ve tatil süreleri yeniden düzenlenmiştir. Öğrencilerin ders kayıt işlemlerini belirtilen tarihler arasında yapmaları önem arz etmektedir.',
    date: '2024-08-15',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000&auto=format&fit=crop',
    link: 'https://yok.gov.tr'
  },
  {
    id: 902,
    title: 'Gençlik ve Spor Bakanlığı GSB Burs Başvuruları',
    shortDescription: '2024-2025 eğitim öğretim yılı için GSB burs ve kredi başvuruları başlamıştır. Son başvuru tarihini kaçırmayın.',
    content: 'Gençlik ve Spor Bakanlığı (GSB) Kredi ve Yurtlar Genel Müdürlüğü tarafından yürütülen burs ve öğrenim kredisi başvuruları e-Devlet üzerinden erişime açılmıştır. Başvurular 15 Ekim 2024 tarihine kadar devam edecektir. Maddi desteğe ihtiyaç duyan tüm üniversite öğrencileri başvurularını zamanında tamamlamalıdır.',
    date: '2024-09-01',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop',
    link: 'https://gsb.gov.tr'
  },
  {
    id: 903,
    title: 'TÜBİTAK 2209-A Proje Destek Miktarları Artırıldı',
    shortDescription: 'Sanayi ve Teknoloji Bakanlığı, üniversite öğrencilerine yönelik proje destek limitlerinde güncellemeye gitti.',
    content: 'TÜBİTAK Bilim İnsanı Destek Programları Başkanlığı (BİDEB) tarafından yürütülen 2209-A Üniversite Öğrencileri Araştırma Projeleri Destekleme Programı kapsamında proje destek üst limitleri artırılmıştır. Yeni düzenleme ile birlikte lisans öğrencileri araştırma projeleri için daha fazla bütçe kullanabileceklerdir.',
    date: '2024-10-10',
    image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?q=80&w=1000&auto=format&fit=crop',
    link: 'https://tubitak.gov.tr'
  }
];

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private apiUrl = '/api/Announcements';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Backend formatını frontend formatına dönüştür
  private mapToAnnouncement(dto: any): Announcement {
    // Backend camelCase dönüyor, hem camelCase hem PascalCase destekle
    const annId = dto.annId || dto.AnnId || dto.id || 0;
    let title = dto.title || dto.Title || '';
    let shortDescription = dto.shortDescription || dto.ShortDescription || '';

    // "string" placeholder değerlerini filtrele
    if (title.toLowerCase().trim() === 'string') {
      title = '';
    }
    if (shortDescription.toLowerCase().trim() === 'string') {
      shortDescription = '';
    }

    // Tarih alanı - hem camelCase hem PascalCase, hem annDate hem eventDate
    const dateField = dto.annDate || dto.AnnDate || dto.eventDate || dto.EventDate;
    
    // Tarihi Date objesine çevir (ISO string ise) veya string olarak bırak
    let dateValue: string;
    if (dateField) {
      if (typeof dateField === 'string') {
        // ISO string formatındaysa Date objesine çevir, sonra string'e
        try {
          const dateObj = new Date(dateField);
          dateValue = dateObj.toISOString().split('T')[0];
        } catch {
          dateValue = dateField;
        }
      } else if (dateField instanceof Date) {
        dateValue = dateField.toISOString().split('T')[0];
      } else {
        dateValue = new Date().toISOString().split('T')[0];
      }
    } else {
      dateValue = new Date().toISOString().split('T')[0];
    }

    // Description alanı (sadece detail endpoint'inde gelir)
    let description = dto.description || dto.Description || null;
    if (description && description.toLowerCase().trim() === 'string') {
      description = null;
    }

    // Image ve Link alanları
    let imagePath = dto.imagePath || dto.ImagePath || '';
    let link = dto.link || dto.Link || '';
    
    // "string" placeholder değerlerini filtrele
    if (imagePath.toLowerCase().trim() === 'string') {
      imagePath = '';
    }
    if (link.toLowerCase().trim() === 'string') {
      link = '';
    }

    return {
      id: annId,
      title: title,
      shortDescription: shortDescription,
      // Description varsa onu kullan, yoksa ShortDescription kullan
      content: description || shortDescription || '',
      date: dateValue,
      image: imagePath,
      link: link,
    };
  }

  getAllAnnouncements(): Observable<Announcement[]> {
    return this.http.get<any[]>(`${this.apiUrl}/list`).pipe(
      map((response) => {
        // Backend camelCase dönüyor: { annId, title, shortDescription, annDate, imagePath }
        return response.map((dto) => this.mapToAnnouncement(dto));
      }),
      catchError((error) => {
        console.error('Duyurular yüklenemedi, mock data dönülüyor:', error);
        // Hata durumunda mock datayı dön
        return of(MOCK_ANNOUNCEMENTS); 
      })
    );
  }

  getAnnouncementById(id: number): Observable<Announcement | undefined> {
    return this.http.get<any>(`${this.apiUrl}/detail/${id}`).pipe(
      map((response) => this.mapToAnnouncement(response)),
      catchError((error) => {
        console.error('Duyuru detayı yüklenemedi, mock data aranıyor:', error);
        const mock = MOCK_ANNOUNCEMENTS.find(a => a.id === id);
        return of(mock);
      })
    );
  }

  createAnnouncement(announcement: {
    title: string;
    shortDescription?: string;
    content?: string;
    date?: string;
    image?: string;
    link?: string;
  }): Observable<number> {
    // Swagger'a göre camelCase formatında gönderilmeli
    const request: CreateAnnouncementRequest = {
      title: announcement.title,
      shortDescription: announcement.shortDescription,
      description: announcement.content,
      link: announcement.link,
      imagePath: announcement.image,
      // annDate ISO 8601 formatında olmalı: 2025-12-06T16:49:01.554Z
      annDate: announcement.date
        ? new Date(announcement.date).toISOString()
        : new Date().toISOString(), // Eğer tarih verilmemişse şu anki tarihi kullan
    };

    // Backend ActionResult<int> dönüyor, JSON olarak number gelir
    // Swagger'a göre camelCase formatında gönderilmeli
    // Authorization header'ını manuel olarak ekle
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });

    return this.http.post<number>(`${this.apiUrl}/create`, request, { headers }).pipe(
      catchError((error) => {
        console.error('Duyuru oluşturulamadı:', error);
        console.error('Hata detayı:', error.error);
        console.error('Request body:', JSON.stringify(request, null, 2));
        throw error;
      })
    );
  }

  updateAnnouncement(
    id: number,
    announcement: {
      title: string;
      shortDescription?: string;
      content?: string;
      date?: string;
      image?: string;
      link?: string;
    }
  ): Observable<void> {
    // Backend camelCase formatında bekliyor: { annId, title, shortDescription, annDate, description, link, imagePath }
    const request: UpdateAnnouncementRequest = {
      annId: id, // Backend body'de de bekliyor
      title: announcement.title.trim(),
      shortDescription: announcement.shortDescription?.trim(),
      description: announcement.content?.trim(),
      link: announcement.link?.trim(),
      imagePath: announcement.image?.trim(),
      // annDate ISO 8601 formatında olmalı: 2025-12-06T17:42:28.785Z
      annDate: announcement.date ? new Date(announcement.date).toISOString() : undefined,
    };

    // PUT /api/Announcements/update/{id} - NoContent döner
    // Authorization header'ını manuel olarak ekle
    const token = this.authService.getToken();
    
    if (!token) {
      throw new Error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
    }
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

    return this.http.put<void>(`${this.apiUrl}/update/${id}`, request, { headers }).pipe(
      catchError((error) => {
        console.error('Duyuru güncellenemedi:', error);
        console.error('Hata detayı:', error.error);
        console.error('Request body:', JSON.stringify(request, null, 2));
        throw error;
      })
    );
  }

  deleteAnnouncement(id: number): Observable<void> {
    // DELETE /api/Announcements/delete/{id} - NoContent döner
    // Authorization header'ını manuel olarak ekle
    const token = this.authService.getToken();
    
    if (!token) {
      throw new Error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
    }
    
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`, { headers }).pipe(
      catchError((error) => {
        console.error('Duyuru silinemedi:', error);
        console.error('Hata detayı:', error.error);
        throw error;
      })
    );
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    // Authorization header'ını manuel olarak ekle
    // FormData kullanıldığında Content-Type header'ını eklemeyiz (browser otomatik ekler)
    const token = this.authService.getToken();
    
    if (!token) {
      throw new Error('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
    }
    
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    // Backend { imageUrl: string } formatında döndürüyor
    interface UploadResponse {
      imageUrl: string;
    }

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload-image`, formData, { headers }).pipe(
      map((response) => response.imageUrl || response as any), // imageUrl varsa onu döndür, yoksa string olarak döndür
      catchError((error) => {
        console.error('Görsel yüklenemedi:', error);
        console.error('Hata detayı:', error.error);
        throw error;
      })
    );
  }
}
