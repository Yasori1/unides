import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';
import { EventService, EventItem } from '../../services/event.services';

@Component({
  selector: 'app-events-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './events-detail.component.html',
  styleUrls: ['./events-detail.component.scss'],
})
export class EventsDetailComponent implements OnInit {
  event: any = null;
  isLoading = true;
  heroMoveX = 0;
  heroMoveY = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        if (isPlatformBrowser(this.platformId)) {
             window.scrollTo(0, 0); // Scroll to top on navigation
        }
        this.fetchEventDetail(+id);
      } else {
          this.router.navigate(['/events']);
      }
    });
  }

  fetchEventDetail(id: number) {
    this.isLoading = true;
    this.eventService.getAll().subscribe({
        next: (events) => {
            const found = events.find(e => e.id === id);
            if (found) {
                this.event = this.mapToCard(found);
                this.isLoading = false;
            } else {
                const mockEvent = this.getMockEventById(id);
                if (mockEvent) {
                    this.event = mockEvent;
                     // Ensure dateObj is a Date object if coming from mock
                    if (typeof this.event.dateObj === 'string') {
                        this.event.dateObj = new Date(this.event.dateObj);
                    }
                }
                this.isLoading = false;
            }
        },
        error: () => {
             const mockEvent = this.getMockEventById(id);
                if (mockEvent) {
                    this.event = mockEvent;
                     // Ensure dateObj is a Date object if coming from mock
                    if (typeof this.event.dateObj === 'string') {
                        this.event.dateObj = new Date(this.event.dateObj);
                    }
                }
            this.isLoading = false;
        }
    })
  }

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }

  getMonthName(date: Date): string {
      if (!date) return '';
      return date.toLocaleDateString('tr-TR', { month: 'short' });
  }

  // Helper to get mock data (copied from EventsComponent for consistency)
  getMockEventById(id: number) {
      const baseEvents = [
        {
          id: 101,
          title: 'Geleceğin Teknolojileri ve Yapay Zeka Zirvesi',
          description: 'Yapay zeka, blok zincir ve geleceğin teknolojilerinin tartışılacağı dev bir zirveye hazır olun. Sektörün öncüleri ile tanışma fırsatı. Yapay zeka, blok zincir ve geleceğin teknolojilerinin tartışılacağı dev bir zirveye hazır olun. Sektörün öncüleri ile tanışma fırsatı.Yapay zeka, blok zincir ve geleceğin teknolojilerinin tartışılacağı dev bir zirveye hazır olun. Sektörün öncüleri ile tanışma fırsatı.',
          category: 'Teknoloji',
          date: '25 Ekim 2025',
          dateObj: new Date('2025-10-25'),
          time: '10:00',
          location: 'İTÜ Süleyman Demirel Kültür Merkezi',
          university: 'İstanbul Teknik Üniversitesi',
          club: 'Yapay Zeka Kulübü',
          semester: 'Teknoloji Topluluğu',
          quota: 500,
          imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop',
          color: '#2563eb',
          city: 'İstanbul'
        },
        {
          id: 102,
          title: 'Kampüs Caz Festivali',
          description: 'Sonbaharın renkleri cazın büyüleyici ritimleriyle buluşuyor. Açık hava konserleri ve workshoplar sizi bekliyor.',
          category: 'Müzik',
          date: '15 Kasım 2025',
          dateObj: new Date('2025-11-15'),
          time: '18:30',
          location: 'ODTÜ Vişnelik',
          university: 'Orta Doğu Teknik Üniversitesi',
          club: 'Müzik Topluluğu',
          semester: 'Sanat Topluluğu',
          quota: 1200,
          imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800&auto=format&fit=crop',
          color: '#9333ea',
          city: 'Ankara'
        },
        {
          id: 103,
          title: 'Modern Sanat ve Tasarım Bienali',
          description: 'Genç sanatçıların eserlerinin sergileneceği, interaktif enstalasyonların yer aldığı sanat dolu bir hafta.',
          category: 'Sanat',
          date: '01 Aralık 2025',
          dateObj: new Date('2025-12-01'),
          time: '09:00',
          location: 'Mimar Sinan GSÜ',
          university: 'Mimar Sinan Güzel Sanatlar Üniversitesi',
          club: 'Güzel Sanatlar Kulübü',
          semester: 'Kültür Topluluğu',
          quota: 300,
          imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFBbo43qexwVoJjVSXp85WZuIEqVlu-_j0Yw&s',
          color: '#db2777',
          city: 'İstanbul'
        },
        {
          id: 104,
          title: 'Kariyer ve Networking Günleri',
          description: 'Türkiye\'nin önde gelen firmalarının İK yöneticileri ile birebir görüşme şansı. Staj ve iş imkanlarını kaçırmayın.',
          category: 'Kariyer',
          date: '20 Eylül 2025',
          dateObj: new Date('2025-09-20'),
          time: '11:00',
          location: 'YTÜ Davutpaşa Kampüsü',
          university: 'Yıldız Teknik Üniversitesi',
          club: 'İşletme Kulübü',
          semester: 'Kariyer Topluluğu',
          quota: 800,
          imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop',
          color: '#ea580c',
          city: 'İstanbul'
        },
        {
          id: 105,
          title: 'Doğa Yürüyüşü ve Kamp',
          description: 'Şehrin gürültüsünden uzaklaşıp doğayla iç içe bir hafta sonu. Çadırını kap gel!',
          category: 'Spor',
          date: '05 Ekim 2025',
          dateObj: new Date('2025-10-05'),
          time: '07:00',
          location: 'Uludağ Milli Parkı',
          university: 'Bursa Uludağ Üniversitesi',
          club: 'Doğa Sporları Kulübü',
          semester: 'Spor Topluluğu',
          quota: 100,
          imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop',
          color: '#16a34a',
          city: 'Bursa'
        },
        {
          id: 106,
          title: 'Siber Güvenlik Bootcamp',
          description: 'Uygulamalı laboratuvarlarla siber güvenliğin temellerini öğren. CTF mini yarışması da var.',
          category: 'Teknoloji',
          date: '10 Ocak 2026',
          dateObj: new Date('2026-01-10'),
          time: '13:00',
          location: 'Teknopark Eğitim Salonu',
          university: 'İstanbul Teknik Üniversitesi',
          club: 'Siber Güvenlik Kulübü',
          semester: 'Teknoloji Topluluğu',
          quota: 200,
          imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
          color: '#2563eb',
          city: 'İstanbul'
        },
        {
          id: 107,
          title: 'Fotoğrafçılık Şehir Turu',
          description: 'Şehir turunda sokak fotoğrafçılığı teknikleri, kompozisyon ve ışık kullanımı üzerine pratik.',
          category: 'Sanat',
          date: '18 Ocak 2026',
          dateObj: new Date('2026-01-18'),
          time: '09:30',
          location: 'Merkez Kampüs Buluşma Noktası',
          university: 'Marmara Üniversitesi',
          club: 'Fotoğrafçılık Kulübü',
          semester: 'Kültür Topluluğu',
          quota: 80,
          imageUrl: 'https://images.unsplash.com/photo-1552168324-d612d77725e3?q=80&w=800&auto=format&fit=crop',
          color: '#db2777',
          city: 'İstanbul'
        },
        {
          id: 108,
          title: 'Kariyer CV Atölyesi',
          description: 'CV ve LinkedIn profilini güçlendirmek için uygulamalı atölye. Örnek mülakat simülasyonu da yapılacak.',
          category: 'Kariyer',
          date: '28 Ocak 2026',
          dateObj: new Date('2026-01-28'),
          time: '16:00',
          location: 'Konferans Salonu',
          university: 'Orta Doğu Teknik Üniversitesi',
          club: 'Kariyer Kulübü',
          semester: 'Kariyer Topluluğu',
          quota: 300,
          imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=800&auto=format&fit=crop',
          color: '#ea580c',
          city: 'Ankara'
        },
        {
          id: 109,
          title: 'Veri Bilimi ve R Atölyesi',
          description: 'Veri analizine giriş yapmak isteyenler için kapsamlı bir atölye. R dili ile uygulama yapılacak.',
          category: 'Teknoloji',
          date: '05 Şubat 2026',
          dateObj: new Date('2026-02-05'),
          time: '14:00',
          location: 'Bilkent Kütüphane',
          university: 'Bilkent Üniversitesi',
          club: 'Veri Bilimi Topluluğu',
          semester: 'Teknoloji Topluluğu',
          quota: 50,
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
          color: '#2563eb',
          city: 'Ankara'
        },
        {
          id: 110,
          title: 'Klasik Müzik Akşamı',
          description: 'Üniversite orkestrasından unutulmaz bir klasik müzik dinletisi.',
          category: 'Müzik',
          date: '12 Şubat 2026',
          dateObj: new Date('2026-02-12'),
          time: '19:30',
          location: 'AKM Büyük Salon',
          university: 'İstanbul Üniversitesi',
          club: 'Müzik Kulübü',
          semester: 'Sanat Topluluğu',
          quota: 400,
          imageUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384ebd?q=80&w=800&auto=format&fit=crop',
          color: '#9333ea',
          city: 'İstanbul'
        },
        {
          id: 111,
          title: 'Modern Dans Gösterisi',
          description: 'Dans topluluğunun hazırladığı modern dans koreografileri sahneleniyor.',
          category: 'Sanat',
          date: '20 Şubat 2026',
          dateObj: new Date('2026-02-20'),
          time: '18:00',
          location: 'Ege Üniversitesi Kültür Merkezi',
          university: 'Ege Üniversitesi',
          club: 'Dans Topluluğu',
          semester: 'Sanat Topluluğu',
          quota: 350,
          imageUrl: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?q=80&w=800&auto=format&fit=crop',
          color: '#db2777',
          city: 'İzmir'
        },
        {
          id: 112,
          title: 'Startup Pitching Day',
          description: 'Girişim fikirlerini yatırımcılara sunmak isteyen öğrenciler için büyük fırsat.',
          category: 'Kariyer',
          date: '25 Şubat 2026',
          dateObj: new Date('2026-02-25'),
          time: '10:00',
          location: 'Kolektif House',
          university: 'Boğaziçi Üniversitesi',
          club: 'Girişimcilik Kulübü',
          semester: 'Kariyer Topluluğu',
          quota: 150,
          imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop',
          color: '#ea580c',
          city: 'İstanbul'
        },
        {
          id: 113,
          title: 'Kampüs Koşusu',
          description: 'Sağlıklı yaşam için kampüste 5K koşusu düzenliyoruz. Herkes davetli!',
          category: 'Spor',
          date: '01 Mart 2026',
          dateObj: new Date('2026-03-01'),
          time: '08:00',
          location: 'Anadolu Üniversitesi Stadyumu',
          university: 'Anadolu Üniversitesi',
          club: 'Spor Kulübü',
          semester: 'Spor Topluluğu',
          quota: 1000,
          imageUrl: 'https://images.unsplash.com/photo-1552674605-469523cc7043?q=80&w=800&auto=format&fit=crop',
          color: '#16a34a',
          city: 'Eskişehir'
        },
        {
          id: 114,
          title: 'Ege Köyleri Gezisi',
          description: 'Ege\'nin saklı kalmış köylerini keşfetmeye gidiyoruz. Fotoğraf makinenizi unutmayın.',
          category: 'Gezi',
          date: '10 Mart 2026',
          dateObj: new Date('2026-03-10'),
          time: '07:30',
          location: 'Bornova Metro Hareket',
          university: 'Dokuz Eylül Üniversitesi',
          club: 'Gezi Kulübü',
          semester: 'Kültür Topluluğu',
          quota: 45,
          imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
          color: '#0891b2',
          city: 'İzmir'
        },
        {
          id: 115,
          title: 'Blockchain 101',
          description: 'Blokzincir teknolojisinin temelleri ve kripto varlıklar üzerine seminer.',
          category: 'Teknoloji',
          date: '15 Mart 2026',
          dateObj: new Date('2026-03-15'),
          time: '13:00',
          location: 'Bahçeşehir Üniversitesi Güney Kampüs',
          university: 'Bahçeşehir Üniversitesi',
          club: 'Blockchain Kulübü',
          semester: 'Teknoloji Topluluğu',
          quota: 200,
          imageUrl: 'https://images.unsplash.com/photo-1621504450168-b8c4375c2b80?q=80&w=800&auto=format&fit=crop',
          color: '#2563eb',
          city: 'İstanbul'
        },
        {
          id: 116,
          title: 'Rock Festivali',
          description: 'Amatör ve profesyonel rock gruplarının sahne alacağı müzik şöleni.',
          category: 'Müzik',
          date: '22 Mart 2026',
          dateObj: new Date('2026-03-22'),
          time: '15:00',
          location: 'Hacettepe Beytepe Kampüsü',
          university: 'Hacettepe Üniversitesi',
          club: 'Rock Topluluğu',
          semester: 'Sanat Topluluğu',
          quota: 1500,
          imageUrl: 'https://images.unsplash.com/photo-1459749411177-0473ef7161a8?q=80&w=800&auto=format&fit=crop',
          color: '#9333ea',
          city: 'Ankara'
        },
        {
          id: 117,
          title: 'Seramik Atölyesi',
          description: 'Kendi seramik kupanı tasarla ve üret. Malzemeler bizden!',
          category: 'Sanat',
          date: '28 Mart 2026',
          dateObj: new Date('2026-03-28'),
          time: '11:00',
          location: 'Uludağ Üniversitesi Atölyeler',
          university: 'Bursa Uludağ Üniversitesi',
          club: 'El Sanatları Kulübü',
          semester: 'Sanat Topluluğu',
          quota: 20,
          imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=800&auto=format&fit=crop',
          color: '#db2777',
          city: 'Bursa'
        },
        {
          id: 118,
          title: 'Staj Fuarı 2026',
          description: 'Yaz dönemi stajı için firmalarla buluşma noktası.',
          category: 'Kariyer',
          date: '05 Nisan 2026',
          dateObj: new Date('2026-04-05'),
          time: '10:00',
          location: 'Kocaeli Üniversitesi Kongre Merkezi',
          university: 'Kocaeli Üniversitesi',
          club: 'Kariyer Merkezi',
          semester: 'Kariyer Topluluğu',
          quota: 600,
          imageUrl: 'https://images.unsplash.com/photo-1558222218-b7b54eede3f3?q=80&w=800&auto=format&fit=crop',
          color: '#ea580c',
          city: 'Kocaeli'
        },
        {
          id: 119,
          title: 'Voleybol Turnuvası',
          description: 'Fakülteler arası voleybol turnuvası final maçı.',
          category: 'Spor',
          date: '12 Nisan 2026',
          dateObj: new Date('2026-04-12'),
          time: '17:00',
          location: 'Burhan Felek Spor Salonu',
          university: 'Marmara Üniversitesi',
          club: 'Spor Birliği',
          semester: 'Spor Topluluğu',
          quota: 800,
          imageUrl: 'https://images.unsplash.com/photo-1612872087720-48ca556cd852?q=80&w=800&auto=format&fit=crop',
          color: '#16a34a',
          city: 'İstanbul'
        },
        {
          id: 120,
          title: 'Kapadokya Turu',
          description: 'Peribacaları ve balon turu ile eşsiz bir hafta sonu gezisi.',
          category: 'Gezi',
          date: '20 Nisan 2026',
          dateObj: new Date('2026-04-20'),
          time: '06:00',
          location: 'Kampüs Ana Kapı',
          university: 'Nevşehir Hacı Bektaş Veli Üniversitesi',
          club: 'Gezi ve Kamp Kulübü',
          semester: 'Kültür Topluluğu',
          quota: 50,
          imageUrl: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?q=80&w=800&auto=format&fit=crop',
          color: '#0891b2',
          city: 'Nevşehir'
        }
      ];
      return baseEvents.find(e => e.id === id);
  }

  private mapToCard(e: EventItem): any {
    const start = e.startDate ? new Date(e.startDate) : null;
    const formattedDate = start
      ? start.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    const formattedTime = start
      ? start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      : '';

    return {
      id: e.id,
      title: e.title || '',
      description: e.description || e.shortDescription || '',
      category: 'Etkinlik',
      date: formattedDate,
      dateObj: start || new Date(),
      time: formattedTime,
      university: '',
      club: e.communityName || '',
      location: e.location || '',
      quota: 0,
      imageUrl: e.imageUrl || '',
      color: '#2563eb',
      city: '',
    } as any;
  }
}
