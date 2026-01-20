import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SpamService {
  // Backend spam filter API adresi
  // URL: http://72.62.37.160/spam (HTTP protokolü, HTTPS değil)
  // Method: POST
  private apiUrl = 'http://72.62.37.160/spam'; 

  constructor(private http: HttpClient) {}

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
