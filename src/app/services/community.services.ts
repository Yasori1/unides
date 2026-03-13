import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpContext, HttpHeaders } from '@angular/common/http';
import { SKIP_AUTH } from '../core/http-context-tokens';
import { Observable, map, catchError, of, switchMap, forkJoin, from } from 'rxjs';
import { environment } from '../../environments/environment';
import { Logger } from '../utils/logger.util';
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

/** Backend CommunityLogoDto (GET /api/Communities/latest): comName, logoUrl; id opsiyonel. */
export interface LatestCommunityItem {
  id?: string;
  comName: string;
  logoUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  private apiUrl = `${environment.apiUrl}/Communities`;
  private readonly placeholderLogo = 'assets/img/placeholder-logo.svg';
  private readonly placeholderCover = 'assets/img/placeholder-cover.svg';

  constructor(private http: HttpClient) {}

  // Image path'i tam URL'ye çevir ve `/ImagesUnides/` formatına dönüştür
  private convertImagePathToFullUrl(imagePath: string): string {
    if (!imagePath) {
      return '';
    }

    const pathStr = String(imagePath).trim();

    // Tam URL ise (http/https) sadece path kısmını al — link bağlamada /ImagesUnides/ kullanılıyor
    if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
      try {
        const pathname = new URL(pathStr).pathname;
        if (pathname.startsWith('/ImagesUnides/')) return pathname;
        if (pathname.startsWith('/images/')) return pathname.replace('/images/', '/ImagesUnides/');
        if (pathname.startsWith('/assets/img/'))
          return pathname.replace('/assets/img/', '/ImagesUnides/');
        return pathname || pathStr;
      } catch {
        return pathStr;
      }
    }
    if (pathStr.startsWith('data:') || pathStr.startsWith('blob:')) {
      return pathStr;
    }

    // Placeholder veya local asset ise olduğu gibi döndür
    if (pathStr.startsWith('assets/')) {
      return pathStr;
    }

    let finalPath = pathStr;
    if (!finalPath.startsWith('/')) {
      finalPath = '/' + finalPath;
    }

    // Path dönüşümü: `/assets/img/` -> `/ImagesUnides/`
    if (finalPath.startsWith('/assets/img/')) {
      finalPath = finalPath.replace('/assets/img/', '/ImagesUnides/');
    } else if (finalPath.startsWith('/images/')) {
      finalPath = finalPath.replace('/images/', '/ImagesUnides/');
    }

    // Logo ve banner listelemede tam URL (https://unidesportal.org/ImagesUnides/Banner/... vb.) kullan
    const base = environment.imageBaseUrl;
    if (
      base &&
      finalPath &&
      (finalPath.startsWith('/ImagesUnides/') || finalPath.startsWith('/images/'))
    ) {
      return base.replace(/\/$/, '') + (finalPath.startsWith('/') ? finalPath : '/' + finalPath);
    }
    return finalPath;
  }

  /**
   * Onaya gönderilen güncelleme verisini (PendingUpdateData JSON string) topluluk nesnesine uygular.
   * Backend: comConfirm=4 iken pendingUpdateData, ana alanlar mevcut (yayındaki) veri; JSON içi PascalCase (ComName, BannerUrl, LogoUrl vb.).
   */
  applyPendingUpdateToCommunity(
    community: Community & { presidentEmail?: string },
    pendingUpdateDataJson: string | null | undefined
  ): Community & { presidentEmail?: string } {
    if (!pendingUpdateDataJson || typeof pendingUpdateDataJson !== 'string') return community;
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(pendingUpdateDataJson) as Record<string, unknown>;
    } catch {
      return community;
    }
    const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const getStr = (camelKey: string, alt?: string): string | undefined => {
      const v = raw[camelKey] ?? raw[pascal(camelKey)];
      if (v == null || v === undefined) return alt;
      const str = String(v).trim();
      return str || alt;
    };
    const logoUrl = getStr('logoUrl') ?? getStr('LogoUrl');
    const bannerUrl = getStr('bannerUrl') ?? getStr('BannerUrl');
    return {
      ...community,
      name: getStr('comName', community.name) ?? community.name,
      about: getStr('comAbout', community.about) ?? community.about ?? '',
      description: getStr('comAbout', community.description) ?? community.description ?? '',
      city: getStr('city', community.city) ?? community.city ?? '',
      university: getStr('university', community.university) ?? community.university ?? '',
      category: getStr('comCategory', community.category) ?? community.category ?? 'Genel',
      email: getStr('comMail', community.email) ?? community.email ?? '',
      comMail: getStr('comMail', community.comMail) ?? community.comMail ?? '',
      presidentEmail: getStr('comLeadMail', community.presidentEmail ?? community.comLeadMail) ?? community.presidentEmail ?? community.comLeadMail ?? '',
      comLeadMail: getStr('comLeadMail', community.comLeadMail ?? community.presidentEmail) ?? community.comLeadMail ?? community.presidentEmail ?? '',
      webSiteUrl: getStr('webSiteUrl', community.webSiteUrl) ?? community.webSiteUrl ?? '',
      instagramUrl: getStr('instagramUrl', community.instagramUrl) ?? community.instagramUrl ?? '',
      miniAbout: getStr('miniAbout', community.miniAbout) ?? community.miniAbout ?? '',
      logo: logoUrl ? this.convertImagePathToFullUrl(logoUrl) || community.logo : community.logo,
      banner: bannerUrl ? this.convertImagePathToFullUrl(bannerUrl) || community.banner : community.banner ?? '',
      coverImage: bannerUrl ? this.convertImagePathToFullUrl(bannerUrl) || community.coverImage : community.coverImage ?? '',
    };
  }

  /**
   * Kart/liste için onaya gönderilen veriyi döndürür (name, description, logo, banner vb.).
   * pendingUpdateData yoksa veya parse hatası olursa null.
   */
  getPendingDisplayData(pendingUpdateDataJson: string | null | undefined): {
    name?: string;
    description?: string;
    category?: string;
    city?: string;
    university?: string;
    logo?: string;
    banner?: string;
  } | null {
    if (!pendingUpdateDataJson || typeof pendingUpdateDataJson !== 'string') return null;
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(pendingUpdateDataJson) as Record<string, unknown>;
    } catch {
      return null;
    }
    const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const getStr = (camelKey: string): string | undefined => {
      const v = raw[camelKey] ?? raw[pascal(camelKey)];
      if (v == null || v === undefined) return undefined;
      const str = String(v).trim();
      return str || undefined;
    };
    const logoUrl = getStr('logoUrl') ?? getStr('LogoUrl');
    const bannerUrl = getStr('bannerUrl') ?? getStr('BannerUrl');
    return {
      name: getStr('comName'),
      description: getStr('comAbout') ?? getStr('miniAbout'),
      category: getStr('comCategory'),
      city: getStr('city'),
      university: getStr('university'),
      logo: logoUrl ? this.convertImagePathToFullUrl(logoUrl) : undefined,
      banner: bannerUrl ? this.convertImagePathToFullUrl(bannerUrl) : undefined,
    };
  }

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

  // Featured communities için endpoint. options.skipAuth: true ise token gönderilmez (anasayfa tüm şehirler).
  getFeaturedCommunities(limit: number = 6, options?: { skipAuth?: boolean }): Observable<Community[]> {
    const headers = options?.skipAuth ? new HttpHeaders({ 'X-Public-List': '1' }) : undefined;
    const context = options?.skipAuth ? new HttpContext().set(SKIP_AUTH, true) : undefined;
    return this.http.get<any[]>(`${this.apiUrl}/featured`, {
      ...(headers && { headers }),
      ...(context && { context }),
      ...(options?.skipAuth && { withCredentials: false }),
    }).pipe(
      map((list) => {
        return list.slice(0, limit).map((dto) => {
          const community = this.mapFeaturedDtoToCommunity(dto);
          return this.ensureCommunityAssets(community);
        });
      }),
      catchError((error) => {
        Logger.error('Featured communities yüklenemedi:', error);
        return of([]);
      })
    );
  }

  // FeaturedCommunityDto'yu Community'ye dönüştür
  private mapFeaturedDtoToCommunity(dto: any): Community {
    const isActivity =
      dto.isActivity !== undefined
        ? dto.isActivity
        : dto.IsActivity !== undefined
        ? dto.IsActivity
        : true;

    // ID'yi string olarak sakla (Guid olabilir)
    const communityId = dto.communityId || dto.CommunityId;
    const idString = typeof communityId === 'string' ? communityId : String(communityId);

    // Backend'den gelen tüm alanları map et
    return {
      id: idString,
      name: dto.comName || dto.ComName || '',
      university: dto.university || dto.University || '',
      category: dto.comCategory || dto.ComCategory || 'Genel',
      description: dto.miniAbout || dto.MiniAbout || '',
      logo:
        (dto.logoUrl || dto.LogoUrl) && String(dto.logoUrl || dto.LogoUrl).trim()
          ? this.convertImagePathToFullUrl(dto.logoUrl || dto.LogoUrl)
          : this.placeholderLogo,
      memberCount: dto.memberCount || dto.MemberCount || 0,
      city: dto.city || dto.City || '',
      about: dto.miniAbout || dto.MiniAbout || '',
      banner:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? this.convertImagePathToFullUrl(dto.bannerUrl || dto.BannerUrl)
          : this.placeholderCover,
      coverImage:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? this.convertImagePathToFullUrl(dto.bannerUrl || dto.BannerUrl)
          : this.placeholderCover,
      status: isActivity ? 'Aktif' : 'Pasif',
      miniAbout: dto.miniAbout || dto.MiniAbout || '',
      isActivity: isActivity,
      email: dto.comMail || dto.ComMail || dto.email || dto.Email || '', // Backend'den gelirse kullan
      comMail: dto.comMail || dto.ComMail || '', // Backend'den gelen email
      upcomingEventCount: dto.upcomingEventCount || dto.UpcomingEventCount || 0, // Backend'den gelen event sayısı
    };
  }

  /**
   * Anasayfa "Aramıza yeni katılanlar" için.
   * Backend: GET /api/Communities/latest — AllowAnonymous, 24 topluluk (GetLatestCommunitiesAsync(24)).
   * Response: CommunityLogoDto listesi (comName, logoUrl; backend'de communityId de olabilir).
   */
  getLatestCommunities(options?: { skipAuth?: boolean }): Observable<LatestCommunityItem[]> {
    const context = (options?.skipAuth !== false) ? new HttpContext().set(SKIP_AUTH, true) : undefined;
    const headers = (options?.skipAuth !== false) ? new HttpHeaders({ 'X-Public-List': '1' }) : undefined;
    return this.http.get<any[]>(`${this.apiUrl}/latest`, {
      ...(headers && { headers }),
      ...(context && { context }),
      ...((options?.skipAuth !== false) && { withCredentials: false }),
    }).pipe(
      map((list) => {
        const arr = Array.isArray(list) ? list : [];
        return arr.map((dto: any) => ({
          id: dto.communityId ?? dto.CommunityId ?? undefined,
          comName: dto.comName ?? dto.ComName ?? '',
          logoUrl: (dto.logoUrl ?? dto.LogoUrl ?? '') && String(dto.logoUrl ?? dto.LogoUrl).trim()
            ? this.convertImagePathToFullUrl(dto.logoUrl ?? dto.LogoUrl)
            : this.placeholderLogo,
        }));
      }),
      catchError((err) => {
        Logger.error('Latest communities yüklenemedi:', err);
        return of([]);
      })
    );
  }

  // Yeni katılanlar için - en son eklenen aktif toplulukları getir. options.skipAuth: true ise token gönderilmez (anasayfa tüm şehirler).
  getNewestCommunities(limit: number = 12, options?: { skipAuth?: boolean }): Observable<Community[]> {
    const headers = options?.skipAuth ? new HttpHeaders({ 'X-Public-List': '1' }) : undefined;
    const context = options?.skipAuth ? new HttpContext().set(SKIP_AUTH, true) : undefined;
    return this.http.get<CommunityMiniDto[]>(`${this.apiUrl}?status=active`, {
      ...(headers && { headers }),
      ...(context && { context }),
      ...(options?.skipAuth && { withCredentials: false }),
    }).pipe(
      map((list) => {
        // Backend'den gelen listeyi ComCreatedAt'e göre sırala (eğer varsa)
        // Not: Backend'den ComCreatedAt gelmiyorsa, backend'in döndürdüğü sırayı kullanıyoruz
        const sorted = [...list].sort((a, b) => {
          // ComCreatedAt varsa ona göre sırala (yeni kurulanlar önce - descending)
          const dateA = a.comCreatedAt || a.ComCreatedAt;
          const dateB = b.comCreatedAt || b.ComCreatedAt;

          if (dateA && dateB) {
            try {
              const timeA = new Date(dateA).getTime();
              const timeB = new Date(dateB).getTime();
              // Yeni tarihli (büyük) önce gelsin (descending - yeni kurulanlar önce)
              return timeB - timeA;
            } catch (e) {
              // Tarih parse edilemezse sıralama yapma
              return 0;
            }
          }

          // ComCreatedAt yoksa, backend'in döndürdüğü sırayı koru
          // Backend'de zaten sıralama yapılıyorsa, doğru sırada gelecektir
          return 0;
        });

        // İlk N tanesini al (en yeni kurulanlar)
        return sorted.slice(0, limit).map((dto) => {
          const community = this.mapMiniDtoToCommunity(dto);
          return this.ensureCommunityAssets(community);
        });
      }),
      catchError((error) => {
        Logger.error('Newest communities yüklenemedi:', error);
        return of([]);
      })
    );
  }

  /**
   * Anasayfa sayaç için genel istatistikler (Backend: GET /api/Communities/stats).
   * Public endpoint, auth gerekmez.
   */
  getStats(): Observable<{ totalEvents: number; totalCommunities: number }> {
    const context = new HttpContext().set(SKIP_AUTH, true);
    return this.http.get<{ totalEvents?: number; totalCommunities?: number; TotalEvents?: number; TotalCommunities?: number }>(`${this.apiUrl}/stats`, { context }).pipe(
      map((res) => ({
        totalEvents: res.totalEvents ?? res.TotalEvents ?? 0,
        totalCommunities: res.totalCommunities ?? res.TotalCommunities ?? 0,
      })),
      catchError((err) => {
        Logger.warn('Communities stats yüklenemedi:', err);
        return of({ totalEvents: 0, totalCommunities: 0 });
      })
    );
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

    // comConfirm: 0=yeni kayıt beklemede, 1=onaylandı, 2=reddedildi, 3=silinmiş, 4=güncelleme onayı beklemede. deletedAt varsa da Silinmiş.
    const deletedAt = dto.deletedAt ?? dto.DeletedAt ?? null;
    const comConfirm = dto.comConfirm ?? dto.ComConfirm;
    const hasEverBeenApproved = dto.hasEverBeenApproved ?? dto.HasEverBeenApproved ?? false;
    let status: 'Aktif' | 'Pasif' | 'Onay Bekleyen' | 'Reddedilen' | 'Silinmiş';
    if ((deletedAt != null && deletedAt !== '') || comConfirm === 3) {
      status = 'Silinmiş';
    } else if (comConfirm === 0 || comConfirm === 4 || (comConfirm === undefined && !isActivity)) {
      status = 'Onay Bekleyen';
    } else if (hasEverBeenApproved === true && !isActivity) {
      status = 'Onay Bekleyen';
    } else if (comConfirm === 2) {
      status = 'Reddedilen';
    } else if (isActivity) {
      status = 'Aktif';
    } else {
      status = 'Pasif';
    }
    const isUpdatePending = comConfirm === 4;

    return {
      id: dto.communityId || dto.CommunityId,
      name: dto.comName || dto.ComName,
      university: dto.university || dto.University || '',
      category: dto.comCategory || dto.ComCategory || 'Genel',
      description: dto.miniAbout || dto.MiniAbout,
      logo:
        (dto.logoUrl || dto.LogoUrl) && String(dto.logoUrl || dto.LogoUrl).trim()
          ? this.convertImagePathToFullUrl(dto.logoUrl || dto.LogoUrl)
          : this.placeholderLogo,
      memberCount: 0, // List endpoint'inde memberCount yok
      city: dto.city || dto.City,
      about: dto.miniAbout || dto.MiniAbout,
      banner:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? this.convertImagePathToFullUrl(dto.bannerUrl || dto.BannerUrl)
          : this.placeholderCover,
      coverImage:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? this.convertImagePathToFullUrl(dto.bannerUrl || dto.BannerUrl)
          : this.placeholderCover,
      status: status,
      deletedAt: deletedAt ?? undefined,
      deleteReason: dto.deleteReason ?? dto.DeleteReason ?? undefined,
      miniAbout: dto.miniAbout || dto.MiniAbout,
      isActivity: isActivity,
      comConfirm: comConfirm,
      // Reddedilme nedeni (liste/passive endpoint'inde ConfirmAbout dönebilir)
      confirmAbout: dto.confirmAbout || dto.ConfirmAbout || '',
      // Email alanları - backend'den gelebilir veya detay endpoint'inden çekilecek
      email: dto.comMail || dto.ComMail || '',
      comMail: dto.comMail || dto.ComMail || '',
      comLeadMail: dto.comLeadMail || dto.ComLeadMail || '',
      hasEverBeenApproved: isUpdatePending ? true : (dto.hasEverBeenApproved ?? dto.HasEverBeenApproved ?? undefined),
      pendingUpdateData: dto.pendingUpdateData ?? dto.PendingUpdateData ?? undefined,
    };
  }

  private statusFromDetailDto(dto: any): 'Aktif' | 'Pasif' | 'Onay Bekleyen' | 'Reddedilen' | 'Silinmiş' {
    const comConfirm = dto.comConfirm ?? dto.ComConfirm;
    if (comConfirm === 3) return 'Silinmiş';
    if (comConfirm === 2) return 'Reddedilen';
    if (comConfirm === 0 || comConfirm === 4) return 'Onay Bekleyen';
    const isActivity = dto.isActivity !== undefined ? dto.isActivity : dto.IsActivity;
    return isActivity ? 'Aktif' : 'Pasif';
  }

  // CommunityDetailDto'yu Community'ye dönüştür (Detail için)
  // Backend'den gelen DTO: CommunityDetailDto (CommunityId, ComName, ComAbout, DeletedAt, vb.)
  // Silinmiş topluluk: DeletedAt set veya comConfirm===3 ise status 'Silinmiş'; yoksa statusFromDetailDto.
  private mapDetailDtoToCommunity(dto: any): Community {
    // Backend'den gelen ID - hem communityId (camelCase) hem CommunityId (PascalCase) kontrol et
    const communityId = dto.communityId || dto.CommunityId;
    const idString = typeof communityId === 'string' ? communityId : String(communityId);

    const deletedAt = dto.deletedAt ?? dto.DeletedAt ?? null;
    const comConfirm = dto.comConfirm ?? dto.ComConfirm;
    const isDeleted = (deletedAt != null && deletedAt !== '') || comConfirm === 3;
    const status: 'Aktif' | 'Pasif' | 'Onay Bekleyen' | 'Reddedilen' | 'Silinmiş' = isDeleted
      ? 'Silinmiş'
      : this.statusFromDetailDto(dto);

    return {
      id: idString,
      name: dto.comName || dto.ComName || '',
      university: dto.university || dto.University || '',
      category: dto.comCategory || dto.ComCategory || 'Genel',
      description: dto.comAbout || dto.ComAbout || dto.miniAbout || dto.MiniAbout || '',
      logo:
        (dto.logoUrl || dto.LogoUrl) && String(dto.logoUrl || dto.LogoUrl).trim()
          ? this.convertImagePathToFullUrl(dto.logoUrl || dto.LogoUrl)
          : this.placeholderLogo,
      memberCount: 0, // Backend'de memberCount yok, gerekirse ayrı endpoint'ten çekilebilir
      city: dto.city || dto.City || '',
      about: dto.comAbout || dto.ComAbout || '',
      banner:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? this.convertImagePathToFullUrl(dto.bannerUrl || dto.BannerUrl)
          : this.placeholderCover,
      coverImage:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? this.convertImagePathToFullUrl(dto.bannerUrl || dto.BannerUrl)
          : this.placeholderCover,
      website: dto.webSiteUrl || dto.WebSiteUrl || '',
      email: dto.comMail || dto.ComMail || '',
      instagram: dto.instagramUrl || dto.InstagramUrl || '',
      status,
      deletedAt: isDeleted ? (deletedAt ?? undefined) : undefined,
      deleteReason: dto.deleteReason ?? dto.DeleteReason ?? undefined,
      confirmAbout: dto.confirmAbout || dto.ConfirmAbout || '',
      presidentEmail: dto.comLeadMail || dto.ComLeadMail || '',
      comMail: dto.comMail || dto.ComMail || '',
      comLeadMail: dto.comLeadMail || dto.ComLeadMail || '',
      webSiteUrl: dto.webSiteUrl || dto.WebSiteUrl || '',
      instagramUrl: dto.instagramUrl || dto.InstagramUrl || '',
      miniAbout: dto.miniAbout || dto.MiniAbout || '',
      isActivity:
        dto.isActivity !== undefined
          ? dto.isActivity
          : dto.IsActivity !== undefined
          ? dto.IsActivity
          : true,
      // comConfirm=4 = güncelleme onayı bekliyor → hasEverBeenApproved true (detay pop-up Güncelleme tasarımı için)
      hasEverBeenApproved:
        dto.hasEverBeenApproved ??
        dto.HasEverBeenApproved ??
        (dto.comConfirm === 4 || dto.ComConfirm === 4 ? true : undefined),
      pendingUpdateData: dto.pendingUpdateData ?? dto.PendingUpdateData ?? undefined,
      events: dto.events || dto.Events || [],
      comConfirm: dto.comConfirm ?? dto.ComConfirm ?? undefined,
    };
  }

  /**
   * Public topluluk listesi — sayfa bazlı (backend pagination).
   * GET /api/Communities?page=&pageSize=&name=&city=&category=&university=&sortBy=&sortOrder=
   * Filtre/sıralama değişince page=1 ile, sayfa değişince sadece page ile yeniden istek atın.
   */
  getCommunitiesPublicPage(
    page: number,
    pageSize: number,
    params?: { name?: string; city?: string; category?: string; university?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Observable<{ page: number; pageSize: number; totalCount: number; totalPages: number; items: Community[] }> {
    const searchParams = new URLSearchParams();
    searchParams.set('status', 'active');
    searchParams.set('page', String(page));
    searchParams.set('pageSize', String(pageSize));
    if (params?.name?.trim()) searchParams.set('name', params.name.trim());
    if (params?.city?.trim()) searchParams.set('city', params.city.trim());
    if (params?.category?.trim()) searchParams.set('category', params.category.trim());
    if (params?.university?.trim()) searchParams.set('university', params.university.trim());
    if (params?.sortBy?.trim()) searchParams.set('sortBy', params.sortBy.trim());
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    const url = `${this.apiUrl}?${searchParams.toString()}`;
    return from(
      fetch(url, {
        method: 'GET',
        credentials: 'omit',
        headers: { Accept: 'application/json' },
      }).then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
    ).pipe(
      map((response: any) => {
        const rawItems = response.items ?? (Array.isArray(response) ? response : []);
        const items = rawItems.map((dto: any) => this.mapMiniDtoToCommunity(dto));
        return {
          page: response.page ?? page,
          pageSize: response.pageSize ?? pageSize,
          totalCount: response.totalCount ?? items.length,
          totalPages: response.totalPages ?? Math.max(1, Math.ceil((response.totalCount ?? items.length) / pageSize)),
          items,
        };
      }),
      catchError((err) => {
        Logger.error('Topluluklar yüklenemedi (public):', err);
        return of({ page: 1, pageSize: pageSize, totalCount: 0, totalPages: 0, items: [] });
      })
    );
  }

  /**
   * Public topluluk listesi — tüm sayfayı getirir (sayfa 1, büyük pageSize).
   * Eski davranış; sayfa bazlı için getCommunitiesPublicPage kullanın.
   */
  getAllCommunitiesPublic(params?: { name?: string; category?: string; university?: string }): Observable<Community[]> {
    return this.getCommunitiesPublicPage(1, 9999, params).pipe(
      map((res) => res.items),
      catchError((err) => {
        Logger.error('Topluluklar yüklenemedi (public):', err);
        return of([]);
      })
    );
  }

  /** Backend paginated response: { page, pageSize, totalCount, totalPages, items } */
  getCommunitiesPage(
    page: number,
    pageSize: number,
    params?: {
      city?: string;
      university?: string;
      category?: string;
      name?: string;
      status?:
        | 'active'
        | 'aktif'
        | 'passive'
        | 'pasif'
        | 'pending'
        | 'rejected'
        | 'reddedilen'
        | 'deleted'
        | 'silinmis'
        | 'silinmiş'
        | 'all'
        | 'tumu'
        | 'tümü';
    },
    options?: { skipAuth?: boolean }
  ): Observable<{ page: number; pageSize: number; totalCount: number; totalPages: number; items: Community[] }> {
    let httpParams = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (params?.city && !options?.skipAuth) httpParams = httpParams.set('city', params.city);
    if (params?.university) httpParams = httpParams.set('university', params.university);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.name) httpParams = httpParams.set('name', params.name);
    if (params?.status) httpParams = httpParams.set('status', params.status);

    const context = options?.skipAuth ? new HttpContext().set(SKIP_AUTH, true) : undefined;
    const headers = options?.skipAuth ? new HttpHeaders({ 'X-Public-List': '1' }) : undefined;
    return this.http
      .get<{ page?: number; pageSize?: number; totalCount?: number; totalPages?: number; items?: any[] }>(this.apiUrl, {
        params: httpParams,
        ...(context && { context }),
        ...(headers && { headers }),
        ...(options?.skipAuth && { withCredentials: false }),
      })
      .pipe(
        map((response) => {
          const rawItems = response.items ?? (Array.isArray(response) ? response : []);
          const items = rawItems.map((dto) => this.mapMiniDtoToCommunity(dto));
          return {
            page: response.page ?? page,
            pageSize: response.pageSize ?? pageSize,
            totalCount: response.totalCount ?? items.length,
            totalPages: response.totalPages ?? Math.max(1, Math.ceil((response.totalCount ?? items.length) / pageSize)),
            items,
          };
        }),
        catchError((error) => {
          Logger.error('Topluluklar yüklenemedi:', error);
          return of({ page: 1, pageSize: pageSize, totalCount: 0, totalPages: 0, items: [] });
        })
      );
  }

  // Tüm Toplulukları Getir (Backend: GET /api/Communities — artık sayfalı dönüyor)
  // Sayfa bazlı kullanım için getCommunitiesPage kullanın.
  getAllCommunities(
    params?: {
      city?: string;
      university?: string;
      category?: string;
      name?: string;
      status?:
        | 'active'
        | 'aktif'
        | 'passive'
        | 'pasif'
        | 'pending'
        | 'rejected'
        | 'reddedilen'
        | 'deleted'
        | 'silinmis'
        | 'silinmiş'
        | 'all'
        | 'tumu'
        | 'tümü';
    },
    options?: { skipAuth?: boolean }
  ): Observable<Community[]> {
    return this.getCommunitiesPage(1, 9999, params, options).pipe(
      map((res) => res.items),
      catchError((error) => {
        Logger.error('Topluluklar yüklenemedi:', error);
        return of([]);
      })
    );
  }

  // Topluluk Onay/Red (GSB: PUT /api/Communities/{id}/review)
  // confirm: 1 = onay, 2 = red
  // confirmAbout: red gerekçesi (opsiyonel)
  reviewCommunity(id: string, confirm: 1 | 2, confirmAbout?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/review`, {
      confirm,
      confirmAbout: confirmAbout || '',
    });
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

  /**
   * Topluluk başkanının kendi topluluğunu getirir (onay bekleyen dahil).
   * Backend: GET /api/Communities/lead-by-me — sadece RolId 3 için.
   * 404 dönerse null (topluluk yok). 403 dönerse hata fırlatılır (başkan değişti, erişim kaldırıldı).
   */
  getMyLeadCommunity(): Observable<Community | null> {
    return this.http.get<CommunityDetailDto>(`${this.apiUrl}/lead-by-me`).pipe(
      map((dto) => this.mapDetailDtoToCommunity(dto)),
      catchError((err) => {
        if (err?.status === 404) {
          return of(null);
        }
        // 403: Topluluk başkanı e-postası Kurumsal'da onaylandı, eski başkanın erişimi kaldırıldı
        throw err;
      })
    );
  }

  // Topluluk Detayı Getir (Backend: GET /api/Communities/{id:guid})
  // Pasif topluluklar için isActive=false query parametresi ile liste endpoint'inden çekilir
  getCommunityById(id: string, _isActive?: boolean): Observable<Community> {
    // ID validasyonu - GUID formatında olmalı
    if (!id || id === '' || id.includes('mock')) {
      throw new Error('Geçersiz topluluk ID\'si');
    }

    // Backend artık hem aktif hem pasif topluluklar için aynı detay endpoint'ini destekliyor.
    // Bu yüzden her zaman tek bir çağrı yapıyoruz; 404 dönerse gerçekten yok demektir.
    return this.http.get<CommunityDetailDto>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.mapDetailDtoToCommunity(response)),
      catchError((error) => {
        if (error.status === 404) {
          throw new Error('Topluluk bulunamadı.');
        }
        throw error;
      })
    );
  }

  // Topluluk Oluştur (Backend: POST /api/Communities)
  // Backend Community entity döndürüyor (communityId: Guid)
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  createCommunity(dto: CreateCommunityDto): Observable<Community> {
    return this.http.post<{ communityId: string; comName: string }>(this.apiUrl, dto).pipe(
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
  // options.fromGSB: true → X-From-GSB; backend anında uygular.
  // options.submitForApproval: true → X-Submit-For-Approval; backend güncellemeyi onay bekleyene alır, isActivity gönderilmez.
  updateCommunity(
    id: string,
    dto: UpdateCommunityDto,
    options?: { fromGSB?: boolean; submitForApproval?: boolean }
  ): Observable<Community> {
    let headers = new HttpHeaders();
    if (options?.fromGSB === true) headers = headers.set('X-From-GSB', 'true');
    if (options?.submitForApproval === true) headers = headers.set('X-Submit-For-Approval', 'true');
    const hasOpts = options?.fromGSB === true || options?.submitForApproval === true;

    // Backend endpoint: PUT /api/Communities/update/{id:guid}
    return this.http
      .put<void>(`${this.apiUrl}/update/${id}`, dto, { ...(hasOpts && { headers }) })
      .pipe(
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
                logo:
                  dto.logoUrl !== undefined
                    ? this.convertImagePathToFullUrl(dto.logoUrl) || existing.logo
                    : existing.logo,
                banner:
                  dto.bannerUrl !== undefined
                    ? this.convertImagePathToFullUrl(dto.bannerUrl) || existing.banner
                    : existing.banner,
                coverImage:
                  dto.bannerUrl !== undefined
                    ? this.convertImagePathToFullUrl(dto.bannerUrl) || existing.coverImage
                    : existing.coverImage,
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
              logo:
                (dto.logoUrl && this.convertImagePathToFullUrl(dto.logoUrl)) ||
                this.placeholderLogo,
              banner:
                (dto.bannerUrl && this.convertImagePathToFullUrl(dto.bannerUrl)) ||
                this.placeholderCover,
              coverImage:
                (dto.bannerUrl && this.convertImagePathToFullUrl(dto.bannerUrl)) ||
                this.placeholderCover,
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

  // Topluluk Sil (Backend: DELETE /api/Communities/{id:guid}, body: { Reason } zorunlu; backend silme nedenini topluluk başkanına e-posta ile gönderir ve topluluğu siler)
  deleteCommunity(id: string, reason: string): Observable<void> {
    const deleteUrl = `${this.apiUrl}/${id}`;
    const body = { Reason: (reason || '').trim() };
    return this.http
      .request<void>('DELETE', deleteUrl, {
        body,
      })
      .pipe(
        catchError((error) => {
          Logger.error('DELETE request failed:', error);
          throw error;
        })
      );
  }

  /**
   * Önce topluluğun aktif durumunu pasife çevirir (isActivity: false), sonra topluluğu siler.
   * Kurumsal dashboard "Topluluğu Sil" için kullanılır.
   */
  setPassiveAndDeleteCommunity(id: string, reason: string): Observable<void> {
    const updateDto: UpdateCommunityDto = { isActivity: false };
    return this.updateCommunity(id, updateDto).pipe(
      catchError(() => of(null as unknown as Community)),
      switchMap(() => this.deleteCommunity(id, reason))
    );
  }

  // Üye Ekle (Backend: POST /api/Communities/me/members)
  // Backend endpoint: POST /api/Communities/me/members
  // Token'daki topluluk lideri için üye ekleme (id gerekmez, token'dan alınır)
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  addMember(id: string, dto: AddCommunityMemberDto): Observable<void> {
    // Backend PascalCase bekliyor (Email), frontend camelCase gönderiyor (email)
    // Email'i temizle: parantez içindeki email'i çıkar veya sadece email kısmını al
    let cleanEmail = dto.email.trim();

    // Parantez içindeki email'i çıkar (örn: "isim (email@edu.tr)" -> "email@edu.tr")
    const emailInParens = cleanEmail.match(/\(([^)]+@[^)]+)\)/);
    if (emailInParens && emailInParens[1]) {
      cleanEmail = emailInParens[1].trim();
    } else {
      // Parantez yoksa, email formatında olmayan kısımları temizle
      // Sadece @ işareti içeren kısmı al
      const emailMatch = cleanEmail.match(/([^\s()]+@[^\s()]+)/);
      if (emailMatch && emailMatch[1]) {
        cleanEmail = emailMatch[1].trim();
      }
      // Parantez ve boşlukları temizle
      cleanEmail = cleanEmail.replace(/[()]/g, '').trim();
    }

    // Tüm görünmeyen karakterleri ve boşlukları temizle
    cleanEmail = cleanEmail
      .replace(/\s+/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();

    // Email'in sonundaki nokta, virgül, parantez gibi karakterleri temizle
    cleanEmail = cleanEmail.replace(/[.,;:!?)\]}]+$/, '').trim();

    // Email formatını doğrula ve sadece geçerli email karakterlerini tut
    // Email formatı: local@domain
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      // Eğer email formatı geçersizse, sadece @ işareti içeren kısmı al
      const emailParts = cleanEmail.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailParts && emailParts[1]) {
        cleanEmail = emailParts[1].trim();
      }
    }

    // DTO'yu backend'in beklediği formata çevir
    const backendDto = {
      Email: cleanEmail,
    };

    return this.http.post<{ message?: string }>(`${this.apiUrl}/me/members`, backendDto).pipe(
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

  // Topluluk Üyelerini Getir (Backend: GET /api/Communities/me/members)
  // Mevcut liderin topluluğunun üyelerini getirir
  // Backend endpoint: GET /api/Communities/me/members
  // Token'daki topluluk lideri için üyeleri getirir (id parametresi yok, token'dan alınır)
  // Auth interceptor automatically adds Authorization header if token exists
  getCommunityMembers(id: string): Observable<any[]> {
    // Backend endpoint: GET /api/Communities/me/members
    // id parametresi kullanılmıyor, token'dan topluluk bilgisi alınıyor
    return this.http.get<any[]>(`${this.apiUrl}/me/members`).pipe(
      map((response) => {
        // Backend'den gelen CommunityMemberDto formatını dönüştür
        return response.map((dto: any) => ({
          id: dto.userId || dto.UserId || 0,
          name: dto.name || dto.Name || '',
          email: dto.email || dto.Email || '',
          role: 'Üye', // Backend'den role gelmiyor, default 'Üye'
          department: '',
          phone: '',
          grade: '',
          status: 'Aktif',
          university: '',
        }));
      }),
      catchError(() => {
        return of([]);
      })
    );
  }

  // Topluluğa üye olmayan öğrencileri ara
  // NOT: Backend'de bu endpoint henüz yok, boş array döndürüyoruz
  // Gelecekte backend'de endpoint eklendiğinde buraya bağlanacak
  searchNonMemberStudents(query: string): Observable<any[]> {
    // Backend'de search-students endpoint'i yok, şimdilik boş array döndürüyoruz
    return of([]);
  }

  // Email ile kullanıcı kontrolü (SADECE KONTROL - EKLEME YAPMAZ)
  // Backend'de sadece kontrol yapan bir endpoint olmadığı için, mevcut üyeleri kontrol ediyoruz
  // Email yazılırken sadece kontrol yapılır, ekleme yapılmaz
  // Ekleme işlemi sadece "Kaydet" butonuna basıldığında yapılır
  checkUserExistsByEmail(email: string): Observable<{
    exists: boolean;
    name?: string;
    message?: string;
    roleId?: number;
    isCorporate?: boolean;
  }> {
    if (!email || !email.trim()) {
      return of({ exists: false, message: 'Email adresi boş olamaz' });
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return of({ exists: false, message: 'Geçersiz email formatı' });
    }

    // Email .edu.tr uzantılı olmalı
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith('.edu.tr')) {
      return of({
        exists: false,
        message: 'Sadece .edu.tr uzantılı e-posta adresleri eklenebilir.',
        roleId: undefined,
        isCorporate: false,
      });
    }

    // Mevcut üyeleri getir ve email'in listede olup olmadığını kontrol et
    // Bu şekilde kullanıcıyı eklemeden sadece kontrol yapıyoruz
    return this.getCommunityMembers('').pipe(
      map((members) => {
        // Email'in listede olup olmadığını kontrol et
        const memberExists = members.some((m: any) => m.email?.toLowerCase() === cleanEmail);

        if (memberExists) {
          // Kullanıcı zaten üye
          return {
            exists: true,
            message: 'Kullanıcı zaten üye',
            roleId: 1,
            isCorporate: false,
          };
        } else {
          // Kullanıcı üye değil - eklenebilir
          // Backend'de kullanıcı var mı kontrol edemiyoruz (sadece kontrol endpoint'i yok)
          // Bu yüzden kullanıcının var olduğunu varsayıyoruz
          // Gerçek kontrol "Kaydet" butonuna basıldığında yapılacak
          return {
            exists: true,
            message: 'Kullanıcı eklenebilir',
            roleId: 1,
            isCorporate: false,
          };
        }
      }),
      catchError((error: any) => {
        // Hata durumunda kullanıcının var olduğunu varsayalım
        // Gerçek kontrol "Kaydet" butonuna basıldığında yapılacak
        return of({
          exists: true,
          message: 'Kullanıcı kontrol edilemedi',
          roleId: 1,
          isCorporate: false,
        });
      })
    );
  }

  // Toplu Üye Ekle (Backend: POST /api/Communities/me/members/bulk)
  // Backend endpoint: POST /api/Communities/me/members/bulk
  // Token'daki topluluk lideri için toplu üye ekleme (id parametresi yok, token'dan alınır)
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  bulkAddMembers(emails: string[]): Observable<{
    added: string[];
    alreadyMember: string[];
    invalidDomain: string[];
    notFound: string[];
    rejectedRole: string[];
  }> {
    // Backend virgülle ayrılmış string bekliyor
    const emailsString = emails.join(',');

    const backendDto = {
      Emails: emailsString,
    };

    return this.http
      .post<{
        added?: string[];
        alreadyMember?: string[];
        invalidDomain?: string[];
        notFound?: string[];
        rejectedRole?: string[];
      }>(`${this.apiUrl}/me/members/bulk`, backendDto)
      .pipe(
        map((response) => ({
          added: response.added || [],
          alreadyMember: response.alreadyMember || [],
          invalidDomain: response.invalidDomain || [],
          notFound: response.notFound || [],
          rejectedRole: response.rejectedRole || [],
        })),
        catchError((error) => {
          throw error;
        })
      );
  }

  // Üye Çıkar (Backend: DELETE /api/Communities/me/members)
  // Backend endpoint: DELETE /api/Communities/me/members
  // Token'daki topluluk lideri için üye çıkarma (id parametresi yok, token'dan alınır)
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  removeMember(id: string, dto: RemoveCommunityMemberDto): Observable<void> {
    // Backend PascalCase bekliyor (Email), frontend camelCase gönderiyor (email)
    // DTO'yu backend'in beklediği formata çevir
    const backendDto = {
      Email: dto.email,
    };

    return this.http.delete<void>(`${this.apiUrl}/me/members`, { body: backendDto }).pipe(
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
  /**
   * Leave a community (for students)
   * Uses backend endpoint: DELETE /api/Communities/me/memberships/{communityId}
   * Note: This endpoint needs to be created in the backend
   * For now, we'll try to use this endpoint and handle 404 if it doesn't exist
   */
  leaveCommunity(communityId: string): Observable<void> {
    // Backend endpoint: DELETE /api/Communities/me/memberships
    // Body'de { CommunityId: Guid } gönderilmeli
    // HttpClient.delete() body kabul etmediği için request() kullanıyoruz
    // Auth interceptor automatically adds Authorization header and Content-Type if token exists
    const body = {
      CommunityId: communityId,
    };

    return this.http
      .request<void>('DELETE', `${this.apiUrl}/me/memberships`, {
        body,
      })
      .pipe(
        catchError((error) => {
          throw error;
        })
      );
  }

  /**
   * Get communities where the current user is a member (for students)
   * Uses backend endpoint: GET /api/Communities/me/memberships
   * Returns communities with their events
   */
  getMyMemberships(): Observable<any[]> {
    // Auth interceptor automatically adds Authorization header if token exists
    return this.http.get<any[]>(`${this.apiUrl}/me/memberships`).pipe(
      map((response) => {
        // Backend MemberCommunityDto formatını Community formatına çevir
        return response.map((dto: any) => ({
          id: dto.communityId || dto.CommunityId,
          name: dto.comName || dto.ComName,
          university: dto.university || dto.University || '',
          category: dto.comCategory || dto.ComCategory || 'Genel',
          description: dto.comAbout || dto.ComAbout || dto.miniAbout || dto.MiniAbout,
          logo:
            dto.logoUrl || dto.LogoUrl
              ? this.convertImagePathToFullUrl(dto.logoUrl || dto.LogoUrl)
              : this.placeholderLogo,
          memberCount: 0,
          city: dto.city || dto.City || '',
          about: dto.comAbout || dto.ComAbout,
          banner:
            dto.bannerUrl || dto.BannerUrl
              ? this.convertImagePathToFullUrl(dto.bannerUrl || dto.BannerUrl)
              : this.placeholderCover,
          coverImage:
            dto.bannerUrl || dto.BannerUrl
              ? this.convertImagePathToFullUrl(dto.bannerUrl || dto.BannerUrl)
              : this.placeholderCover,
          status: 'Aktif',
          isActivity: true,
          events: dto.events || dto.Events || [], // Topluluk etkinlikleri
          joinedDate: dto.joinedDate || dto.JoinedDate, // Üyelik tarihi
        }));
      })
      // catchError kaldırıldı - hataları component'te handle edelim
    );
  }

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
        })
        // catchError kaldırıldı - hataları component'te handle edelim
      );
    } catch (e) {
      // Error parsing user info
      return of([]);
    }
  }

  // Corporate dashboard için uyumluluk metodu (eski interface ile çalışır)
  // options.fromGSB: true → GSB panelinden güncelleme; backend onay kuyruğuna almadan anında uygular
  addOrUpdateCommunity(
    community: Community & { presidentEmail?: string },
    options?: { fromGSB?: boolean }
  ): Observable<Community> {
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
      // Base64 data URI'leri kaldır - backend bunları kabul etmiyor
      // Sadece dosya yükleme endpoint'lerini kullanacağız
      let logoUrl = community.logo || '';
      let bannerUrl = community.banner || '';

      // Eğer base64 data URI ise, undefined yap (backend'e gönderilmesin)
      if (logoUrl && logoUrl.startsWith('data:')) {
        logoUrl = undefined as any;
      }
      if (bannerUrl && bannerUrl.startsWith('data:')) {
        bannerUrl = undefined as any;
      }

      // Backend'de !string.IsNullOrWhiteSpace() kontrolü var
      // Boş string ('') gönderilirse güncelleme yapılmaz
      // Bu yüzden boş string'leri undefined'a çeviriyoruz (ya da değer varsa gönderiyoruz)
      const toValueOrUndefined = (val: string | undefined | null): string | undefined => {
        return val && val.trim() !== '' ? val.trim() : undefined;
      };

      // miniAbout için özel fonksiyon - boş string de gönderilmeli (backend'de güncelleme yapılabilmesi için)
      const toMiniAboutValue = (val: string | undefined | null): string | undefined => {
        if (val === undefined || val === null) return undefined;
        // Boş string veya sadece whitespace ise boş string gönder (backend'de güncelleme yapılabilmesi için)
        const trimmed = val.trim();
        return trimmed === '' ? '' : trimmed;
      };

      const updateDto: UpdateCommunityDto = {
        comName: toValueOrUndefined(community.name),
        comAbout: toValueOrUndefined(community.about || community.description),
        city: toValueOrUndefined(community.city),
        university: toValueOrUndefined(community.university),
        comCategory: toValueOrUndefined(community.category),
        logoUrl: toValueOrUndefined(logoUrl),
        comMail: toValueOrUndefined(community.email || community.comMail),
        webSiteUrl: toValueOrUndefined(community.website || community.webSiteUrl),
        instagramUrl: toValueOrUndefined(community.instagram || community.instagramUrl),
        bannerUrl: toValueOrUndefined(bannerUrl),
        miniAbout: toMiniAboutValue(community.miniAbout), // miniAbout için özel fonksiyon kullan
        isActivity: isActivity,
        comLeadMail: toValueOrUndefined(community.presidentEmail || community.comLeadMail),
      };

      return this.updateCommunity(community.id, updateDto, options);
    } else {
      // Yeni topluluk oluşturma - ComLeadMail zorunlu
      if (!community.presidentEmail && !community.comLeadMail) {
        throw new Error('Topluluk başkanı email adresi (comLeadMail) zorunludur.');
      }
      // Base64 data URI'leri kaldır - backend bunları kabul etmiyor
      // Sadece dosya yükleme endpoint'lerini kullanacağız
      let logoUrl = community.logo || '';
      let bannerUrl = community.banner || '';

      // Eğer base64 data URI ise, undefined yap (backend'e gönderilmesin)
      if (logoUrl && logoUrl.startsWith('data:')) {
        logoUrl = undefined as any;
      }
      if (bannerUrl && bannerUrl.startsWith('data:')) {
        bannerUrl = undefined as any;
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
        logoUrl: logoUrl || undefined,
        bannerUrl: bannerUrl || undefined,
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
            return this.updateCommunity(createdCommunity.id, updateDto, options);
          }
          return of(createdCommunity);
        })
      );
    }
  }

  // Topluluk banner yükle (Backend: POST /api/Communities/{id}/banner)
  // options.setupToken: Topluluk kaydı sırasında complete-community-setup sonrası JWT dönmezse bu token ile yetkilendirme (X-Setup-Token header)
  uploadBanner(
    communityId: string,
    file: File,
    options?: { setupToken?: string }
  ): Observable<{ BannerUrl: string }> {
    const formData = new FormData();
    formData.append('File', file, file.name);

    const useSetupToken = !!options?.setupToken?.trim();
    const ctx = useSetupToken ? new HttpContext().set(SKIP_AUTH, true) : undefined;
    const headers = useSetupToken
      ? new HttpHeaders().set('X-Setup-Token', options!.setupToken!.trim())
      : undefined;

    return this.http
      .post<{ BannerUrl?: string; bannerUrl?: string }>(
        `${this.apiUrl}/${communityId}/banner`,
        formData,
        { ...(ctx && { context: ctx }), ...(headers && { headers }) }
      )
      .pipe(
        map((response: any) => {
          const path = response.BannerUrl || response.bannerUrl || '';
          // Backend'den `/assets/img/Banner/...` formatında gelir, `/ImagesUnides/Banner/...` formatına çevir
          if (
            path &&
            !path.startsWith('http://') &&
            !path.startsWith('https://') &&
            !path.startsWith('data:')
          ) {
            let finalPath = path;
            if (!finalPath.startsWith('/')) {
              finalPath = '/' + finalPath;
            }
            // Path dönüşümü: `/assets/img/` -> `/ImagesUnides/`
            if (finalPath.startsWith('/assets/img/')) {
              finalPath = finalPath.replace('/assets/img/', '/ImagesUnides/');
            } else if (finalPath.startsWith('/images/')) {
              finalPath = finalPath.replace('/images/', '/ImagesUnides/');
            }
            return { BannerUrl: finalPath };
          }
          if (path.startsWith('http')) {
            try {
              const pathname = new URL(path).pathname;
              const norm = pathname.startsWith('/images/')
                ? pathname.replace('/images/', '/ImagesUnides/')
                : pathname.startsWith('/assets/img/')
                ? pathname.replace('/assets/img/', '/ImagesUnides/')
                : pathname;
              return {
                BannerUrl: norm.startsWith('/ImagesUnides/')
                  ? norm
                  : '/ImagesUnides/' + norm.replace(/^\//, ''),
              };
            } catch {
              return { BannerUrl: path };
            }
          }
          return { BannerUrl: path };
        }),
        catchError((error) => {
          throw error;
        })
      );
  }

  // Topluluk logo yükle
  // options.setupToken: Topluluk kaydı sırasında complete-community-setup sonrası JWT dönmezse bu token ile yetkilendirme (X-Setup-Token header)
  uploadLogo(
    communityId: string,
    file: File,
    options?: { setupToken?: string }
  ): Observable<{ LogoUrl: string }> {
    const formData = new FormData();
    formData.append('File', file, file.name);

    const useSetupToken = !!options?.setupToken?.trim();
    const ctx = useSetupToken ? new HttpContext().set(SKIP_AUTH, true) : undefined;
    const headers = useSetupToken
      ? new HttpHeaders().set('X-Setup-Token', options!.setupToken!.trim())
      : undefined;

    return this.http
      .post<{ LogoUrl?: string; logoUrl?: string }>(
        `${this.apiUrl}/${communityId}/logo`,
        formData,
        { ...(ctx && { context: ctx }), ...(headers && { headers }) }
      )
      .pipe(
        map((response: any) => {
          const path = response.LogoUrl || response.logoUrl || '';
          // Backend'den `/assets/img/Logo/...` formatında gelir, `/ImagesUnides/Logo/...` formatına çevir
          if (
            path &&
            !path.startsWith('http://') &&
            !path.startsWith('https://') &&
            !path.startsWith('data:')
          ) {
            let finalPath = path;
            if (!finalPath.startsWith('/')) {
              finalPath = '/' + finalPath;
            }
            // Path dönüşümü: `/assets/img/` -> `/ImagesUnides/`
            if (finalPath.startsWith('/assets/img/')) {
              finalPath = finalPath.replace('/assets/img/', '/ImagesUnides/');
            } else if (finalPath.startsWith('/images/')) {
              finalPath = finalPath.replace('/images/', '/ImagesUnides/');
            }
            return { LogoUrl: finalPath };
          }
          if (path.startsWith('http')) {
            try {
              const pathname = new URL(path).pathname;
              const norm = pathname.startsWith('/images/')
                ? pathname.replace('/images/', '/ImagesUnides/')
                : pathname.startsWith('/assets/img/')
                ? pathname.replace('/assets/img/', '/ImagesUnides/')
                : pathname;
              return {
                LogoUrl: norm.startsWith('/ImagesUnides/')
                  ? norm
                  : '/ImagesUnides/' + norm.replace(/^\//, ''),
              };
            } catch {
              return { LogoUrl: path };
            }
          }
          return { LogoUrl: path };
        }),
        catchError((error) => {
          throw error;
        })
      );
  }

  // Topluluk başkanı için istatistikleri getir
  // Auth interceptor automatically adds Authorization header if token exists
  getLeaderStats(): Observable<{
    totalMembers: number;
    approvedEvents: number;
    pendingEvents: number;
    totalEvents: number;
  }> {
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
      }>(`${this.apiUrl}/leader-stats`)
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
