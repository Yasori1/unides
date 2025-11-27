import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Community Interface
export interface Community {
  id: number;
  name: string;
  university: string;
  category: string;
  description: string;
  coverImage: string;
  logo: string;
  memberCount: number;
  city?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  // Mock Veriler - Sayfalama testi için 20 adete çıkarıldı
  private communities: Community[] = [
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

  constructor() {}

  // Tüm Toplulukları Getir
  getAllCommunities(): Observable<Community[]> {
    return of(this.communities);
  }

  // --- EKLENEN METOT: En Popüler Toplulukları Getir ---
  // limit: Kaç adet topluluk getirileceğini belirler
  getTopCommunities(limit: number): Observable<Community[]> {
    // Üye sayısına göre çoktan aza sırala ve limit kadarını al
    const topCommunities = [...this.communities]
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, limit);
    return of(topCommunities);
  }

  getCommunityById(id: number): Observable<Community | undefined> {
    const community = this.communities.find((c) => c.id === id);
    return of(community);
  }
}
