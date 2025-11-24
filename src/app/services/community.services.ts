import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

// Ortak Veri Modeli
export interface Community {
  id: number;
  name: string;
  university: string;
  category: string;
  description: string;
  coverImage: string;
  logo: string;
  memberCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  // --- ANA VERİ HAVUZU (Backend gelene kadar burası) ---
  private demoData: Community[] = [
    {
      id: 1,
      name: 'ODTÜ Yazılım Topluluğu',
      university: 'Orta Doğu Teknik Üniversitesi',
      category: 'Teknoloji',
      description:
        'Yazılım dünyasındaki yenilikleri takip eden, hackathonlar ve eğitimler düzenleyen aktif topluluk.',
      coverImage:
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/6/62/ODT%C3%9C_logo.jpg',
      memberCount: 450,
    },
    {
      id: 2,
      name: 'İTÜ Robotik Kulübü',
      university: 'İstanbul Teknik Üniversitesi',
      category: 'Mühendislik',
      description:
        'Otonom robotlar, drone teknolojileri ve yapay zeka üzerine projeler geliştiren öğrenci kulübü.',
      coverImage:
        'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/8/87/%C4%B0T%C3%9C_yeni_logo.png',
      memberCount: 320,
    },
    {
      id: 3,
      name: 'Boğaziçi Müzik Kulübü',
      university: 'Boğaziçi Üniversitesi',
      category: 'Sanat',
      description:
        'Kampüsün ritmini tutan, konserler ve müzik atölyeleri düzenleyen sanat topluluğu.',
      coverImage:
        'https://images.unsplash.com/photo-1514320291940-7c281c0ed291?q=80&w=2070&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/e/e2/Bo%C4%9Fazi%C3%A7i_%C3%9Cniversitesi_Logosu.png',
      memberCount: 600,
    },
    {
      id: 4,
      name: 'Yıldız Fotoğrafçılık Kulübü',
      university: 'Yıldız Teknik Üniversitesi',
      category: 'Sanat',
      description:
        'Anı yakalamayı sevenlerin buluşma noktası. Fotoğraf gezileri ve sergiler düzenliyoruz.',
      coverImage:
        'https://images.unsplash.com/photo-1552168324-d612d77725e3?q=80&w=2000&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/0/07/Yildiz_Teknik_Universitesi_Logo.png',
      memberCount: 180,
    },
    {
      id: 5,
      name: 'Hacettepe Girişimcilik',
      university: 'Hacettepe Üniversitesi',
      category: 'Kariyer',
      description:
        'Fikirleri işe dönüştüren, startup ekosistemiyle öğrencileri buluşturan dinamik yapı.',
      coverImage:
        'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2000&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/6/6f/Hacettepe_%C3%9Cniversitesi_Logosu.png',
      memberCount: 240,
    },
    {
      id: 6,
      name: 'Ege Su Altı Topluluğu',
      university: 'Ege Üniversitesi',
      category: 'Spor',
      description:
        'Mavilikleri keşfeden, dalış eğitimleri ve deniz temizliği etkinlikleri yapan spor kulübü.',
      coverImage:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/0/0d/Ege_%C3%9Cniversitesi_logo.png',
      memberCount: 120,
    },
    {
      id: 7,
      name: 'Ankara Üni. Tiyatro',
      university: 'Ankara Üniversitesi',
      category: 'Sanat',
      description:
        'Sahne tozunu yutmak isteyenler için oyunculuk eğitimleri ve sahne performansları.',
      coverImage:
        'https://images.unsplash.com/photo-1507676184212-d03ab07a11d0?q=80&w=2070&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/2/23/Ankara_%C3%9Cniversitesi_Logosu.png',
      memberCount: 200,
    },
    {
      id: 8,
      name: 'Gazi E-Spor',
      university: 'Gazi Üniversitesi',
      category: 'Oyun',
      description:
        'Rekabetçi oyun dünyasında üniversitemizi temsil eden, turnuvalar düzenleyen topluluk.',
      coverImage:
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/1/1a/Gazi_%C3%9Cniversitesi_logo.png',
      memberCount: 550,
    },
    {
      id: 9,
      name: 'Marmara Gastronomi',
      university: 'Marmara Üniversitesi',
      category: 'Yaşam',
      description: 'Lezzet tutkunlarının buluştuğu, tadım etkinlikleri ve workshoplar yapan kulüp.',
      coverImage:
        'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop',
      logo: 'https://upload.wikimedia.org/wikipedia/tr/e/e6/Marmara_%C3%9Cniversitesi_logo.png',
      memberCount: 150,
    },
  ];

  constructor() {}

  /**
   * Tüm toplulukları getirir (Communities Sayfası İçin)
   * Simüle edilmiş bir HTTP isteği gibi Observable döner.
   */
  getAllCommunities(): Observable<Community[]> {
    // Demo amaçlı veriyi çoğaltıyoruz (Sayfalama testi için)
    let extendedData: Community[] = [];
    for (let i = 0; i < 4; i++) {
      const batch = this.demoData.map((item) => ({
        ...item,
        id: item.id + i * 100,
        name: i === 0 ? item.name : `${item.name} (${i + 1})`,
      }));
      extendedData = [...extendedData, ...batch];
    }

    return of(extendedData).pipe(delay(500)); // 0.5sn gecikme
  }

  /**
   * En çok üyesi olan 'n' tane topluluğu getirir (Anasayfa Favoriler İçin)
   * @param limit Gösterilecek topluluk sayısı
   */
  getTopCommunities(limit: number = 9): Observable<Community[]> {
    return of(this.demoData).pipe(
      delay(500),
      map((communities) => {
        // 1. Üye sayısına göre büyükten küçüğe sırala
        const sorted = [...communities].sort((a, b) => b.memberCount - a.memberCount);
        // 2. İstenilen sayı kadarını al
        return sorted.slice(0, limit);
      })
    );
  }
}
