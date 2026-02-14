import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpamService {
  // Tüm istekler unidesportal.org üzerinden (environment.spamBotApiUrl → /api/moderate)
  private apiUrl = environment.spamBotApiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Spam kontrolü — backend'in beklediği alan adları: title, category, body, notes.
   * Backend bu dört alanı "\n".join([...]) ile birleştirip filtreye sokar.
   */
  checkSpam(payload: { title?: string; category?: string; body?: string; notes?: string }): Observable<any> {
    const body = {
      title: payload.title ?? '',
      category: payload.category ?? '',
      body: payload.body ?? '',
      notes: payload.notes ?? '',
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl, body, { headers });
  }
}
