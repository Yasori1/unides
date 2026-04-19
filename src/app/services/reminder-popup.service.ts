import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ReminderPopupListItem {
  id: number;
  title: string;
  shortDescription?: string | null;
  startDate: string;
  endDate?: string | null;
  announcementLink?: string | null;
  applicationLink?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ReminderPopupDetail extends ReminderPopupListItem {
  createdBy: number;
  createdByName?: string | null;
  updatedAt: string;
}

export interface CreateReminderPopupRequest {
  title: string;
  shortDescription?: string | null;
  startDate: string;
  endDate?: string | null;
  announcementLink?: string | null;
  applicationLink?: string | null;
}

export interface UpdateReminderPopupRequest {
  title?: string;
  shortDescription?: string | null;
  startDate?: string;
  endDate?: string | null;
  clearEndDate?: boolean;
  announcementLink?: string | null;
  applicationLink?: string | null;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReminderPopupService {
  private readonly base = `${environment.apiUrl}/Notifications`;

  constructor(private http: HttpClient) {}

  /** Tam URL: göreli path + imageBaseUrl */
  resolveImageUrl(path: string | null | undefined): string {
    if (!path?.trim()) return '';
    const p = path.trim();
    if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:')) return p;
    const base = (environment.imageBaseUrl || '').replace(/\/$/, '');
    const rel = p.startsWith('/') ? p : `/${p}`;
    return base ? `${base}${rel}` : rel;
  }

  getActive(): Observable<ReminderPopupListItem[]> {
    return this.http.get<ReminderPopupListItem[]>(`${this.base}/active`);
  }

  listAdmin(): Observable<ReminderPopupDetail[]> {
    return this.http.get<ReminderPopupDetail[]>(`${this.base}/list`);
  }

  getById(id: number): Observable<ReminderPopupDetail> {
    return this.http.get<ReminderPopupDetail>(`${this.base}/${id}`);
  }

  create(body: CreateReminderPopupRequest): Observable<number> {
    return this.http.post<number>(`${this.base}/create`, body);
  }

  update(id: number, body: UpdateReminderPopupRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/update/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/delete/${id}`);
  }

  uploadImage(id: number, file: File): Observable<string> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<{ imageUrl?: string }>(`${this.base}/${id}/image`, fd).pipe(
      map((r) => r.imageUrl || ''),
    );
  }
}
