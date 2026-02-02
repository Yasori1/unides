import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SpamService {
  // Tüm istekler unidesportal.org üzerinden (environment.spamBotApiUrl → /api/moderate)
  private apiUrl = environment.spamBotApiUrl;

  constructor(private http: HttpClient) { }

  checkSpam(message: string): Observable<any> {
    // Backend'in beklediği format: { text: "..." }
    // POST isteği
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(this.apiUrl, { text: message }, { headers });
  }
}
