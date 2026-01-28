import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger.util';

export interface SearchResult {
  communities: CommunitySearchItem[];
  events: EventSearchItem[];
  announcements: AnnouncementSearchItem[];
  bestMatch?: {
    type: string;
    id: string;
    title: string;
  };
}

export interface CommunitySearchItem {
  communityId: string;
  comName: string;
  comCategory?: string;
  city?: string;
  university?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface EventSearchItem {
  eventId: number;
  eventName: string;
  eventDate?: string;
  eventClock?: string;
  eventLocation?: string;
  eventPictureLink?: string;
  communityId?: string;
  communityName?: string;
}

export interface AnnouncementSearchItem {
  annId: number;
  title: string;
  annDate?: string;
  imagePath?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private apiUrl = `${environment.apiUrl}/Search`;

  constructor(private http: HttpClient) {}

  search(query: string): Observable<SearchResult> {
    if (!query || !query.trim()) {
      return of({
        communities: [],
        events: [],
        announcements: [],
      });
    }

    const params = new HttpParams().set('q', query.trim());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        return {
          communities: (response.Communities?.Items || response.communities?.items || []).map(
            (item: any) => ({
              communityId: item.CommunityId || item.communityId || '',
              comName: item.ComName || item.comName || '',
              comCategory: item.ComCategory || item.comCategory,
              city: item.City || item.city,
              university: item.University || item.university,
              logoUrl: item.LogoUrl || item.logoUrl,
              bannerUrl: item.BannerUrl || item.bannerUrl,
            })
          ),
          events: (response.Events?.Items || response.events?.items || []).map((item: any) => ({
            eventId: item.EventId || item.eventId || 0,
            eventName: item.EventName || item.eventName || '',
            eventDate: item.EventDate || item.eventDate,
            eventClock: item.EventClock || item.eventClock,
            eventLocation: item.EventLocation || item.eventLocation,
            eventPictureLink: item.EventPictureLink || item.eventPictureLink,
            communityId: item.CommunityId || item.communityId,
            communityName: item.CommunityName || item.communityName,
          })),
          announcements: (response.Announcements?.Items || response.announcements?.items || []).map(
            (item: any) => ({
              annId: item.AnnId || item.annId || 0,
              title: item.Title || item.title || '',
              annDate: item.AnnDate || item.annDate,
              imagePath: item.ImagePath || item.imagePath,
            })
          ),
          bestMatch: response.BestMatch || response.bestMatch,
        };
      }),
      catchError((error) => {
        Logger.error('Search error:', error);
        return of({
          communities: [],
          events: [],
          announcements: [],
        });
      })
    );
  }
}
