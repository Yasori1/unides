import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger.util';

export interface EmirGsbUserDto {
  id: number;
  fullName: string;
  email: string;
  city?: string;
  isActive: boolean;
}

function toGsbUser(dto: any): EmirGsbUserDto {
  return {
    id: dto.id ?? dto.Id,
    fullName: dto.fullName ?? dto.FullName ?? '',
    email: dto.email ?? dto.Email ?? '',
    city: dto.city ?? dto.City,
    isActive: dto.isActive ?? dto.IsActive ?? true,
  };
}

export interface EmirRegisterGsbRequest {
  fullName: string;
  email: string;
  password: string;
  city?: string;
}

export interface EmirUpdateGsbRequest {
  fullName?: string;
  email?: string;
  city?: string;
  isActive?: boolean;
}

export interface GsbUsersPageResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: EmirGsbUserDto[];
}

@Injectable({
  providedIn: 'root',
})
export class GsbUsersService {
  private apiUrl = `${environment.apiUrl}/admin/gsb/users`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/admin/gsb/users — Backend tüm filtreleme ve sayfalamayı yapar.
   * Query: page, pageSize=20, isActive (true/false), name (LIKE %name%), email (LIKE %email%), city (LIKE %city%).
   * Sadece isActive kullanıyoruz (onlyActive değil). isActive gönderilmezse backend tümü (aktif+pasif) döner.
   */
  getGsbUsers(
    page: number = 1,
    filters?: { isActive?: boolean | null; city?: string; name?: string; email?: string }
  ): Observable<GsbUsersPageResponse> {
    let params = new HttpParams().set('page', String(page)).set('pageSize', '20');
    if (filters?.isActive === true) params = params.set('isActive', 'true');
    else if (filters?.isActive === false) params = params.set('isActive', 'false');
    if (filters?.city?.trim()) params = params.set('city', filters.city.trim());
    if (filters?.name?.trim()) params = params.set('name', filters.name.trim());
    if (filters?.email?.trim()) params = params.set('email', filters.email.trim());
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => ({
        page: res.page ?? page,
        pageSize: res.pageSize ?? 20,
        totalCount: res.totalCount ?? 0,
        totalPages: res.totalPages ?? 0,
        items: (res.items || []).map((d: any) => toGsbUser(d)),
      })),
      catchError((err) => {
        Logger.error('GSB kullanıcıları yüklenemedi:', err);
        return of({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0, items: [] });
      })
    );
  }

  createGsbUser(body: EmirRegisterGsbRequest): Observable<EmirGsbUserDto> {
    const payload = {
      FullName: body.fullName,
      Email: body.email,
      Password: body.password,
      City: body.city ?? null,
    };
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map((d) => toGsbUser(d)),
      catchError((err) => {
        Logger.error('GSB kullanıcısı oluşturulamadı:', err);
        throw err;
      })
    );
  }

  updateGsbUser(id: number, body: EmirUpdateGsbRequest): Observable<EmirGsbUserDto> {
    const payload: Record<string, unknown> = {};
    if (body.fullName !== undefined) payload['FullName'] = body.fullName;
    if (body.email !== undefined) payload['Email'] = body.email;
    if (body.city !== undefined) payload['City'] = body.city;
    if (body.isActive !== undefined) payload['IsActive'] = body.isActive;
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload).pipe(
      map((d) => toGsbUser(d)),
      catchError((err) => {
        Logger.error('GSB kullanıcısı güncellenemedi:', err);
        throw err;
      })
    );
  }

  deleteGsbUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        Logger.error('GSB kullanıcısı silinemedi:', err);
        throw err;
      })
    );
  }
}
