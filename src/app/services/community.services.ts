import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap } from 'rxjs';

// Community Interface
export interface Community {
  id: number;
  name: string;
  university: string;
  category: string;
  description?: string; // Optional yapıldı
  coverImage?: string;
  logo: string;
  memberCount: number;
  city?: string;
  about?: string;
  banner?: string;
  socialMedia?: string; // Eski uyumluluk için
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  email?: string;
  status?: 'Aktif' | 'Pasif' | 'Onay Bekleyen';
  presidentEmail?: string; // Topluluk başkanı email (oluşturma/güncelleme için)
}

// Backend'den gelen format (PascalCase)
interface CommunityDto {
  id: number;
  name?: string;
  Name?: string;
  about?: string;
  About?: string;
  city?: string;
  City?: string;
  university?: string;
  University?: string;
  logoUrl?: string;
  LogoUrl?: string;
  tags?: string[];
  Tags?: string[];
  contactEmail?: string;
  ContactEmail?: string;
  websiteUrl?: string;
  WebsiteUrl?: string;
  socialLinks?: string;
  SocialLinks?: string;
  userCommunities?: any[];
  UserCommunities?: any[];
}

// Backend'e gönderilecek format (PascalCase - Backend DTO formatı)
interface CreateCommunityRequest {
  Name: string;
  About?: string;
  City: string;
  University: string;
  ContactEmail?: string;
  WebsiteUrl?: string;
  SocialLinks?: string;
  LogoUrl?: string;
  Tags?: string[];
  Description?: string;
  BannerUrl?: string;
  LongDescription?: string;
  Status?: string;
  PresidentEmail: string; // Zorunlu: Topluluk başkanının email adresi
}

interface UpdateCommunityRequest {
  Name?: string;
  About?: string;
  City?: string;
  University?: string;
  LogoUrl?: string;
  ContactEmail?: string;
  WebsiteUrl?: string;
  SocialLinks?: string;
  Tags?: string[];
  Description?: string;
  BannerUrl?: string;
  LongDescription?: string;
  Status?: string;
  PresidentEmail?: string; // Başkan değişikliği için (sadece GSB)
}

@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  private apiUrl = '/api/Communities';

  constructor(private http: HttpClient) {}

  // Backend formatını frontend formatına dönüştür
  private mapToCommunity(dto: any): Community {
    const name = dto.name || dto.Name || '';
    const about = dto.about || dto.About || '';
    const city = dto.city || dto.City || '';
    const university = dto.university || dto.University || '';
    const logoUrl = dto.logoUrl || dto.LogoUrl || '';
    const contactEmail = dto.contactEmail || dto.ContactEmail || '';
    const websiteUrl = dto.websiteUrl || dto.WebsiteUrl || '';
    const socialLinks = dto.socialLinks || dto.SocialLinks || '';
    const tags = dto.tags || dto.Tags || [];
    const userCommunities = dto.userCommunities || dto.UserCommunities || [];

    // Tags'den category çıkar (ilk tag'i category olarak kullan)
    const category = tags && tags.length > 0 ? tags[0] : 'Genel';

    // SocialLinks'i parse et (JSON string olabilir)
    let socialMedia = '';
    let instagram = '';
    let youtube = '';
    let twitter = '';
    let tiktok = '';

    if (socialLinks) {
      try {
        const parsed = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
        socialMedia = parsed.instagram || parsed.Instagram || '';
        instagram = parsed.instagram || parsed.Instagram || '';
        youtube = parsed.youtube || parsed.Youtube || '';
        twitter = parsed.twitter || parsed.Twitter || '';
        tiktok = parsed.tiktok || parsed.Tiktok || '';
      } catch {
        // JSON parse edilemezse direkt string olarak kullan
        socialMedia = socialLinks;
      }
    }

    return {
      id: dto.id || dto.Id || 0,
      name: name,
      university: university,
      category: category,
      description: about || dto.description || dto.Description || undefined,
      logo: logoUrl || '',
      memberCount: userCommunities?.length || 0,
      city: city,
      about: about,
      banner: logoUrl, // Backend'de coverImage yok, logoUrl kullan
      coverImage: logoUrl,
      socialMedia: socialMedia,
      instagram: instagram,
      youtube: youtube,
      twitter: twitter,
      tiktok: tiktok,
      website: websiteUrl,
      email: contactEmail,
      status: (dto.status || dto.Status || 'Aktif') as 'Aktif' | 'Pasif' | 'Onay Bekleyen',
    };
  }

  // Mock Veriler - Fallback için (artık kullanılmayacak)
  private mockCommunities: Community[] = [
    {
      id: 1,
      name: 'ODTÜ Yazılım Topluluğu',
      university: 'Orta Doğu Teknik Üniversitesi',
      category: 'Teknoloji',
      description: 'Yazılım dünyasındaki yenilikleri takip eden ve projeler geliştiren topluluk.',
      coverImage:
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 450,
      city: 'Ankara',
    },
    {
      id: 2,
      name: 'İTÜ Girişimcilik Kulübü',
      university: 'İstanbul Teknik Üniversitesi',
      category: 'Girişimcilik',
      description: 'Girişimcilik ekosistemine yeni yetenekler kazandırmayı hedefleyen kulüp.',
      coverImage:
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 1200,
      city: 'İstanbul',
    },
    {
      id: 3,
      name: 'Hacettepe Dans Topluluğu',
      university: 'Hacettepe Üniversitesi',
      category: 'Sanat',
      description: 'Modern ve halk dansları üzerine eğitimler ve gösteriler düzenler.',
      coverImage:
        'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 300,
      city: 'Ankara',
    },
    {
      id: 4,
      name: 'Boğaziçi Müzik Kulübü',
      university: 'Boğaziçi Üniversitesi',
      category: 'Müzik',
      description: 'Kampüsün ritmini tutan, konserler ve atölyeler düzenleyen kulüp.',
      coverImage:
        'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 800,
      city: 'İstanbul',
    },
    {
      id: 5,
      name: 'Ege Üniversitesi Sinema Topluluğu',
      university: 'Ege Üniversitesi',
      category: 'Sanat',
      description: 'Sinema sanatına gönül vermiş öğrencilerin buluşma noktası.',
      coverImage:
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 150,
      city: 'İzmir',
    },
    {
      id: 6,
      name: 'YTÜ Robotik Kulübü',
      university: 'Yıldız Teknik Üniversitesi',
      category: 'Teknoloji',
      description: 'Robotik sistemler ve otomasyon üzerine çalışmalar yapar.',
      coverImage:
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 600,
      city: 'İstanbul',
    },
    {
      id: 7,
      name: 'Gazi Üniversitesi Tiyatro Topluluğu',
      university: 'Gazi Üniversitesi',
      category: 'Sanat',
      description: 'Tiyatro sanatını sevdirmek ve sahne deneyimi kazandırmak için çalışır.',
      coverImage:
        'https://esenler.bel.tr/wp-content/uploads/2021/08/144438347-1600775959586-gfhfghfgh.jpg', // Tiyatro Sahnesi
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 220,
      city: 'Ankara',
    },
    {
      id: 8,
      name: 'Marmara Fotoğrafçılık Kulübü',
      university: 'Marmara Üniversitesi',
      category: 'Sanat',
      description: 'Anı yakalamayı seven fotoğraf tutkunlarının bir araya geldiği kulüp.',
      coverImage:
        'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 340,
      city: 'İstanbul',
    },
    {
      id: 9,
      name: 'Anadolu Üniversitesi Havacılık Kulübü',
      university: 'Anadolu Üniversitesi',
      category: 'Bilim',
      description: 'Gökyüzüne tutkun, havacılık meraklısı öğrencilerin buluşma adresi.',
      coverImage:
        'https://images.unsplash.com/photo-1483304528321-0674f0040030?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 550,
      city: 'Eskişehir',
    },
    {
      id: 10,
      name: 'Akdeniz Üni. Sualtı Sporları',
      university: 'Akdeniz Üniversitesi',
      category: 'Spor',
      description: 'Mavilikleri keşfetmek isteyenler için dalış ve sualtı etkinlikleri.',
      coverImage:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 180,
      city: 'Antalya',
    },
    {
      id: 11,
      name: 'DEÜ Yelken Topluluğu',
      university: 'Dokuz Eylül Üniversitesi',
      category: 'Spor',
      description: 'Rüzgarla dans edenlerin, deniz tutkunlarının bir araya geldiği topluluk.',
      coverImage:
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 210,
      city: 'İzmir',
    },
    {
      id: 12,
      name: 'Bilkent Münazara Topluluğu',
      university: 'Bilkent Üniversitesi',
      category: 'Kültür',
      description: 'Fikirlerin çarpıştığı, retorik ve argümantasyon becerilerinin geliştiği ortam.',
      coverImage:
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 400,
      city: 'Ankara',
    },
    {
      id: 13,
      name: 'Sabancı Veri Bilimi Kulübü',
      university: 'Sabancı Üniversitesi',
      category: 'Teknoloji',
      description: 'Büyük veri, yapay zeka ve makine öğrenmesi üzerine çalışmalar yapar.',
      coverImage:
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 320,
      city: 'İstanbul',
    },
    {
      id: 14,
      name: 'Koç Pazarlama Kulübü',
      university: 'Koç Üniversitesi',
      category: 'İşletme',
      description: 'Pazarlama dünyasının trendlerini takip eden, vaka analizleri yapan kulüp.',
      coverImage:
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 500,
      city: 'İstanbul',
    },
    {
      id: 15,
      name: 'Çukurova E-Spor Topluluğu',
      university: 'Çukurova Üniversitesi',
      category: 'Oyun',
      description: 'Rekabetçi oyun dünyasında üniversitemizi temsil eden oyuncular topluluğu.',
      coverImage:
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 850,
      city: 'Adana',
    },
    {
      id: 16,
      name: 'Erciyes Dağcılık Kulübü',
      university: 'Erciyes Üniversitesi',
      category: 'Spor',
      description: 'Zirvelere tırmanmayı hedefleyen, doğa ile iç içe sporcuların kulübü.',
      coverImage:
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80', // Karlı Dağ
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 190,
      city: 'Kayseri',
    },
    {
      id: 17,
      name: 'KTÜ Mimarlık Kulübü',
      university: 'Karadeniz Teknik Üniversitesi',
      category: 'Tasarım',
      description: 'Mimarlık öğrencileri için atölyeler, geziler ve söyleşiler düzenler.',
      coverImage:
        'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 420,
      city: 'Trabzon',
    },
    {
      id: 18,
      name: 'Uludağ Otomotiv Topluluğu',
      university: 'Uludağ Üniversitesi',
      category: 'Mühendislik',
      description: 'Otomotiv teknolojileri ve alternatif enerjili araçlar üzerine çalışır.',
      coverImage:
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=80',
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 360,
      city: 'Bursa',
    },
    {
      id: 19,
      name: 'Selçuk Arkeoloji Topluluğu',
      university: 'Selçuk Üniversitesi',
      category: 'Tarih',
      description: 'Tarihin izinde, kültürel mirasımızı koruyan ve tanıtan topluluk.',
      coverImage: 'https://www.antiktarih.com/wp-content/uploads/2018/07/indi4-750x445.jpg', // Antik Harabeler
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 140,
      city: 'Konya',
    },
    {
      id: 20,
      name: 'Galatasaray Hukuk Kulübü',
      university: 'Galatasaray Üniversitesi',
      category: 'Hukuk',
      description: 'Hukuk dünyasındaki güncel gelişmeleri takip eden, paneller düzenleyen kulüp.',
      coverImage:
        'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1000&q=80', // Adalet Heykeli
      logo: 'https://i.pinimg.com/474x/07/c4/72/07c4720d19a9e9edad9d0e939eca304a.jpg',
      memberCount: 650,
      city: 'İstanbul',
    },
  ];

  // Tüm Toplulukları Getir
  getAllCommunities(): Observable<Community[]> {
    return this.http.get<CommunityDto[]>(this.apiUrl).pipe(
      map((response) => {
        return response.map((dto) => this.mapToCommunity(dto));
      }),
      catchError((error) => {
        console.error('Topluluklar yüklenemedi:', error);
        // Hata durumunda boş liste döndür
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

  // Topluluk Detayı Getir
  getCommunityById(id: number): Observable<Community> {
    return this.http.get<CommunityDto>(`${this.apiUrl}/${id}`).pipe(
      map((response) => this.mapToCommunity(response)),
      catchError((error) => {
        console.error('Topluluk detayı yüklenemedi:', error);
        throw error;
      })
    );
  }

  private buildSocialLinks(community: any): string | undefined {
    const obj: any = {};
    if (community.instagram) obj.instagram = community.instagram;
    if (community.youtube) obj.youtube = community.youtube;
    if (community.twitter) obj.twitter = community.twitter;
    if (community.tiktok) obj.tiktok = community.tiktok;
    if (community.website) obj.website = community.website;
    if (community.socialMedia) obj.socialMedia = community.socialMedia;

    // Eğer ayrı alanlar yoksa ve socialLinks string geldiyse onu JSON olarak sar
    if (Object.keys(obj).length === 0 && community.socialLinks) {
      try {
        JSON.parse(community.socialLinks);
        return community.socialLinks; // zaten JSON string
      } catch {
        return JSON.stringify({ link: community.socialLinks });
      }
    }

    if (Object.keys(obj).length === 0) return undefined;
    return JSON.stringify(obj);
  }

  // Topluluk Oluştur
  createCommunity(community: {
    name: string;
    about?: string;
    city: string;
    university: string;
    contactEmail?: string;
    websiteUrl?: string;
    socialLinks?: string;
    logoUrl?: string;
    tags?: string[];
    description?: string;
    bannerUrl?: string;
    longDescription?: string;
    status?: string;
    presidentEmail: string; // Zorunlu
  }): Observable<Community> {
    // Backend PascalCase bekliyor
    const socialLinksJson = this.buildSocialLinks(community);
    const request: CreateCommunityRequest = {
      Name: community.name,
      About: community.about,
      City: community.city,
      University: community.university,
      ContactEmail: community.contactEmail,
      WebsiteUrl: community.websiteUrl,
      SocialLinks: socialLinksJson,
      LogoUrl: community.logoUrl,
      Tags: community.tags,
      Description: community.description,
      BannerUrl: community.bannerUrl,
      LongDescription: community.longDescription,
      Status: community.status,
      PresidentEmail: community.presidentEmail,
    };

    return this.http.post<{ id: number; message: string }>(this.apiUrl, request).pipe(
      switchMap((response) => {
        // Oluşturulan topluluğu getir
        return this.getCommunityById(response.id);
      }),
      catchError((error) => {
        console.error('Topluluk oluşturulamadı:', error);
        console.error('Hata detayı:', error.error);
        console.error('Request body:', JSON.stringify(request, null, 2));
        throw error;
      })
    );
  }

  // Topluluk Güncelle
  updateCommunity(
    id: number,
    community: {
      name?: string;
      about?: string;
      city?: string;
      university?: string;
      logoUrl?: string;
      contactEmail?: string;
      websiteUrl?: string;
      socialLinks?: string;
      tags?: string[];
      description?: string;
      bannerUrl?: string;
      longDescription?: string;
      status?: string;
      presidentEmail?: string; // Başkan değişikliği için (sadece GSB)
    }
  ): Observable<Community> {
    // Backend PascalCase bekliyor
    // Boş string'leri null'a çevir (backend null kontrolü yapıyor)
    const socialLinksJson = this.buildSocialLinks(community);
    const request: UpdateCommunityRequest = {
      Name: community.name && community.name.trim() ? community.name.trim() : undefined,
      About: community.about && community.about.trim() ? community.about.trim() : undefined,
      City: community.city && community.city.trim() ? community.city.trim() : undefined,
      University:
        community.university && community.university.trim()
          ? community.university.trim()
          : undefined,
      LogoUrl: community.logoUrl && community.logoUrl.trim() ? community.logoUrl.trim() : undefined,
      ContactEmail:
        community.contactEmail && community.contactEmail.trim()
          ? community.contactEmail.trim()
          : undefined,
      WebsiteUrl:
        community.websiteUrl && community.websiteUrl.trim()
          ? community.websiteUrl.trim()
          : undefined,
      SocialLinks: socialLinksJson,
      Tags: community.tags,
      Description:
        community.description && community.description.trim()
          ? community.description.trim()
          : undefined,
      BannerUrl:
        community.bannerUrl && community.bannerUrl.trim() ? community.bannerUrl.trim() : undefined,
      LongDescription:
        community.longDescription && community.longDescription.trim()
          ? community.longDescription.trim()
          : undefined,
      Status: community.status,
      PresidentEmail:
        community.presidentEmail && community.presidentEmail.trim()
          ? community.presidentEmail.trim()
          : undefined,
    };

    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, request).pipe(
      switchMap(() => {
        // Güncellenen topluluğu getir
        return this.getCommunityById(id);
      }),
      catchError((error) => {
        console.error('Topluluk güncellenemedi:', error);
        console.error('Hata detayı:', error.error);
        console.error('Request body:', JSON.stringify(request, null, 2));
        throw error;
      })
    );
  }

  // Topluluk Sil
  deleteCommunity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Topluluk silinemedi:', error);
        console.error('Hata detayı:', error.error);
        throw error;
      })
    );
  }

  // Corporate dashboard için uyumluluk metodu (eski interface ile çalışır)
  addOrUpdateCommunity(community: Community & { presidentEmail?: string }): Observable<Community> {
    if (community.id && community.id > 0) {
      // Güncelleme
      return this.updateCommunity(community.id, {
        name: community.name,
        about: community.about || community.description,
        city: community.city,
        university: community.university,
        logoUrl: community.logo || community.banner,
        contactEmail: community.email,
        websiteUrl: community.website,
        socialLinks: community.socialMedia,
        description: community.description,
        bannerUrl: community.banner,
        status: community.status,
        presidentEmail: community.presidentEmail,
      });
    } else {
      // Yeni topluluk oluşturma - PresidentEmail zorunlu
      if (!community.presidentEmail) {
        throw new Error('Topluluk başkanı email adresi zorunludur.');
      }
      return this.createCommunity({
        name: community.name,
        about: community.about || community.description,
        city: community.city || '',
        university: community.university,
        contactEmail: community.email,
        websiteUrl: community.website,
        socialLinks: community.socialMedia,
        logoUrl: community.logo,
        description: community.description,
        bannerUrl: community.banner,
        status: community.status,
        presidentEmail: community.presidentEmail,
      });
    }
  }
}
