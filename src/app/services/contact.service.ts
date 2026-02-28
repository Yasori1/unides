import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactMessageRequest {
  fullName: string;
  email: string;
  topic: string;
  message: string;
  website?: string;
}

export interface ContactSendResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/Contact`;

  constructor(private http: HttpClient) {}

  /** POST /api/Contact/send — İletişim formu mesajı gönder */
  sendMessage(payload: ContactMessageRequest): Observable<ContactSendResponse> {
    return this.http.post<ContactSendResponse>(`${this.apiUrl}/send`, payload);
  }
}
