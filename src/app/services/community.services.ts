import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap, forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
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
  private apiUrl = `${environment.apiUrl}/Communities`;
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
  // Backend'den gelen DTO: CommunityDetailDto (CommunityId, ComName, ComAbout, vb.)
  // C# JSON serialization genellikle camelCase'e çevirir, ama hem camelCase hem PascalCase kontrol ediyoruz
  private mapDetailDtoToCommunity(dto: any): Community {
    // Backend'den gelen ID - hem communityId (camelCase) hem CommunityId (PascalCase) kontrol et
    const communityId = dto.communityId || dto.CommunityId;
    const idString = typeof communityId === 'string' ? communityId : String(communityId);

    return {
      id: idString,
      name: dto.comName || dto.ComName || '',
      university: dto.university || dto.University || '',
      category: dto.comCategory || dto.ComCategory || 'Genel',
      description: dto.comAbout || dto.ComAbout || dto.miniAbout || dto.MiniAbout || '',
      logo:
        (dto.logoUrl || dto.LogoUrl) && String(dto.logoUrl || dto.LogoUrl).trim()
          ? dto.logoUrl || dto.LogoUrl
          : this.placeholderLogo,
      memberCount: 0, // Backend'de memberCount yok, gerekirse ayrı endpoint'ten çekilebilir
      city: dto.city || dto.City || '',
      about: dto.comAbout || dto.ComAbout || '',
      banner:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? dto.bannerUrl || dto.BannerUrl
          : this.placeholderCover,
      coverImage:
        (dto.bannerUrl || dto.BannerUrl) && String(dto.bannerUrl || dto.BannerUrl).trim()
          ? dto.bannerUrl || dto.BannerUrl
          : this.placeholderCover,
      website: dto.webSiteUrl || dto.WebSiteUrl || '',
      email: dto.comMail || dto.ComMail || '',
      instagram: dto.instagramUrl || dto.InstagramUrl || '',
      status: (dto.isActivity !== undefined ? dto.isActivity : dto.IsActivity) ? 'Aktif' : 'Pasif',
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
      events: dto.events || dto.Events || [],
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

    // Auth interceptor automatically adds Authorization header if token exists
    return this.http.get<CommunityMiniDto[]>(this.apiUrl, { params: httpParams }).pipe(
      map((response) => {
        const mapped = response.map((dto) => this.mapMiniDtoToCommunity(dto));
        return mapped;
      }),
      catchError((error) => {
        console.error('Topluluklar yüklenemedi:', error);
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
    // ID validasyonu - GUID formatında olmalı
    if (!id || id === '' || id.includes('mock')) {
      throw new Error("Geçersiz topluluk ID'si");
    }

    // Backend endpoint: GET /api/Communities/{id:guid}
    // Backend'den CommunityDetailDto döner
    // Auth interceptor automatically adds Authorization header if token exists
    return this.http.get<CommunityDetailDto>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        // Backend'den gelen response'u map et
        // Backend'de CommunityId (PascalCase) var, JSON serialization'da camelCase'e çevrilir
        return this.mapDetailDtoToCommunity(response);
      }),
      catchError((error) => {
        // Backend'de IsActivity kontrolü var - pasif topluluklar için 404 döner
        if (error.status === 404) {
          throw new Error('Topluluk bulunamadı veya pasif durumda.');
        }
        // Diğer hatalar için
        throw error;
      })
    );
  }

  // Topluluk Oluştur (Backend: POST /api/Communities)
  // Backend Community entity döndürüyor (communityId: Guid)
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  createCommunity(dto: CreateCommunityDto): Observable<Community> {
    return this.http
      .post<{ communityId: string; comName: string }>(this.apiUrl, dto)
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
  // Auth interceptor automatically adds Authorization header and Content-Type if token exists
  updateCommunity(id: string, dto: UpdateCommunityDto): Observable<Community> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto).pipe(
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
    // Auth interceptor automatically adds Authorization header if token exists
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        // Hata zaten throw ediliyor
        throw error;
      })
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
      .post<{ message?: string }>(`${this.apiUrl}/me/members`, backendDto)
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
      catchError((error) => {
        console.error('Topluluk üyeleri yüklenirken hata:', error);
        return of([]);
      })
    );
  }

  // Topluluğa üye olmayan öğrencileri ara
  // NOT: Backend'de bu endpoint henüz yok, boş array döndürüyoruz
  // Gelecekte backend'de endpoint eklendiğinde buraya bağlanacak
  searchNonMemberStudents(query: string): Observable<any[]> {
    // Backend'de search-students endpoint'i yok, şimdilik boş array döndürüyoruz
    console.warn("search-students endpoint backend'de henüz mevcut değil");
    return of([]);
  }

  // Email ile kullanıcı kontrolü
  // Backend'de özel bir endpoint olmadığı için, addMember endpoint'ini kullanarak
  // kullanıcının var olup olmadığını kontrol ediyoruz
  // NOT: Bu metod sadece kontrol amaçlıdır, ama eğer kullanıcı varsa ve üye değilse ekler
  // Bu yüzden sadece kontrol için kullanılmalı, gerçek ekleme işlemi için addMember kullanılmalı
  checkUserExistsByEmail(email: string): Observable<{ exists: boolean; name?: string; message?: string }> {
    if (!email || !email.trim()) {
      return of({ exists: false, message: 'Email adresi boş olamaz' });
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return of({ exists: false, message: 'Geçersiz email formatı' });
    }

    // Backend'de addMember endpoint'ini kullanarak kullanıcı kontrolü yap
    // Eğer NotFound (404) alırsak, kullanıcı yok demektir
    // Eğer başka bir hata alırsak (Conflict, Forbidden, vs.), kullanıcı var demektir
    // Eğer Success (200) alırsak, kullanıcı var ve eklendi demektir
    const backendDto = {
      Email: email.trim(),
    };

    return this.http.post<{ message?: string }>(`${this.apiUrl}/me/members`, backendDto).pipe(
      map(() => {
        // Success: Kullanıcı var ve eklendi
        // NOT: Bu durumda kullanıcı gerçekten eklenmiş olur, bu yüzden dikkatli kullanılmalı
        return { exists: true, message: 'Kullanıcı bulundu ve eklendi' };
      }),
      catchError((error: any) => {
        // 404: Kullanıcı bulunamadı
        if (error.status === 404) {
          return of({ exists: false, message: error.error?.message || 'Kullanıcı bulunamadı' });
        }
        // 409: Kullanıcı zaten üye (kullanıcı var demektir)
        if (error.status === 409) {
          return of({ exists: true, message: 'Kullanıcı zaten üye' });
        }
        // 403: GSB yetkilisi (kullanıcı var demektir)
        if (error.status === 403) {
          return of({ exists: true, message: 'GSB yetkilisi eklenemez' });
        }
        // Diğer hatalar: Kullanıcı var olabilir, ama başka bir sorun var
        // Bu durumda kullanıcının var olduğunu varsayalım
        return of({ exists: true, message: error.error?.message || 'Kullanıcı kontrol edilemedi' });
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
          console.error('Leave community error:', error);
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
