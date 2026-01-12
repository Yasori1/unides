import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap } from 'rxjs';
import {
  CommunityMiniDto,
  CommunityDetailDto,
  CommunityEventDto,
  CreateCommunityDto,
  UpdateCommunityDto,
  AddCommunityMemberDto,
  RemoveCommunityMemberDto,
  Community,
} from '../models/community.models';

// Re-export Community for backward compatibility
export type { Community } from '../models/community.models';

@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  private apiUrl = '/api/Communities';
  private readonly placeholderLogo = 'assets/img/placeholder-logo.svg';
  private readonly placeholderCover = 'assets/img/placeholder-cover.svg';

  constructor(private http: HttpClient) {}

  private ensureCommunityAssets(c: Community): Community {
    const logo = c.logo && String(c.logo).trim() ? c.logo : this.placeholderLogo;
    const coverCandidate = c.coverImage && String(c.coverImage).trim() ? c.coverImage : '';
    const bannerCandidate = c.banner && String(c.banner).trim() ? c.banner : '';

    const banner = bannerCandidate || coverCandidate || this.placeholderCover;
    const coverImage = coverCandidate || bannerCandidate || this.placeholderCover;

    return {
      ...c,
      logo,
      banner,
      coverImage,
    };
  }

  // CommunityMiniDto'yu Community'ye dönüştür (List için)
  private mapMiniDtoToCommunity(dto: CommunityMiniDto): Community {
    return {
      id: dto.communityId,
      name: dto.comName,
      university: dto.university || '',
      category: dto.comCategory || 'Genel',
      description: dto.miniAbout,
      logo: dto.logoUrl && dto.logoUrl.trim() ? dto.logoUrl : this.placeholderLogo,
      memberCount: 0, // List endpoint'inde memberCount yok
      city: dto.city,
      about: dto.miniAbout,
      banner: dto.bannerUrl && dto.bannerUrl.trim() ? dto.bannerUrl : this.placeholderCover,
      coverImage: dto.bannerUrl && dto.bannerUrl.trim() ? dto.bannerUrl : this.placeholderCover,
      status: dto.isActivity ? 'Aktif' : 'Pasif',
      miniAbout: dto.miniAbout,
      isActivity: dto.isActivity,
    };
  }

  // CommunityDetailDto'yu Community'ye dönüştür (Detail için)
  private mapDetailDtoToCommunity(dto: CommunityDetailDto): Community {
    return {
      id: dto.communityId,
      name: dto.comName,
      university: dto.university || '',
      category: dto.comCategory || 'Genel',
      description: dto.comAbout || dto.miniAbout,
      logo: dto.logoUrl && dto.logoUrl.trim() ? dto.logoUrl : this.placeholderLogo,
      memberCount: 0, // Backend'de memberCount yok, gerekirse ayrı endpoint'ten çekilebilir
      city: dto.city,
      about: dto.comAbout,
      banner: dto.bannerUrl && dto.bannerUrl.trim() ? dto.bannerUrl : this.placeholderCover,
      coverImage: dto.bannerUrl && dto.bannerUrl.trim() ? dto.bannerUrl : this.placeholderCover,
      website: dto.webSiteUrl,
      email: dto.comMail,
      instagram: dto.instagramUrl,
      status: dto.isActivity ? 'Aktif' : 'Pasif',
      presidentEmail: dto.comLeadMail,
      comMail: dto.comMail,
      comLeadMail: dto.comLeadMail,
      webSiteUrl: dto.webSiteUrl,
      instagramUrl: dto.instagramUrl,
      miniAbout: dto.miniAbout,
      isActivity: dto.isActivity,
      events: dto.events || [],
    };
  }

  // Tüm Toplulukları Getir (Backend: GET /api/Communities)
  // Query parametreleri: city, university, category, name
  getAllCommunities(params?: {
    city?: string;
    university?: string;
    category?: string;
    name?: string;
  }): Observable<Community[]> {
    let httpParams = new HttpParams();
    if (params?.city) httpParams = httpParams.set('city', params.city);
    if (params?.university) httpParams = httpParams.set('university', params.university);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.name) httpParams = httpParams.set('name', params.name);

    return this.http.get<CommunityMiniDto[]>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        return response.map((dto) => this.mapMiniDtoToCommunity(dto));
      }),
      catchError((error) => {
        console.error('Topluluklar yüklenirken hata oluştu:', error);
        return of([]);
      })
    );
  }

  // En Popüler Toplulukları Getir
  getTopCommunities(limit: number): Observable<Community[]> {
    return this.getAllCommunities().pipe(
      map((communities) => {
        // Üye sayısına göre çoktan aza sırala ve limit kadarını al
        return communities.sort((a, b) => b.memberCount - a.memberCount).slice(0, limit);
      }),
      catchError((error) => {
        console.error('Popüler topluluklar yüklenemedi:', error);
        return of([]);
      })
    );
  }

  // Topluluk Detayı Getir (Backend: GET /api/Communities/{id:guid})
  getCommunityById(id: string): Observable<Community> {
    return this.http.get<CommunityDetailDto>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.mapDetailDtoToCommunity(response)),
      catchError((error) => {
        console.error('Topluluk detayı getirilemedi:', error);
        throw error;
      })
    );
  }

  // Topluluk Oluştur (Backend: POST /api/Communities)
  // Backend Community entity döndürüyor (communityId: Guid)
  createCommunity(dto: CreateCommunityDto): Observable<Community> {
    return this.http.post<{ communityId: string; comName: string }>(this.apiUrl, dto).pipe(
      switchMap((response) => {
        // Backend Community entity döndürüyor, detayı çek
        return this.getCommunityById(response.communityId);
      }),
      catchError((error) => {
        console.error('Topluluk oluşturulamadı:', error);
        throw error;
      })
    );
  }

  // Topluluk Güncelle (Backend: PUT /api/Communities/{id:guid})
  updateCommunity(id: string, dto: UpdateCommunityDto): Observable<Community> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto).pipe(
      switchMap(() => {
        // Güncellenen topluluğu getir
        return this.getCommunityById(id);
      }),
      catchError((error) => {
        console.error('Topluluk güncellenemedi:', error);
        throw error;
      })
    );
  }

  // Topluluk Sil (Backend: DELETE /api/Communities/{id:guid})
  deleteCommunity(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Topluluk silinemedi:', error);
        throw error;
      })
    );
  }

  // Üye Ekle (Backend: POST /api/Communities/{id:guid}/members)
  addMember(id: string, dto: AddCommunityMemberDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/members`, dto).pipe(
      catchError((error) => {
        console.error('Üye eklenemedi:', error);
        throw error;
      })
    );
  }

  // Üye Çıkar (Backend: DELETE /api/Communities/{id:guid}/members)
  removeMember(id: string, dto: RemoveCommunityMemberDto): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/members`, { body: dto }).pipe(
      catchError((error) => {
        console.error('Üye çıkarılamadı:', error);
        throw error;
      })
    );
  }

  // Corporate dashboard için uyumluluk metodu (eski interface ile çalışır)
  addOrUpdateCommunity(community: Community & { presidentEmail?: string }): Observable<Community> {
    if (community.id && community.id !== '') {
      // Güncelleme
      const updateDto: UpdateCommunityDto = {
        comName: community.name,
        comAbout: community.about || community.description,
        city: community.city,
        university: community.university,
        logoUrl: community.logo || community.banner,
        comMail: community.email || community.comMail,
        webSiteUrl: community.website || community.webSiteUrl,
        instagramUrl: community.instagram || community.instagramUrl,
        bannerUrl: community.banner,
        miniAbout: community.miniAbout,
        isActivity: community.isActivity ?? community.status === 'Aktif',
        comLeadMail: community.presidentEmail || community.comLeadMail,
      };
      return this.updateCommunity(community.id, updateDto);
    } else {
      // Yeni topluluk oluşturma - ComLeadMail zorunlu
      if (!community.presidentEmail && !community.comLeadMail) {
        throw new Error('Topluluk başkanı email adresi (comLeadMail) zorunludur.');
      }
      const createDto: CreateCommunityDto = {
        comName: community.name,
        comAbout: community.about || community.description,
        city: community.city || '',
        university: community.university,
        comMail: community.email || community.comMail,
        comLeadMail: community.presidentEmail || community.comLeadMail || '',
        webSiteUrl: community.website || community.webSiteUrl,
        instagramUrl: community.instagram || community.instagramUrl,
        logoUrl: community.logo,
        bannerUrl: community.banner,
        miniAbout: community.miniAbout,
        comCategory: community.category,
      };
      return this.createCommunity(createDto);
    }
  }
}
