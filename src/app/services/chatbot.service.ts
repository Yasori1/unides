import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger.util';

export interface ChatMessage {
  message: string;
  type: 'text' | 'button';
  context?: string;
}

export interface ChatResponse {
  cevap: string;
  butonlar?: string[];
  similarity?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private apiUrl = environment.chatbotApiUrl;

  constructor(private http: HttpClient) {}

  sendMessage(
    message: string,
    type: 'text' | 'button' = 'text',
    context?: string
  ): Observable<ChatResponse> {
    const payload: ChatMessage = {
      message,
      type,
      context,
    };

    Logger.log('Chatbot API URL:', this.apiUrl);
    Logger.log('Sending payload:', payload);

    return this.http.post<ChatResponse>(this.apiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout: 30 saniye
      timeout: 30000,
    });
  }
}
