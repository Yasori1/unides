import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateQuestionRequest,
  CreateAnswerRequest,
  QuestionDto,
  AnswerDto,
  UpdateQuestionRequest,
  UpdateAnswerRequest,
} from '../models/forum.models';

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  private apiUrl = `${environment.apiUrl}/Forum`;

  constructor(private http: HttpClient) { }

  /**
   * Soru oluştur
   * POST /api/Forum/formAsk
   * Auth interceptor automatically adds Authorization header and Content-Type if token exists
   */
  createQuestion(
    request: CreateQuestionRequest
  ): Observable<{ message: string; questionId: number }> {
    return this.http
      .post<{ message: string; questionId: number }>(`${this.apiUrl}/formAsk`, request)
      .pipe(
        catchError((error) => {
          // Error handling - logging is backend-only
          throw error;
        })
      );
  }

  /**
   * Cevap ver
   * POST /api/Forum/formAnswer
   * Auth interceptor automatically adds Authorization header and Content-Type if token exists
   */
  createAnswer(request: CreateAnswerRequest): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/formAnswer`, request)
      .pipe(
        catchError((error) => {
          // Error handling - logging is backend-only
          throw error;
        })
      );
  }

  /**
   * Tüm soruları ve cevaplarını getir
   * GET /api/Forum/getAllQuestionsAndAnswer
   * [AllowAnonymous] - Giriş yapmayanlar da okuyabilir
   */
  getAllQuestions(): Observable<QuestionDto[]> {
    return this.http.get<QuestionDto[]>(`${this.apiUrl}/getAllQuestionsAndAnswer`).pipe(
      catchError(() => {
        // Error handling - logging is backend-only
        return of([]);
      })
    );
  }

  /**
   * Soru güncelle
   * PUT /api/Forum/questionUpdate
   * Auth interceptor automatically adds Authorization header and Content-Type if token exists
   */
  updateQuestion(request: UpdateQuestionRequest): Observable<{ message: string }> {
    return this.http
      .put<{ message: string }>(`${this.apiUrl}/questionUpdate`, request)
      .pipe(
        catchError((error) => {
          // Error handling - logging is backend-only
          throw error;
        })
      );
  }

  /**
   * Soru sil
   * DELETE /api/Forum/questionDelete/{id}
   * Auth interceptor automatically adds Authorization header if token exists
   */
  deleteQuestion(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/questionDelete/${id}`)
      .pipe(
        catchError((error) => {
          // Error handling - logging is backend-only
          throw error;
        })
      );
  }

  /**
   * Cevap güncelle
   * PUT /api/Forum/answerUpdate
   * Auth interceptor automatically adds Authorization header and Content-Type if token exists
   */
  updateAnswer(request: UpdateAnswerRequest): Observable<{ message: string }> {
    return this.http
      .put<{ message: string }>(`${this.apiUrl}/answerUpdate`, request)
      .pipe(
        catchError((error) => {
          // Error handling - logging is backend-only
          throw error;
        })
      );
  }

  /**
   * Cevap sil
   * DELETE /api/Forum/answerDelete/{id}
   * Auth interceptor automatically adds Authorization header if token exists
   */
  deleteAnswer(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/answerDelete/${id}`)
      .pipe(
        catchError((error) => {
          // Error handling - logging is backend-only
          throw error;
        })
      );
  }
}
