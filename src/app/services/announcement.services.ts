import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from './auth.services';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger.util';

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
  annId: number; // Swagger'a göre required
  title: string;
  shortDescription?: string;
  annDate?: string;
  description?: string;
  link?: string;
  imagePath?: string;
}

/** Backend paginated response: { page, pageSize, totalCount, totalPages, items } */
export interface AnnouncementsPageResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: Announcement[];
}

@Injectable({
  providedIn: 'root',
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}/Announcements`;



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

    // Görsel path'i /ImagesUnides/ formatına çevir — link bağlamada sadece path kullanılıyor
    if (imagePath && !imagePath.startsWith('http://') && !imagePath.startsWith('https://') && !imagePath.startsWith('data:')) {
      let finalPath = imagePath;
      if (!finalPath.startsWith('/')) {
        finalPath = '/' + finalPath;
      }
      if (finalPath.startsWith('/assets/img/')) {
        finalPath = finalPath.replace('/assets/img/', '/ImagesUnides/');
      } else if (finalPath.startsWith('/images/')) {
        finalPath = finalPath.replace('/images/', '/ImagesUnides/');
      }
      imagePath = finalPath;
    } else if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
      try {
        const pathname = new URL(imagePath).pathname;
        if (pathname.startsWith('/ImagesUnides/')) imagePath = pathname;
        else if (pathname.startsWith('/images/')) imagePath = pathname.replace('/images/', '/ImagesUnides/');
        else if (pathname.startsWith('/assets/img/')) imagePath = pathname.replace('/assets/img/', '/ImagesUnides/');
        else imagePath = pathname;
      } catch {
        // URL parse edilemezse olduğu gibi bırak
      }
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

  /**
   * Sayfa bazlı duyuru listesi (backend pagination).
   * GET /api/Announcements/list?page=1&pageSize=12&search=&sortOrder=
   * Arama/sıralama değişince page=1 ile, sayfa değişince sadece page ile yeniden istek atın.
   */
  getAnnouncementsPage(
    page: number = 1,
    pageSize: number = 12,
    params?: { search?: string; sortOrder?: 'asc' | 'desc' }
  ): Observable<AnnouncementsPageResponse> {
    let httpParams = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (params?.search?.trim()) httpParams = httpParams.set('search', params.search.trim());
    if (params?.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    return this.http.get<{ page: number; pageSize: number; totalCount: number; totalPages: number; items: any[] }>(
      `${this.apiUrl}/list`,
      { params: httpParams }
    ).pipe(
      map((response) => {
        const items = (response.items || []).map((dto) => this.mapToAnnouncement(dto));
        return {
          page: response.page ?? page,
          pageSize: response.pageSize ?? pageSize,
          totalCount: response.totalCount ?? 0,
          totalPages: response.totalPages ?? 1,
          items,
        };
      }),
      catchError((error) => {
        Logger.error('Duyurular yüklenemedi:', error);
        return of({ page: 1, pageSize: pageSize, totalCount: 0, totalPages: 0, items: [] });
      })
    );
  }

  /**
   * Son duyurular (mini liste, sayfalama yok).
   * GET /api/Announcements/latest — backend sabit 4 adet döndürür.
   */
  getLatestAnnouncements(): Observable<Announcement[]> {
    return this.http.get<any[]>(`${this.apiUrl}/latest`).pipe(
      map((list) => (Array.isArray(list) ? list : []).map((dto) => this.mapToAnnouncement(dto))),
      catchError((error) => {
        Logger.error('Son duyurular yüklenemedi:', error);
        return of([]);
      })
    );
  }

  /** Tüm duyuruları tek seferde getirir (eski davranış; mümkünse getAnnouncementsPage kullanın). */
  getAllAnnouncements(): Observable<Announcement[]> {
    return this.getAnnouncementsPage(1, 9999).pipe(
      map((res) => res.items),
      catchError((error) => {
        Logger.error('Duyurular yüklenemedi:', error);
        return of([]);
      })
    );
  }

  getAnnouncementById(id: number): Observable<Announcement | undefined> {


    return this.http.get<any>(`${this.apiUrl}/detail/${id}`).pipe(
      map((response) => this.mapToAnnouncement(response)),
      catchError((error) => {
        Logger.error('Duyuru detayı yüklenemedi:', error);
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
        Logger.error('Duyuru oluşturulamadı:', error);
        Logger.error('Hata detayı:', error.error);
        Logger.error('Request body:', JSON.stringify(request, null, 2));
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
    // DEBUG: Gelen veriyi kontrol et
    Logger.log('=== updateAnnouncement DEBUG - INPUT ===');
    Logger.log('Announcement ID:', id);
    Logger.log('announcement.title (raw):', announcement.title);
    Logger.log('announcement.title type:', typeof announcement.title);
    Logger.log('announcement.title length:', announcement.title?.length);
    Logger.log('announcement.title trimmed:', announcement.title?.trim());
    Logger.log('announcement.title trimmed length:', announcement.title?.trim()?.length);
    Logger.log('Full announcement object:', JSON.stringify(announcement, null, 2));

    // Title boş olabilir - validasyon kaldırıldı
    const titleValue = announcement.title;
    const trimmedTitle = titleValue ? String(titleValue).trim() : '';

    // Backend camelCase formatında bekliyor (Swagger'a göre): { annId, title, shortDescription, annDate, description, link, imagePath }
    // Backend'de JsonPropertyName("title") var ve PropertyNameCaseInsensitive = true
    // Backend controller'da [FromBody] UpdateAnnouncementCommand? jsonCmd = null var
    // Swagger formatına uygun olarak sadece camelCase gönderiyoruz
    // ÖNEMLİ: undefined değerleri JSON'a dahil etme (backend'de sorun yaratabilir)
    const request: any = {
      annId: id, // Swagger'a göre required
      title: trimmedTitle, // camelCase - JsonPropertyName("title") ile eşleşmeli
    };
    
    // Sadece tanımlı değerleri ekle (undefined değerleri JSON'a dahil etme)
    if (announcement.shortDescription?.trim()) {
      request.shortDescription = announcement.shortDescription.trim();
    }
    if (announcement.content?.trim()) {
      request.description = announcement.content.trim();
    }
    if (announcement.link?.trim()) {
      request.link = announcement.link.trim();
    }
    if (announcement.image?.trim()) {
      request.imagePath = announcement.image.trim();
    }
    if (announcement.date) {
      request.annDate = new Date(announcement.date).toISOString();
    }
    
    // DEBUG: Request body'yi kontrol et
    Logger.log('=== updateAnnouncement DEBUG - OUTPUT ===');
    Logger.log('Request body (JSON string):', JSON.stringify(request, null, 2));
    Logger.log('Request body (object):', request);
    Logger.log('title value:', request.title, '(length:', request.title.length, ')');
    Logger.log('Content-Type will be: application/json');

    // PUT /api/Announcements/update/{id} - NoContent döner
    // Content-Type: application/json header'ını açıkça belirt (backend [FromBody] ile JSON bekliyor)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    // Auth interceptor automatically adds Authorization header if token exists
    return this.http.put<void>(`${this.apiUrl}/update/${id}`, request, { headers }).pipe(
      catchError((error) => {
        Logger.error('Duyuru güncellenemedi:', error);
        Logger.error('Hata detayı:', error.error);
        Logger.error('Request body:', JSON.stringify(request, null, 2));
        
        
        throw error;
      })
    );
  }

  deleteAnnouncement(id: number): Observable<void> {
    // DELETE /api/Announcements/delete/{id} - NoContent döner
    // Auth interceptor automatically adds Authorization header if token exists
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`).pipe(
      catchError((error) => {
        Logger.error('Duyuru silinemedi:', error);
        Logger.error('Hata detayı:', error.error);
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

    // Backend { ImagePath: string } formatında döndürüyor
    interface UploadResponse {
      ImagePath?: string;
      imagePath?: string;
      imageUrl?: string;
    }

    return this.http.post<UploadResponse>(`${this.apiUrl}/${announcementId}/image`, formData).pipe(
      map((response) => {
        // Backend'den ImagePath, imagePath veya imageUrl gelebilir
        const path = response.ImagePath || response.imagePath || response.imageUrl || '';
        // Backend'den `/assets/img/Duyurular/...` formatında gelir, `/ImagesUnides/Duyurular/...` formatına çevir
        if (path && !path.startsWith('http://') && !path.startsWith('https://') && !path.startsWith('data:')) {
          let finalPath = path;
          if (!finalPath.startsWith('/')) {
            finalPath = '/' + finalPath;
          }
          if (finalPath.startsWith('/assets/img/')) {
            finalPath = finalPath.replace('/assets/img/', '/ImagesUnides/');
          } else if (finalPath.startsWith('/images/')) {
            finalPath = finalPath.replace('/images/', '/ImagesUnides/');
          }
          return finalPath;
        }
        if (path && path.startsWith('http')) {
          try {
            const pathname = new URL(path).pathname;
            if (pathname.startsWith('/ImagesUnides/')) return pathname;
            if (pathname.startsWith('/images/')) return pathname.replace('/images/', '/ImagesUnides/');
            if (pathname.startsWith('/assets/img/')) return pathname.replace('/assets/img/', '/ImagesUnides/');
            return pathname;
          } catch {
            return path;
          }
        }
        return path;
      }),
      catchError((error) => {
        Logger.error('Görsel yüklenemedi:', error);
        Logger.error('Hata detayı:', error.error);
        throw error;
      })
    );
  }
}
