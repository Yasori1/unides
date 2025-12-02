import { Component, OnInit, HostListener, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ImageUploadComponent } from '../../components/ui/image-upload/image-upload';

// NOT: ToastService ve ToastComponent'i normalde ayrı dosyalardan import edersiniz.
// Burada örnek çalışabilsin diye aynı dosyada tuttum veya import edilmiş varsaydım.

// ==========================================
// MOCK TOAST SERVICE & COMPONENT (Dependencies)
// ==========================================
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private currentTimeout: any = null;

  show(message: string, type: 'success' | 'error' = 'success') {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    const newToast: Toast = { id: Date.now(), message, type };
    this.toastsSubject.next([newToast]);
    this.currentTimeout = setTimeout(() => {
      this.remove(newToast.id);
    }, 3000);
  }

  remove(id: number) {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter((t) => t.id !== id));
  }
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts$ | async"
        class="toast-notification"
        [class.error]="toast.type === 'error'"
      >
        <span class="material-symbols-outlined">{{
          toast.type === 'success' ? 'check_circle' : 'error'
        }}</span>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 3000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .toast-notification {
        background: white;
        padding: 16px 24px;
        border-radius: 14px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        border-left: 5px solid #10b981;
        animation: slideUp 0.3s ease-out;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #0f172a;
      }
      .toast-notification.error {
        border-left-color: #ef4444;
      }
      .toast-notification.error span:first-child {
        color: #ef4444;
      }
      .toast-notification span:first-child {
        color: #10b981;
        font-size: 1.5rem;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class ToastComponent {
  toasts$;
  constructor(public toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }
}

// ==========================================
// MAIN DASHBOARD COMPONENT
// ==========================================

// Interfaces
interface Stat {
  label: string;
  value: any;
  icon: string;
  colorClass: string;
}
interface Community {
  id: number;
  name: string;
  about: string;
  city: string;
  university: string;
  memberCount: number;
  socialMedia: string;
  website: string;
  email: string;
  category: string;
  logo: string;
  banner: string;
  status: 'Aktif' | 'Pasif';
}
interface Announcement {
  id: number;
  title: string;
  shortDescription: string;
  content: string;
  date: string;
  image: string;
  link: string;
}
interface EventRequest {
  id: number;
  communityName: string;
  eventName: string;
  date: string;
  location: string;
  budget: number;
  status: 'Onaylandı' | 'Beklemede' | 'Reddedildi';
}

@Component({
  selector: 'app-corporate-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastComponent, ImageUploadComponent],
  templateUrl: './corporate-dashboard.html',
  styleUrls: ['./corporate-dashboard.scss'],
})
export class CorporateDashboardComponent implements OnInit {
  isSidebarCollapsed = false;
  activeTab = 'overview';
  showNotifications = false;
  isProfileOpen = false;
  isModalOpen = false;
  modalType = '';
  searchText = '';
  statusFilter: string = ''; // Aktif/Pasif filtre

  // Pagination için değişkenler
  currentPage = 1;
  itemsPerPage = 15;
  totalPages = 0;
  pages: number[] = [];
  displayedCommunities: Community[] = [];

  // Topluluk düzenleme için
  selectedCommunity: Community | null = null;
  editingCommunity: Community | null = null;

  // Duyuru düzenleme için
  selectedAnnouncement: Announcement | null = null;
  editingAnnouncement: Announcement | null = null;

  corporateInfo = {
    name: 'İstanbul',
    logo: 'https://ui-avatars.com/api/?name=UNIDES&background=14d2cc&color=fff&size=128',
    email: 'admin@unides.com',
    username: 'unides_admin',
  };

  stats: Stat[] = [
    { label: 'Toplam Topluluk', value: 42, icon: 'groups', colorClass: 'blue' },
    { label: 'Aktif Etkinlik', value: 12, icon: 'event', colorClass: 'green' },
    { label: 'Bekleyen İstek', value: 5, icon: 'pending_actions', colorClass: 'orange' },
  ];

  // Kategori listesi
  categories: string[] = [
    'Teknoloji',
    'Sanat',
    'Spor',
    'Kariyer',
    'Kültür',
    'Bilim',
    'Sosyal',
    'Müzik',
  ];

  allCommunities: Community[] = [
    {
      id: 1,
      name: 'AI & Data Club',
      about:
        'Yapay zeka ve veri bilimi alanında çalışmalar yapan, workshop ve etkinlikler düzenleyen teknoloji topluluğu.',
      city: 'İstanbul',
      university: 'İstanbul Teknik Üniversitesi',
      memberCount: 156,
      socialMedia: 'https://instagram.com/aidataclub',
      website: 'https://aidataclub.com',
      email: 'ai.dataclub@unides.com',
      category: 'Teknoloji',
      logo: 'https://ui-avatars.com/api/?name=AI&background=0f172a&color=fff',
      banner: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
      status: 'Aktif',
    },
    {
      id: 2,
      name: 'Dans Topluluğu',
      about:
        'Modern dans, salsa, hip-hop ve geleneksel danslar üzerine eğitimler veren sanat topluluğu.',
      city: 'Ankara',
      university: 'Hacettepe Üniversitesi',
      memberCount: 89,
      socialMedia: 'https://instagram.com/danstoplulugu',
      website: '',
      email: 'dans@unides.com',
      category: 'Sanat',
      logo: 'https://ui-avatars.com/api/?name=DT&background=f43f5e&color=fff',
      banner: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800',
      status: 'Aktif',
    },
    {
      id: 3,
      name: 'Girişimcilik Kulübü',
      about:
        'Startup ekosistemi, yatırım süreçleri ve girişimcilik üzerine etkinlikler düzenleyen kariyer odaklı topluluk.',
      city: 'İzmir',
      university: 'Ege Üniversitesi',
      memberCount: 210,
      socialMedia: 'https://linkedin.com/company/girisimcilik',
      website: 'https://girisimcilik.org',
      email: 'girisimcilik@unides.com',
      category: 'Kariyer',
      logo: 'https://ui-avatars.com/api/?name=GK&background=3b82f6&color=fff',
      banner: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
      status: 'Aktif',
    },
    {
      id: 4,
      name: 'E-Spor Topluluğu',
      about:
        'Profesyonel e-spor turnuvaları düzenleyen ve oyuncular yetiştiren rekabetçi oyun topluluğu.',
      city: 'Bursa',
      university: 'Uludağ Üniversitesi',
      memberCount: 340,
      socialMedia: 'https://twitter.com/espor_toplulugu',
      website: 'https://espor.gg',
      email: 'espor@unides.com',
      category: 'Spor',
      logo: 'https://ui-avatars.com/api/?name=ES&background=eab308&color=fff',
      banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      status: 'Pasif',
    },
    {
      id: 5,
      name: 'Fotoğrafçılık Kulübü',
      about:
        'Fotoğrafçılık teknikleri, düzenleme ve kompozisyon üzerine eğitimler veren sanat topluluğu.',
      city: 'İstanbul',
      university: 'Mimar Sinan Güzel Sanatlar Üniversitesi',
      memberCount: 125,
      socialMedia: 'https://instagram.com/fotokulup',
      website: '',
      email: 'foto@unides.com',
      category: 'Sanat',
      logo: 'https://ui-avatars.com/api/?name=FK&background=10b981&color=fff',
      banner: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800',
      status: 'Aktif',
    },
    {
      id: 6,
      name: 'Müzik Topluluğu',
      about: 'Enstrüman eğitimi, konserler ve müzik teorisi üzerine çalışmalar yapan topluluk.',
      city: 'Ankara',
      university: 'Bilkent Üniversitesi',
      memberCount: 98,
      socialMedia: 'https://instagram.com/muziktoplulugu',
      website: 'https://muzik.bilkent.edu.tr',
      email: 'muzik@unides.com',
      category: 'Müzik',
      logo: 'https://ui-avatars.com/api/?name=MT&background=8b5cf6&color=fff',
      banner: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
      status: 'Aktif',
    },
    {
      id: 7,
      name: 'Tiyatro Kulübü',
      about:
        'Sahne sanatları, oyunculuk ve tiyatro prodüksiyonu üzerine çalışmalar yapan sanat topluluğu.',
      city: 'İzmir',
      university: 'Dokuz Eylül Üniversitesi',
      memberCount: 67,
      socialMedia: 'https://instagram.com/tiyatrokulup',
      website: '',
      email: 'tiyatro@unides.com',
      category: 'Sanat',
      logo: 'https://ui-avatars.com/api/?name=TK&background=ec4899&color=fff',
      banner: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800',
      status: 'Aktif',
    },
    {
      id: 8,
      name: 'Yazılım Geliştirme',
      about:
        'Web, mobil ve masaüstü uygulama geliştirme üzerine eğitimler ve hackathonlar düzenleyen teknoloji topluluğu.',
      city: 'Antalya',
      university: 'Akdeniz Üniversitesi',
      memberCount: 234,
      socialMedia: 'https://github.com/yazilimdev',
      website: 'https://yazilimdev.org',
      email: 'yazilim@unides.com',
      category: 'Teknoloji',
      logo: 'https://ui-avatars.com/api/?name=YG&background=06b6d4&color=fff',
      banner: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      status: 'Aktif',
    },
    {
      id: 9,
      name: 'Robotik Kulübü',
      about:
        'Robot tasarımı, otomasyon ve mekatronik sistemler üzerine projeler geliştiren teknoloji topluluğu.',
      city: 'Eskişehir',
      university: 'Anadolu Üniversitesi',
      memberCount: 145,
      socialMedia: 'https://instagram.com/robotikkulup',
      website: 'https://robotik.anadolu.edu.tr',
      email: 'robotik@unides.com',
      category: 'Teknoloji',
      logo: 'https://ui-avatars.com/api/?name=RK&background=f97316&color=fff',
      banner: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
      status: 'Pasif',
    },
    {
      id: 10,
      name: 'Doğa Sporları',
      about: 'Dağcılık, kamp, trekking ve outdoor aktiviteler düzenleyen spor topluluğu.',
      city: 'Trabzon',
      university: 'Karadeniz Teknik Üniversitesi',
      memberCount: 78,
      socialMedia: 'https://instagram.com/dogasporlari',
      website: '',
      email: 'dogasporlari@unides.com',
      category: 'Spor',
      logo: 'https://ui-avatars.com/api/?name=DS&background=22c55e&color=fff',
      banner: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
      status: 'Aktif',
    },
    {
      id: 11,
      name: 'Satranç Kulübü',
      about:
        'Satranç turnuvaları, eğitimler ve strateji oyunları üzerine çalışmalar yapan topluluk.',
      city: 'Konya',
      university: 'Selçuk Üniversitesi',
      memberCount: 56,
      socialMedia: 'https://instagram.com/satranckulup',
      website: '',
      email: 'satranc@unides.com',
      category: 'Spor',
      logo: 'https://ui-avatars.com/api/?name=SK&background=64748b&color=fff',
      banner: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800',
      status: 'Aktif',
    },
    {
      id: 12,
      name: 'Edebiyat Topluluğu',
      about:
        'Şiir, roman ve edebiyat eleştirisi üzerine söyleşiler ve okuma grupları düzenleyen kültür topluluğu.',
      city: 'Samsun',
      university: 'Ondokuz Mayıs Üniversitesi',
      memberCount: 43,
      socialMedia: 'https://instagram.com/edebiyattoplulugu',
      website: '',
      email: 'edebiyat@unides.com',
      category: 'Kültür',
      logo: 'https://ui-avatars.com/api/?name=ET&background=a855f7&color=fff',
      banner: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
      status: 'Aktif',
    },
    {
      id: 13,
      name: 'Sinema Kulübü',
      about:
        'Film gösterimleri, yönetmen söyleşileri ve sinema tarihi üzerine etkinlikler düzenleyen sanat topluluğu.',
      city: 'İstanbul',
      university: 'İstanbul Üniversitesi',
      memberCount: 112,
      socialMedia: 'https://instagram.com/sinemakulup',
      website: 'https://sinemakulup.ist',
      email: 'sinema@unides.com',
      category: 'Sanat',
      logo: 'https://ui-avatars.com/api/?name=SN&background=ef4444&color=fff',
      banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
      status: 'Aktif',
    },
    {
      id: 14,
      name: 'Astronomi Kulübü',
      about: 'Gök gözlemi, uzay bilimleri ve astrofizik üzerine çalışmalar yapan bilim topluluğu.',
      city: 'Ankara',
      university: 'ODTÜ',
      memberCount: 89,
      socialMedia: 'https://twitter.com/astronomikulup',
      website: 'https://astronomi.odtu.edu.tr',
      email: 'astronomi@unides.com',
      category: 'Bilim',
      logo: 'https://ui-avatars.com/api/?name=AK&background=1e3a8a&color=fff',
      banner: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
      status: 'Pasif',
    },
    {
      id: 15,
      name: 'Aşçılık Kulübü',
      about:
        'Mutfak sanatları, yemek kültürü ve gastronomi üzerine atölyeler düzenleyen sosyal topluluk.',
      city: 'Gaziantep',
      university: 'Gaziantep Üniversitesi',
      memberCount: 67,
      socialMedia: 'https://instagram.com/ascilikkulup',
      website: '',
      email: 'ascilik@unides.com',
      category: 'Sosyal',
      logo: 'https://ui-avatars.com/api/?name=AC&background=dc2626&color=fff',
      banner: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      status: 'Aktif',
    },
    {
      id: 16,
      name: 'Yoga & Meditasyon',
      about:
        'Yoga, meditasyon ve mindfulness üzerine seanslar ve workshoplar düzenleyen sağlık topluluğu.',
      city: 'Muğla',
      university: 'Muğla Sıtkı Koçman Üniversitesi',
      memberCount: 54,
      socialMedia: 'https://instagram.com/yogameditasyon',
      website: '',
      email: 'yoga@unides.com',
      category: 'Spor',
      logo: 'https://ui-avatars.com/api/?name=YM&background=14b8a6&color=fff',
      banner: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      status: 'Aktif',
    },
    {
      id: 17,
      name: 'Çevre Kulübü',
      about:
        'Çevre koruma, sürdürülebilirlik ve ekoloji üzerine projeler geliştiren sosyal sorumluluk topluluğu.',
      city: 'Kayseri',
      university: 'Erciyes Üniversitesi',
      memberCount: 98,
      socialMedia: 'https://instagram.com/cevrekulup',
      website: 'https://cevrekulup.org',
      email: 'cevre@unides.com',
      category: 'Sosyal',
      logo: 'https://ui-avatars.com/api/?name=CK&background=16a34a&color=fff',
      banner: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
      status: 'Aktif',
    },
    {
      id: 18,
      name: 'Bisiklet Topluluğu',
      about:
        'Bisiklet turları, bakım eğitimleri ve şehir içi bisiklet kültürü üzerine etkinlikler düzenleyen spor topluluğu.',
      city: 'Mersin',
      university: 'Mersin Üniversitesi',
      memberCount: 76,
      socialMedia: 'https://instagram.com/bisiklettoplulugu',
      website: '',
      email: 'bisiklet@unides.com',
      category: 'Spor',
      logo: 'https://ui-avatars.com/api/?name=BT&background=eab308&color=fff',
      banner: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800',
      status: 'Aktif',
    },
  ];

  communities: Community[] = [];
  filteredCommunities: Community[] = [];

  announcements: Announcement[] = [
    {
      id: 1,
      title: 'ÜNİDES 6. Dönem Başvuruları Başladı!',
      shortDescription:
        'Gençlik Hizmetleri Genel Müdürlüğü tarafından yürütülen Üniversite Öğrenci Toplulukları İş Birliği ve Destek Programı (ÜNİDES) başvuruları başladı.',
      content: `Gençlik Hizmetleri Genel Müdürlüğü tarafından yürütülen Üniversite Öğrenci Toplulukları İş Birliği ve Destek Programı (ÜNİDES), gençlerin üniversite toplulukları aracılığıyla gelişimlerini desteklemek, genç ofislerle üniversite öğrenci kulüpleri arasındaki etkileşimi güçlendirmek ve gençlere yönelik faaliyetlerin niteliğini artırmak amacıyla hayata geçiriliyor.

Türkiye genelinde üniversiteler tarafından onaylanan öğrenci kulüplerinin yararlanabildiği program kapsamında, bugüne kadar gerçekleştirilen 5 dönemde toplam 81 ilden 9043 başvuru alınırken, değerlendirmeler sonucunda 4444 proje desteklenerek hibeler topluluklara aktarıldı. Desteklenen kulüplerin toplam üye sayısı ise 1 milyon 155 bini geçerek rekor bir sayıya ulaştı.

6. Dönem başvuruları 2 Aralık 2025 – 11 Şubat 2026 tarihleri arasında alınacak.`,
      date: '2 Aralık 2025',
      image: '',
      link: 'https://gsb.gov.tr/unides',
    },
    {
      id: 2,
      title: 'KAMP+ Siber Güvenlik Kampı Başvuruları Başladı',
      shortDescription:
        'Gençlik Hizmetleri Genel Müdürlüğü tarafından, kurumların çalışma alanlarına ilişkin uzmanlıklarını genç gruplara aktarmalarını amaçlayan KAMP+ konseptiyle yeni bir program.',
      content: `Gençlik Hizmetleri Genel Müdürlüğü tarafından, kurumların çalışma alanlarına ilişkin uzmanlıklarını genç gruplara aktarmalarını amaçlayan KAMP+ konseptiyle yeni bir program hayata geçirildi.

KAMP+ Siber Güvenlik Kampı, gençlerin dijital dünyada kendilerini korumalarını sağlamak ve siber güvenlik alanında farkındalık oluşturmak amacıyla düzenleniyor.

Kamp süresince katılımcılar:
- Temel siber güvenlik kavramları
- Etik hacking temelleri
- Ağ güvenliği
- Zararlı yazılım analizi
- Sosyal mühendislik saldırıları

konularında eğitim alacaklardır.

Son başvuru tarihi: 15 Aralık 2025`,
      date: '1 Aralık 2025',
      image: '',
      link: 'https://gsb.gov.tr/kamp-plus',
    },
    {
      id: 3,
      title: 'ÜNİDES Kapsayıcılık Ve Sosyal Katılım Kampı Başvuru Sonuçları Açıklandı',
      shortDescription:
        'Gençlik Hizmetleri Genel Müdürlüğü tarafından yürütülen ÜNİDES kapsamında, engelli bireylere yönelik faaliyetler için başvuru sonuçları açıklandı.',
      content: `Gençlik Hizmetleri Genel Müdürlüğü tarafından yürütülen Üniversite Öğrenci Toplulukları İş Birliği ve Destek Programı (ÜNİDES) kapsamında, engelli bireylere yönelik faaliyetleri desteklemek amacıyla düzenlenen Kapsayıcılık ve Sosyal Katılım Kampı başvuru sonuçları açıklandı.

Özel gereksinimli gruplara yönelik çalışan üniversite toplulukları bu kampta buluşuyor.

Kabul edilen topluluklar e-posta yoluyla bilgilendirilecektir.

Kamp tarihi: 15-20 Ocak 2026
Kamp yeri: Antalya Gençlik Kampı`,
      date: '27 Kasım 2025',
      image: '',
      link: 'https://gsb.gov.tr/kapsayicilik-kampi',
    },
    {
      id: 4,
      title: 'Yeni Sponsorluk Yönetmeliği Taslağı',
      shortDescription:
        'Toplulukların sponsor desteği alması ile ilgili yeni düzenlemeler hazırlanmaktadır.',
      content: `Üniversite öğrenci topluluklarının sponsor desteği alması konusunda yeni düzenlemeler hazırlanmaktadır.

Taslak yönetmelik şu konuları kapsamaktadır:
- Sponsor kabul kriterleri
- Sponsorluk sözleşme şartları
- Logo kullanım hakları
- Mali raporlama yükümlülükleri
- Etik kurallar

Görüş ve önerilerinizi 15 Aralık 2025 tarihine kadar iletebilirsiniz.`,
      date: '20 Kasım 2025',
      image: '',
      link: '',
    },
  ];

  newAnnouncement: Partial<Announcement> = {
    title: '',
    shortDescription: '',
    content: '',
    image: '',
    link: '',
  };

  allEvents: EventRequest[] = [
    {
      id: 1,
      communityName: 'AI Club',
      eventName: 'Yapay Zeka Zirvesi',
      date: '12 Kasım 2023',
      location: 'Konferans Salonu A',
      budget: 15000,
      status: 'Beklemede',
    },
    {
      id: 2,
      communityName: 'Dans Topluluğu',
      eventName: 'Yıl Sonu Gösterisi',
      date: '15 Kasım 2023',
      location: 'Kültür Merkezi',
      budget: 5000,
      status: 'Onaylandı',
    },
    {
      id: 3,
      communityName: 'Girişimcilik',
      eventName: 'Startup Weekend',
      date: '20 Kasım 2023',
      location: 'İnovasyon Merkezi',
      budget: 25000,
      status: 'Reddedildi',
    },
    {
      id: 4,
      communityName: 'Gezi Kulübü',
      eventName: 'Uludağ Kampı',
      date: '25 Kasım 2023',
      location: 'Uludağ',
      budget: 45000,
      status: 'Beklemede',
    },
  ];

  notifications = [
    { text: 'E-Spor topluluğu onay bekliyor', time: '10 dk önce' },
    { text: 'AI Zirvesi bütçe onayı istiyor', time: '1 saat önce' },
  ];

  // Router servisini inject ediyoruz
  constructor(private toastService: ToastService, private router: Router) {}

  ngOnInit() {
    this.communities = [...this.allCommunities];
    this.filteredCommunities = [...this.communities];
    this.initPagination();
  }

  // Pagination metodları
  initPagination() {
    this.totalPages = Math.ceil(this.filteredCommunities.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedCommunities = this.filteredCommunities.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedData();
    }
  }

  // Arama ve filtreleme
  applyFilters() {
    let temp = [...this.communities];

    // Metin araması
    if (this.searchText.trim()) {
      const term = this.searchText.toLowerCase();
      temp = temp.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.city.toLowerCase().includes(term) ||
          c.university.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term)
      );
    }

    // Durum filtresi
    if (this.statusFilter) {
      temp = temp.filter((c) => c.status === this.statusFilter);
    }

    this.filteredCommunities = temp;
    this.currentPage = 1;
    this.initPagination();
  }

  // Topluluk detay ve güncelleme
  openCommunityDetail(community: Community) {
    this.selectedCommunity = community;
    this.editingCommunity = { ...community };
    this.modalType = 'edit-community';
    this.isModalOpen = true;
  }

  saveCommunity() {
    if (this.editingCommunity) {
      const index = this.communities.findIndex((c) => c.id === this.editingCommunity!.id);
      if (index !== -1) {
        this.communities[index] = { ...this.editingCommunity };
        this.applyFilters();
        this.showToast('Topluluk başarıyla güncellendi', 'success');
        this.closeModal();
      }
    }
  }

  deleteCommunity() {
    if (this.editingCommunity) {
      const index = this.communities.findIndex((c) => c.id === this.editingCommunity!.id);
      if (index !== -1) {
        this.communities.splice(index, 1);
        this.applyFilters();
        this.showToast('Topluluk başarıyla silindi', 'success');
        this.closeModal();
      }
    }
  }

  // Image upload handlers
  onLogoSelected(imageUrl: string) {
    if (this.editingCommunity) {
      this.editingCommunity.logo = imageUrl;
    }
  }

  onBannerSelected(imageUrl: string) {
    if (this.editingCommunity) {
      this.editingCommunity.banner = imageUrl;
    }
  }

  toggleCommunityStatus() {
    if (this.editingCommunity) {
      this.editingCommunity.status = this.editingCommunity.status === 'Aktif' ? 'Pasif' : 'Aktif';
    }
  }

  get pendingEvents() {
    return this.allEvents.filter((e) => e.status === 'Beklemede');
  }
  get pendingEventCount() {
    return this.pendingEvents.length;
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  switchTab(tab: string) {
    this.activeTab = tab;
    this.isSidebarCollapsed = window.innerWidth < 768 ? true : this.isSidebarCollapsed;
  }
  toggleNotifications(e: Event) {
    e.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.isProfileOpen = false;
  }
  toggleProfileDropdown(e: Event) {
    e.stopPropagation();
    this.isProfileOpen = !this.isProfileOpen;
    this.showNotifications = false;
  }

  @HostListener('document:click')
  closeDropdowns() {
    this.showNotifications = false;
    this.isProfileOpen = false;
  }

  logout() {
    this.showToast('Çıkış yapılıyor...', 'success');
    // Toast mesajının okunması için 1.5 saniye bekleyip anasayfaya yönlendiriyoruz
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 1500);
  }

  approveEvent(id: number) {
    const event = this.allEvents.find((e) => e.id === id);
    if (event) {
      event.status = 'Onaylandı';
      this.showToast('Etkinlik onaylandı', 'success');
    }
  }

  rejectEvent(id: number) {
    const event = this.allEvents.find((e) => e.id === id);
    if (event) {
      event.status = 'Reddedildi';
      this.showToast('Etkinlik reddedildi', 'error');
    }
  }

  openModal(type: string) {
    this.modalType = type;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingAnnouncement = null;
    this.selectedAnnouncement = null;
  }

  // Duyuru detay ve güncelleme
  openAnnouncementDetail(announcement: Announcement) {
    this.selectedAnnouncement = announcement;
    this.editingAnnouncement = { ...announcement };
    this.modalType = 'edit-announcement';
    this.isModalOpen = true;
  }

  saveAnnouncement() {
    if (!this.newAnnouncement.title) return;

    const today = new Date();
    const dateStr = today.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    this.announcements.unshift({
      id: Date.now(),
      title: this.newAnnouncement.title || '',
      shortDescription: this.newAnnouncement.shortDescription || '',
      content: this.newAnnouncement.content || '',
      date: dateStr,
      image: this.newAnnouncement.image || '',
      link: this.newAnnouncement.link || '',
    });

    this.newAnnouncement = {
      title: '',
      shortDescription: '',
      content: '',
      image: '',
      link: '',
    };
    this.closeModal();
    this.showToast('Duyuru yayınlandı', 'success');
  }

  updateAnnouncement() {
    if (this.editingAnnouncement) {
      const index = this.announcements.findIndex((a) => a.id === this.editingAnnouncement!.id);
      if (index !== -1) {
        this.announcements[index] = { ...this.editingAnnouncement };
        this.showToast('Duyuru başarıyla güncellendi', 'success');
        this.closeModal();
      }
    }
  }

  deleteAnnouncement() {
    if (this.editingAnnouncement) {
      const index = this.announcements.findIndex((a) => a.id === this.editingAnnouncement!.id);
      if (index !== -1) {
        this.announcements.splice(index, 1);
        this.showToast('Duyuru başarıyla silindi', 'success');
        this.closeModal();
      }
    }
  }

  onAnnouncementImageSelected(imageUrl: string) {
    if (this.editingAnnouncement) {
      this.editingAnnouncement.image = imageUrl;
    }
  }

  onNewAnnouncementImageSelected(imageUrl: string) {
    this.newAnnouncement.image = imageUrl;
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.toastService.show(msg, type);
  }

  getTabTitle() {
    switch (this.activeTab) {
      case 'overview':
        return 'Genel Bakış';
      case 'communities':
        return 'Topluluk Yönetimi';
      case 'events':
        return 'Etkinlik Takvimi';
      case 'announcements':
        return 'Duyurular';
      // Mesajlar case'i silindi
      case 'settings':
        return 'Ayarlar';
      default:
        return '';
    }
  }
}
