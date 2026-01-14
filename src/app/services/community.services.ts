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

  // Featured communities için endpoint
  getFeaturedCommunities(limit: number = 6): Observable<Community[]> {
    return this.http.get<any[]>(`${this.apiUrl}/featured`).pipe(
      map((list) => {
        return list.slice(0, limit).map((dto) => {
          const community = this.mapFeaturedDtoToCommunity(dto);
          return this.ensureCommunityAssets(community);
        });
      }),
      catchError((error) => {
        console.error('Featured communities yüklenemedi:', error);
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
          ? dto.logoUrl || dto.LogoUrl
          : this.placeholderLogo,
      memberCount: dto.memberCount || dto.MemberCount || 0,
      city: dto.city || dto.City || '',
      about: dto.miniAbout || dto.MiniAbout || '',
      banner:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? dto.bannerUrl || dto.BannerUrl
          : this.placeholderCover,
      coverImage:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? dto.bannerUrl || dto.BannerUrl
          : this.placeholderCover,
      status: isActivity ? 'Aktif' : 'Pasif',
      miniAbout: dto.miniAbout || dto.MiniAbout || '',
      isActivity: isActivity,
      email: dto.comMail || dto.ComMail || dto.email || dto.Email || '', // Backend'den gelirse kullan
      comMail: dto.comMail || dto.ComMail || '', // Backend'den gelen email
      upcomingEventCount: dto.upcomingEventCount || dto.UpcomingEventCount || 0, // Backend'den gelen event sayısı
    };
  }

  // Yeni katılanlar için - en son eklenen aktif toplulukları getir
  getNewestCommunities(limit: number = 12): Observable<Community[]> {
    return this.http.get<CommunityMiniDto[]>(`${this.apiUrl}?status=active`).pipe(
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
        console.error('Newest communities yüklenemedi:', error);
        return of([]);
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
        // Hata durumunda mock data döndür
        const mockCommunity: Community = {
          id: 'mock-id-1',
          name: 'Yazılım ve Teknoloji Topluluğu (Demo)',
          university: 'Demo Üniversitesi',
          category: 'Teknoloji',
          description: 'Teknoloji ve yazılım meraklılarını bir araya getiren topluluk.',
          logo: 'assets/img/placeholder-logo.svg',
          banner: 'assets/img/placeholder-cover.svg',
          coverImage: 'assets/img/placeholder-cover.svg',
          memberCount: 150,
          city: 'İstanbul',
          about: 'Bu bir demo topluluktur. Detayları inceleyebilirsiniz.',
          status: 'Aktif',
          isActivity: true,
          miniAbout: 'Teknoloji ve yazılım meraklılarını bir araya getiren topluluk.',
          email: 'demo@community.com',
          presidentEmail: 'baskan@demo.com',
          comLeadMail: 'baskan@demo.com',
        };
        return of([mockCommunity]);
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
        // Hata durumunda mock data döndür (Demo için)
        if (id === 'mock-id-1' || error.status === 0 || error.status === 404) {
          const mockCommunity: Community = {
            id: 'mock-id-1',
            name: 'Yazılım ve Teknoloji Topluluğu (Demo)',
            university: 'Demo Üniversitesi',
            category: 'Teknoloji',
            description: 'Teknoloji ve yazılım meraklılarını bir araya getiren topluluk.',
            logo: 'assets/img/placeholder-logo.svg',
            banner: 'assets/img/placeholder-cover.svg',
            coverImage: 'assets/img/placeholder-cover.svg',
            memberCount: 150,
            city: 'İstanbul',
            about: 'Bu bir demo topluluktur. Detayları inceleyebilirsiniz.',
            status: 'Aktif',
            isActivity: true,
            miniAbout: 'Teknoloji ve yazılım meraklılarını bir araya getiren topluluk.',
            email: 'demo@community.com',
            presidentEmail: 'baskan@demo.com',
            comLeadMail: 'baskan@demo.com',
            webSiteUrl: 'https://demo.com',
            instagramUrl: 'https://instagram.com/demo',
            events: [],
          };
          return of(mockCommunity);
        }
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

  // Üye Ekle (Backend: POST /api/Communities/me/members)
  addMember(id: string, dto: AddCommunityMemberDto): Observable<void> {
    // Get auth token for authenticated request
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        })
      : new HttpHeaders({ 'Content-Type': 'application/json' });

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

    // Debug için console.log (production'da kaldırılabilir)
    console.log('Original email:', JSON.stringify(dto.email));
    console.log('Cleaned email:', JSON.stringify(cleanEmail));
    console.log('Email length:', cleanEmail.length);
    console.log('Email ends with .edu.tr:', cleanEmail.toLowerCase().endsWith('.edu.tr'));
    console.log('Last 7 chars:', JSON.stringify(cleanEmail.slice(-7)));

    // DTO'yu backend'in beklediği formata çevir
    const backendDto = {
      Email: cleanEmail,
    };

    return this.http
      .post<{ message?: string }>(`${this.apiUrl}/me/members`, backendDto, { headers })
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

  // Topluluk Üyelerini Getir (Backend: GET /api/Communities/me/members)
  // Mevcut liderin topluluğunun üyelerini getirir
  getCommunityMembers(id: string): Observable<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      return of([]);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any[]>(`${this.apiUrl}/me/members`, { headers }).pipe(
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
      catchError((error) => {
        console.error('Topluluk üyeleri yüklenirken hata:', error);
        return of([]);
      })
    );
  }

  // Topluluğa üye olmayan öğrencileri ara (Backend: GET /api/Communities/me/search-students?query=...)
  searchNonMemberStudents(query: string): Observable<any[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const trimmedQuery = query?.trim() || '';
    // İlk harf yazıldığında aramayı başlat (minimum 1 karakter)
    if (!token || !trimmedQuery || trimmedQuery.length < 1) {
      return of([]);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const params = new HttpParams().set('query', query.trim());

    return this.http.get<any[]>(`${this.apiUrl}/me/search-students`, { headers, params }).pipe(
      map((response) => {
        return response.map((s: any) => ({
          id: s.userId || s.UserId || 0,
          name: s.name || s.Name || '',
          email: s.email || s.Email || '',
        }));
      }),
      catchError((error) => {
        console.error('Öğrenci arama hatası:', error);
        return of([]);
      })
    );
  }

  // Üye Çıkar (Backend: DELETE /api/Communities/me/members)
  removeMember(id: string, dto: RemoveCommunityMemberDto): Observable<void> {
    // Get auth token for authenticated request
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers = token
      ? new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        })
      : new HttpHeaders({ 'Content-Type': 'application/json' });

    // Backend PascalCase bekliyor (Email), frontend camelCase gönderiyor (email)
    // DTO'yu backend'in beklediği formata çevir
    const backendDto = {
      Email: dto.email,
    };

    return this.http.delete<void>(`${this.apiUrl}/me/members`, { body: backendDto, headers }).pipe(
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('Topluluktan ayrılmak için giriş yapmanız gerekiyor.');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    // Backend'de bu endpoint oluşturulmalı: DELETE /api/Communities/me/memberships/{communityId}
    // Şimdilik bu endpoint'i kullanıyoruz, eğer yoksa 404 hatası alacağız
    return this.http.delete<void>(`${this.apiUrl}/me/memberships/${communityId}`, { headers }).pipe(
      catchError((error) => {
        // Eğer endpoint yoksa (404), backend'de bu endpoint oluşturulmalı
        if (error.status === 404) {
          throw new Error(
            "Topluluktan ayrılma işlemi için backend endpoint'i bulunamadı. Backend'de DELETE /api/Communities/me/memberships/{communityId} endpoint'i oluşturulmalı."
          );
        }
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      return of([]);
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any[]>(`${this.apiUrl}/me/memberships`, { headers }).pipe(
      map((response) => {
        // Backend MemberCommunityDto formatını Community formatına çevir
        return response.map((dto: any) => ({
          id: dto.communityId || dto.CommunityId,
          name: dto.comName || dto.ComName,
          university: dto.university || dto.University || '',
          category: dto.comCategory || dto.ComCategory || 'Genel',
          description: dto.comAbout || dto.ComAbout || dto.miniAbout || dto.MiniAbout,
          logo: dto.logoUrl || dto.LogoUrl || this.placeholderLogo,
          memberCount: 0,
          city: dto.city || dto.City || '',
          about: dto.comAbout || dto.ComAbout,
          banner: dto.bannerUrl || dto.BannerUrl || this.placeholderCover,
          coverImage: dto.bannerUrl || dto.BannerUrl || this.placeholderCover,
          status: 'Aktif',
          isActivity: true,
          events: dto.events || dto.Events || [], // Topluluk etkinlikleri
          joinedDate: dto.joinedDate || dto.JoinedDate, // Üyelik tarihi
        }));
      }),
      catchError((error) => {
        console.error('Error fetching memberships:', error);
        if (error.status === 401 || error.status === 403) {
          // Unauthorized access - returning empty list
        }
        return of([]);
      })
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
