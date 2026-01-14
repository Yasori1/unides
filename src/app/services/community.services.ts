import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap, forkJoin } from 'rxjs';
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
  private mapMiniDtoToCommunity(dto: CommunityMiniDto | any): Community {
    // Backend'den PascalCase (IsActivity) veya camelCase (isActivity) gelebilir
    const isActivity =
      dto.isActivity !== undefined
        ? dto.isActivity
        : dto.IsActivity !== undefined
        ? dto.IsActivity
        : true;

    return {
      id: dto.communityId || dto.CommunityId,
      name: dto.comName || dto.ComName,
      university: dto.university || dto.University || '',
      category: dto.comCategory || dto.ComCategory || 'Genel',
      description: dto.miniAbout || dto.MiniAbout,
      logo:
        (dto.logoUrl || dto.LogoUrl) && String(dto.logoUrl || dto.LogoUrl).trim()
          ? dto.logoUrl || dto.LogoUrl
          : this.placeholderLogo,
      memberCount: 0, // List endpoint'inde memberCount yok
      city: dto.city || dto.City,
      about: dto.miniAbout || dto.MiniAbout,
      banner:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? dto.bannerUrl || dto.BannerUrl
          : this.placeholderCover,
      coverImage:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? dto.bannerUrl || dto.BannerUrl
          : this.placeholderCover,
      status: isActivity ? 'Aktif' : 'Pasif',
      miniAbout: dto.miniAbout || dto.MiniAbout,
      isActivity: isActivity,
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
  // Query parametreleri: city, university, category, name, status
  // status: "active"/"aktif" (sadece aktif), "passive"/"pasif" (sadece pasif), "all"/"tumu"/"tümü" (tümü)
  getAllCommunities(params?: {
    city?: string;
    university?: string;
    category?: string;
    name?: string;
    status?: 'active' | 'aktif' | 'passive' | 'pasif' | 'all' | 'tumu' | 'tümü';
  }): Observable<Community[]> {
    let httpParams = new HttpParams();
    if (params?.city) httpParams = httpParams.set('city', params.city);
    if (params?.university) httpParams = httpParams.set('university', params.university);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.name) httpParams = httpParams.set('name', params.name);
    if (params?.status) httpParams = httpParams.set('status', params.status);

    // Get auth token for authenticated requests (if available)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`,
        })
      : undefined;

    return this.http.get<CommunityMiniDto[]>(this.apiUrl, { params: httpParams, headers }).pipe(
      map((response) => {
        const mapped = response.map((dto) => this.mapMiniDtoToCommunity(dto));
        return mapped;
      }),
      catchError((error) => {
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
        // Hata durumunda boş array döndür
        return of([]);
      })
    );
  }

  // Topluluk Detayı Getir (Backend: GET /api/Communities/{id:guid})
  getCommunityById(id: string): Observable<Community> {
    // Get auth token for authenticated requests (if available)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`,
        })
      : undefined;

    return this.http.get<CommunityDetailDto>(`${this.apiUrl}/${id}`, { headers }).pipe(
      map((response) => this.mapDetailDtoToCommunity(response)),
      catchError((error) => {
        // Hata durumunda throw ediyoruz
        throw error;
      })
    );
  }

  // Topluluk Oluştur (Backend: POST /api/Communities)
  // Backend Community entity döndürüyor (communityId: Guid)
  createCommunity(dto: CreateCommunityDto): Observable<Community> {
    // Get auth token for authenticated request
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        })
      : new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http
      .post<{ communityId: string; comName: string }>(this.apiUrl, dto, { headers })
      .pipe(
        switchMap((response) => {
          // Backend Community entity döndürüyor, detayı çek
          return this.getCommunityById(response.communityId);
        }),
        catchError((error) => {
          // Hata zaten throw ediliyor
          throw error;
        })
      );
  }

  // Topluluk Güncelle (Backend: PUT /api/Communities/{id:guid})
  updateCommunity(id: string, dto: UpdateCommunityDto): Observable<Community> {
    // Get auth token for authenticated request
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        })
      : new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.put<void>(`${this.apiUrl}/${id}`, dto, { headers }).pipe(
      switchMap(() => {
        // Backend'de pasif topluluklar GET endpoint'inde döndürülmüyor (!com.IsActivity kontrolü var)
        // Bu yüzden güncellenmiş veriyi direkt oluştur
        // Önce mevcut topluluğu listeden bul
        return this.getAllCommunities().pipe(
          map((communities) => {
            const existing = communities.find((c) => c.id === id);
            if (existing) {
              // Mevcut topluluğu DTO'daki değerlerle güncelle
              return {
                ...existing,
                name: dto.comName !== undefined ? dto.comName : existing.name,
                about: dto.comAbout !== undefined ? dto.comAbout : existing.about,
                description: dto.comAbout !== undefined ? dto.comAbout : existing.description,
                city: dto.city !== undefined ? dto.city : existing.city,
                university: dto.university !== undefined ? dto.university : existing.university,
                category: dto.comCategory !== undefined ? dto.comCategory : existing.category,
                email: dto.comMail !== undefined ? dto.comMail : existing.email,
                comMail: dto.comMail !== undefined ? dto.comMail : existing.comMail,
                comLeadMail: dto.comLeadMail !== undefined ? dto.comLeadMail : existing.comLeadMail,
                logo: dto.logoUrl !== undefined ? dto.logoUrl : existing.logo,
                banner: dto.bannerUrl !== undefined ? dto.bannerUrl : existing.banner,
                coverImage: dto.bannerUrl !== undefined ? dto.bannerUrl : existing.coverImage,
                miniAbout: dto.miniAbout !== undefined ? dto.miniAbout : existing.miniAbout,
                webSiteUrl: dto.webSiteUrl !== undefined ? dto.webSiteUrl : existing.webSiteUrl,
                instagramUrl:
                  dto.instagramUrl !== undefined ? dto.instagramUrl : existing.instagramUrl,
                // Status ve isActivity güncellemesi
                isActivity: dto.isActivity !== undefined ? dto.isActivity : existing.isActivity,
                status:
                  dto.isActivity !== undefined
                    ? dto.isActivity
                      ? 'Aktif'
                      : 'Pasif'
                    : existing.status,
              } as Community;
            }
            // Eğer listede yoksa, DTO'dan yeni bir Community oluştur
            const updatedCommunity: Community = {
              id: id,
              name: dto.comName || '',
              university: dto.university || '',
              category: dto.comCategory || 'Genel',
              description: dto.comAbout || '',
              about: dto.comAbout || '',
              city: dto.city || '',
              email: dto.comMail,
              logo: dto.logoUrl || this.placeholderLogo,
              banner: dto.bannerUrl || this.placeholderCover,
              coverImage: dto.bannerUrl || this.placeholderCover,
              memberCount: 0,
              status: dto.isActivity === false ? 'Pasif' : 'Aktif',
              isActivity: dto.isActivity !== undefined ? dto.isActivity : true,
              miniAbout: dto.miniAbout,
              comMail: dto.comMail,
              comLeadMail: dto.comLeadMail,
              webSiteUrl: dto.webSiteUrl,
              instagramUrl: dto.instagramUrl,
            };
            return updatedCommunity;
          }),
          catchError((error) => {
            // Hata zaten throw ediliyor
            throw error;
          })
        );
      }),
      catchError((error) => {
        // Hata zaten throw ediliyor
        throw error;
      })
    );
  }

  // Topluluk Sil (Backend: DELETE /api/Communities/{id:guid})
  deleteCommunity(id: string): Observable<void> {
    // Get auth token for authenticated request
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`,
        })
      : undefined;

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError((error) => {
        // Hata zaten throw ediliyor
        throw error;
      })
    );
  }

  // Üye Ekle (Backend: POST /api/Communities/{id:guid}/members)
  addMember(id: string, dto: AddCommunityMemberDto): Observable<void> {
    // Get auth token for authenticated request
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        })
      : new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http
      .post<{ message?: string }>(`${this.apiUrl}/${id}/members`, dto, { headers })
      .pipe(
        map(() => {
          // Membership is stored in backend CommunitiesUsers table
          // No need for localStorage tracking
          return undefined;
        }),
        catchError((error) => {
          // Hata zaten throw ediliyor
          throw error;
        })
      );
  }

  // Topluluk Üyelerini Getir (Backend: GET /api/Communities/{id:guid}/members)
  // Not: Backend'de bu endpoint henüz yok (sadece POST ve DELETE var)
  // Bu yüzden şimdilik direkt boş array döndürüyoruz, backend'e istek atmıyoruz
  // Backend'de GET endpoint'i eklendiğinde bu metod güncellenmeli
  getCommunityMembers(id: string): Observable<any[]> {
    // Backend'de GET /api/Communities/{id:guid}/members endpoint'i yok
    // Sadece POST (AddMember) ve DELETE (RemoveMember) var
    // Bu yüzden direkt boş array döndürüyoruz
    // TODO: Backend'de GET endpoint'i eklendiğinde bu metod güncellenmeli
    return of([]);
  }

  // Üye Çıkar (Backend: DELETE /api/Communities/{id:guid}/members)
  removeMember(id: string, dto: RemoveCommunityMemberDto): Observable<void> {
    // Get auth token for authenticated request
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        })
      : new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.delete<void>(`${this.apiUrl}/${id}/members`, { body: dto, headers }).pipe(
      map(() => {
        // Membership is removed from backend CommunitiesUsers table
        // No need for localStorage tracking
        return undefined;
      }),
      catchError((error) => {
        // Hata zaten throw ediliyor
        throw error;
      })
    );
  }

  /**
   * Get communities where the current user is a member
   * Uses backend CommunitiesUsers table via GET /api/Communities endpoint
   * Backend automatically filters based on authenticated user's JWT token
   *
   * Strategy:
   * 1. Get all communities (authenticated request)
   * 2. Filter by: user is president (ComLeadMail matches current user email)
   * 3. Backend CommunitiesUsers table is queried indirectly via authenticated context
   *
   * NOTE: This relies on backend properly filtering based on JWT token.
   * If backend doesn't filter, we fallback to president-only filtering.
   */
  getMyCommunities(): Observable<Community[]> {
    // Get current user info from localStorage
    if (typeof window === 'undefined') {
      return of([]);
    }

    const userInfoStr = localStorage.getItem('user_info');
    if (!userInfoStr) {
      return of([]);
    }

    try {
      const userInfo = JSON.parse(userInfoStr);
      const userEmail = userInfo.email;
      const userId = userInfo.id;

      if (!userEmail) {
        return of([]);
      }

      // Get all communities with authenticated request
      // Backend should filter based on JWT token if it supports user-specific filtering
      return this.getAllCommunities().pipe(
        map((allCommunities) => {
          if (allCommunities.length === 0) {
            return [];
          }

          // Filter: communities where user is president
          // Note: Backend CommunitiesUsers table membership is not directly queryable
          // via current endpoints. This filters only by president role.
          const myCommunities = allCommunities.filter(
            (c) => c.comLeadMail?.toLowerCase() === userEmail.toLowerCase()
          );

          return myCommunities;
        }),
        catchError((error) => {
          // Hata durumunda boş array döndür
          // Handle 401/403 gracefully
          if (error.status === 401 || error.status === 403) {
            // Unauthorized access - returning empty list
          }
          return of([]);
        })
      );
    } catch (e) {
      // Error parsing user info
      return of([]);
    }
  }

  // Corporate dashboard için uyumluluk metodu (eski interface ile çalışır)
  addOrUpdateCommunity(community: Community & { presidentEmail?: string }): Observable<Community> {
    if (community.id && community.id !== '') {
      // Status'u isActivity boolean'a çevir
      // ÖNEMLİ: status değerine öncelik ver (butonlardan gelen değer)
      // Öncelik sırası: status string > isActivity > true (varsayılan)
      let isActivity: boolean;
      if (
        community.status !== undefined &&
        (community.status === 'Aktif' || community.status === 'Pasif')
      ) {
        // Status değeri varsa ve geçerliyse, onu kullan (butonlardan gelen değer)
        isActivity = community.status === 'Aktif';
      } else if (community.isActivity !== undefined) {
        // Status yoksa isActivity'yi kullan
        isActivity = community.isActivity;
      } else {
        isActivity = true; // Varsayılan: Aktif
      }

      // Güncelleme
      const updateDto: UpdateCommunityDto = {
        comName: community.name,
        comAbout: community.about || community.description,
        city: community.city,
        university: community.university,
        comCategory: community.category, // Kategori eklendi
        logoUrl: community.logo || community.banner,
        comMail: community.email || community.comMail,
        webSiteUrl: community.website || community.webSiteUrl,
        instagramUrl: community.instagram || community.instagramUrl,
        bannerUrl: community.banner,
        miniAbout: community.miniAbout,
        isActivity: isActivity,
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

      // Backend Create endpoint'i her zaman IsActivity = true yapıyor
      // Eğer status "Pasif" ise, oluşturduktan sonra hemen update yaparak IsActivity = false yapmalıyız
      const isActivityDesired =
        community.isActivity !== undefined ? community.isActivity : community.status === 'Aktif';

      return this.createCommunity(createDto).pipe(
        switchMap((createdCommunity) => {
          // Eğer status "Pasif" ise, hemen update yap
          if (!isActivityDesired) {
            const updateDto: UpdateCommunityDto = {
              isActivity: false,
            };
            return this.updateCommunity(createdCommunity.id, updateDto);
          }
          return of(createdCommunity);
        })
      );
    }
  }

  // Topluluk başkanı için istatistikleri getir (Backend: GET /api/Communities/leader-stats)
  getLeaderStats(): Observable<{
    totalMembers: number;
    approvedEvents: number;
    pendingEvents: number;
    totalEvents: number;
  }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('İstatistikleri görmek için giriş yapmanız gerekiyor.');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .get<{
        TotalMembers?: number;
        ApprovedEvents?: number;
        PendingEvents?: number;
        TotalEvents?: number;
        totalMembers?: number;
        approvedEvents?: number;
        pendingEvents?: number;
        totalEvents?: number;
      }>(`${this.apiUrl}/leader-stats`, { headers })
      .pipe(
        map((response) => ({
          // Backend'den hem PascalCase hem camelCase gelebilir
          totalMembers: response.TotalMembers ?? response.totalMembers ?? 0,
          approvedEvents: response.ApprovedEvents ?? response.approvedEvents ?? 0,
          pendingEvents: response.PendingEvents ?? response.pendingEvents ?? 0,
          totalEvents: response.TotalEvents ?? response.totalEvents ?? 0,
        })),
        catchError((error) => {
          // Hata durumunda varsayılan değerler döndür
          return of({
            totalMembers: 0,
            approvedEvents: 0,
            pendingEvents: 0,
            totalEvents: 0,
          });
        })
      );
  }
}
