import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.services';
import { environment } from '../../environments/environment';

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


@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}/Announcements`;

  private DEMO_ANNOUNCEMENT: Announcement = {
    id: 9999,
    title: 'Demo Duyuru: Unides Platformu Yayında!',
    shortDescription: 'Unides platformunun ilk demo duyurusu yayında. Detaylar için tıklayınız.',
    content: `
      <p>Merhaba Değerli Kullanıcılarımız,</p>
      <p>Unides platformunu sizler için geliştirmeye devam ediyoruz. Bu, sistemin çalışıp çalışmadığını kontrol etmek amacıyla oluşturulmuş bir <strong>demo duyurudur</strong>.</p>
      <p>Platformumuz üzerinden yapabileceğiniz işlemler:</p>
      <ul>
        <li>Toplulukları keşfetme</li>
        <li>Etkinliklere katılma</li>
        <li>Duyuruları takip etme</li>
      </ul>
      <p>Keyifli kullanımlar dileriz!</p>
    `,
    date: new Date().toISOString().split('T')[0],
    image: 'assets/images/duyuru-statik.png', // Eğer bu dosya yoksa placeholder görünebilir veya kırık link olabilir
    link: '/announcements/9999'
  };

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

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

    // Görsel path'i tam URL'ye çevir
    // Backend relative path dönerse (örn: /uploads/xxx.jpg), tam URL'ye çevir
    if (imagePath && !imagePath.startsWith('http://') && !imagePath.startsWith('https://') && !imagePath.startsWith('data:')) {
      // Backend base URL'si (api kısmını çıkar)
      const baseUrl = environment.apiUrl.replace('/api', '');
      // Path'in başında / yoksa ekle
      if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
      }
      imagePath = baseUrl + imagePath;
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
        const realAnnouncements = response.map((dto) => this.mapToAnnouncement(dto));
        // Demo duyuruyu listenin başına ekle
        return [this.DEMO_ANNOUNCEMENT, ...realAnnouncements];
      }),
      catchError((error) => {
        console.error('Duyurular yüklenemedi:', error);
        // Hata durumunda en azından demo duyuruyu göster
        return of([this.DEMO_ANNOUNCEMENT]);
      })
    );
  }

  getAnnouncementById(id: number): Observable<Announcement | undefined> {
    // Eğer ID demo ID ise direkt mock datayı dön
    if (Number(id) === this.DEMO_ANNOUNCEMENT.id) {
      return of(this.DEMO_ANNOUNCEMENT);
    }

    return this.http.get<any>(`${this.apiUrl}/detail/${id}`).pipe(
      map((response) => this.mapToAnnouncement(response)),
      catchError((error) => {
        console.error('Duyuru detayı yüklenemedi:', error);
        return of(undefined);
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
    // Auth interceptor automatically adds Authorization header and Content-Type if token exists
    return this.http.post<number>(`${this.apiUrl}/create`, request).pipe(
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
    // Auth interceptor automatically adds Authorization header and Content-Type if token exists
    return this.http.put<void>(`${this.apiUrl}/update/${id}`, request).pipe(
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
    // Auth interceptor automatically adds Authorization header if token exists
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`).pipe(
      catchError((error) => {
        console.error('Duyuru silinemedi:', error);
        console.error('Hata detayı:', error.error);
        throw error;
      })
    );
  }

  /**
   * Duyuru görseli yükler
   * @param announcementId - Duyuru ID'si (önce duyuru oluşturulmalı)
   * @param file - Yüklenecek dosya
   * @returns Görsel URL'si
   */
  uploadImage(announcementId: number, file: File): Observable<string> {
    const formData = new FormData();
    // Backend'in beklediği parametre adı
    formData.append('file', file, file.name);

    // Backend { imageUrl: string } formatında döndürüyor
    interface UploadResponse {
      imageUrl: string;
    }

    // TEST: Headers tamamen kaldırıldı - 415 hatasının kaynağını test ediyoruz
    // Eğer bu çalışırsa, sorun headers'dan
    // Eğer çalışmazsa, sorun backend'de
    return this.http.post<UploadResponse>(`${this.apiUrl}/${announcementId}/image`, formData).pipe(
      map((response) => response.imageUrl || response as any),
      catchError((error) => {
        console.error('Görsel yüklenemedi:', error);
        console.error('Hata detayı:', error.error);
        throw error;
      })
    );
  }
}
