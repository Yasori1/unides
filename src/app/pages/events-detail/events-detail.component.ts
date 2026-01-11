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
          description: `Yapay zeka ve teknoloji dünyasının sınırlarını zorlayan bu zirvede, geleceğin nasıl şekilleneceğini keşfetmeye hazır mısınız? 

Bu yıl düzenlenecek olan "Geleceğin Teknolojileri ve Yapay Zeka Zirvesi", sektörün önde gelen liderlerini, yenilikçi girişimcileri ve akademisyenleri bir araya getiriyor. Etkinlik boyunca yapay zeka etiği, blok zincir teknolojisinin finans dünyasındaki yeri, otonom sistemler ve nesnelerin interneti (IoT) gibi kritik konular derinlemesine tartışılacak.

Katılımcılar, alanında uzman konuşmacıların sunumlarını dinleme, interaktif panellere katılma ve workshoplar sayesinde teorik bilgilerini pratiğe dökme şansı bulacaklar. Ayrıca fuar alanında en yeni teknolojik ürünleri deneyimleyebilir, startup standlarını gezerek yeni kariyer fırsatları yakalayabilirsiniz.

Etkinlik Programı:
- 10:00 - Açılış Konuşması ve Keynote: "Yapay Zeka Nereye Gidiyor?"
- 11:30 - Panel: Blok Zincir ve Finansın Geleceği
- 13:00 - Öğle Arası ve Networking
- 14:00 - Workshop: Python ile Veri Analizine Giriş
- 16:00 - Kapanış ve Ödül Töreni

Siz de teknolojinin kalbinin attığı bu etkinlikte yerinizi alın, geleceği bugünden yakalayın!`,
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
          description: `Sonbaharın büyüleyici atmosferinde, cazın özgür ruhunu kampüse taşıyoruz! Kampüs Caz Festivali, müzikseverleri unutulmaz bir deneyime davet ediyor.

ODTÜ Vişnelik Çim Amfi'nin eşsiz doğasında gerçekleşecek festivalde, yerli ve yabancı caz gruplarının sahne alacağı konserler, gün boyu sürecek müzik ziyafeti sunacak. Sadece dinlemekle kalmayacak, ritim atölyeleri ve enstrüman tanıtımları ile müziğin mutfağına da girebileceksiniz.

Festival alanında kurulacak yeme-içme standları, plak pazarı ve sanat sergileri ile tam bir kültür-sanat günü sizi bekliyor. Arkadaşlarınızla çimlere uzanıp, yıldızların altında cazın keyfini çıkarmak için biletinizi şimdiden ayırtın.

Öne Çıkan Grupler:
- Blue Note Quartet
- Jazz & Blues Band
- Kampüs Orkestrası (Özel Performans)

Unutmayın, müzik ruhun gıdasıdır ve bu festival ruhunuzu doyuracak!`,
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
          description: `Sanatın sınırlarını zorlayan, yaratıcılığın ve estetiğin buluşma noktası: Modern Sanat ve Tasarım Bienali başlıyor.

Genç sanatçıların ve tasarımcıların eserlerinin sergileneceği bu bienal, geleneksel sanat anlayışını modern tekniklerle harmanlıyor. Dijital sanat, enstalasyon, heykel ve grafik tasarım alanlarında yüzlerce eser sanatseverlerin beğenisine sunulacak.

Etkinlik kapsamında düzenlenecek panellerde, sanatın toplum üzerindeki etkisi, dijitalleşmenin sanata yansımaları ve sürdürülebilir tasarım konuları ele alınacak. Küratör eşliğinde yapılacak sergi turları ile eserlerin hikayelerini ve sanatçıların ilham kaynaklarını yakından tanıma fırsatı bulacaksınız.

Sanatla dolu, ilham verici bir hafta için Mimar Sinan Güzel Sanatlar Üniversitesi'nde buluşuyoruz.`,
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
          description: `Kariyerinize güçlü bir başlangıç yapmak, iş dünyasının profesyonelleri ile tanışmak ve hayalinizdeki işe bir adım daha yaklaşmak ister misiniz?

Kariyer ve Networking Günleri, Türkiye'nin önde gelen şirketlerinin İnsan Kaynakları yöneticilerini ve sektör liderlerini öğrencilerle buluşturuyor. Etkinlik boyunca düzenlenecek seminerlerde, CV hazırlama teknikleri, mülakat simülasyonları ve kariyer planlama stratejileri üzerine değerli bilgiler paylaşılacak.

Katılımcı firmaların stantlarını ziyaret ederek staj ve iş başvurusu yapabilir, şirket kültürlerini yakından tanıyabilirsiniz. Ayrıca, "Networking Saati" etkinliklerinde profesyonellerle birebir görüşme ve mentörlük alma fırsatı yakalayabilirsiniz.

Geleceğinizi şansa bırakmayın, bu etkinlikte yerinizi alın!`,
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
          description: `Şehrin stresinden ve gürültüsünden uzaklaşarak doğanın kucağında huzurlu bir hafta sonu geçirmeye ne dersiniz?

Uludağ Milli Parkı'nın eşsiz güzellikleri arasında gerçekleştireceğimiz bu etkinlikte, doğa yürüyüşü, kamp ateşi sohbetleri ve yıldız gözlemi gibi aktiviteler sizi bekliyor. Tecrübeli rehberler eşliğinde yapılacak yürüyüşte, bölgenin flora ve faunasını tanıma şansı bulacak, temiz havanın tadını çıkaracaksınız.

Kampçılık eğitimi verilecek etkinlikte, çadır kurma, doğada yön bulma ve temel hayatta kalma becerileri üzerine pratik bilgiler paylaşılacak. Akşam yakılan kamp ateşi etrafında toplanıp, müzik eşliğinde keyifli vakit geçireceğiz.

Doğaya saygı çerçevesinde gerçekleştireceğimiz bu etkinliğe katılmak için sırt çantanızı hazırlayın!`,
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
          description: `Dijital dünyanın savunma hattında yer almak isteyenler için kaçırılmayacak bir fırsat! Siber Güvenlik Bootcamp ile etik hackerlık dünyasına adım atın.

3 gün sürecek bu yoğun eğitim programında, ağ güvenliği, web uygulama güvenliği, zararlı yazılım analizi ve sızma testleri (pentest) konularında kapsamlı eğitimler verilecek. Alanında uzman siber güvenlik analistleri tarafından verilecek teorik eğitimlerin yanı sıra, sanal laboratuvar ortamlarında gerçek senaryolar üzerinden pratik yapma imkanı bulacaksınız.

Kampın sonunda düzenlenecek "Capture The Flag (CTF)" yarışmasında öğrendiklerinizi test edebilir, sürpriz ödüllerin sahibi olabilirsiniz. Siber güvenlik kariyerine başlamak isteyen herkesi bekliyoruz.`,
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
          description: `Şehri vizörden keşfetmeye hazır mısınız? İstanbul'un tarihi sokaklarında, gizli kalmış köşelerinde ve büyüleyici manzaralarında fotoğraf dolu bir gün geçiriyoruz.

Bu etkinlikte, sokak fotoğrafçılığı teknikleri, kompozisyon kuralları, ışık kullanımı ve portre çekimi üzerine uygulamalı eğitimler alacaksınız. Profesyonel fotoğrafçıların mentorluğunda gerçekleşecek turda, hem teorik bilgilerinizi pekiştirecek hem de portfolyonuz için harika kareler yakalayacaksınız.

Tur rotamız Galata, Karaköy ve Balat'ı kapsıyor. Fotoğraf makinenizi veya telefonunuzu kapın, anı dondurmak için bize katılın!`,
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
          description: `İş dünyasında ilk izlenim her şeydir. Etkileyici bir CV hazırlayarak kariyer basamaklarını daha hızlı tırmanmaya ne dersiniz?

Bu atölyede, İK uzmanları eşliğinde profesyonel CV hazırlama tekniklerini öğreneceksiniz. ATS uyumlu CV nedir, ön yazı nasıl yazılır, LinkedIn profili nasıl optimize edilir gibi soruların cevaplarını bulacaksınız. Ayrıca, birebir CV incelemeleri ile eksiklerinizi görme ve düzeltme şansı yakalayacaksınız.

Mülakat teknikleri üzerine yapılacak simülasyonlarla, iş görüşmelerine de hazırlıklı olacaksınız. Hayalinizdeki işe giden yolda sağlam bir adım atmak için bu atölyeyi kaçırmayın.`,
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
          description: `Verilerin gücünü keşfedin! Veri bilimi dünyasına giriş yapmak ve R programlama dili ile analiz yeteneklerinizi geliştirmek için harika bir fırsat.

Başlangıç seviyesindeki bu atölyede, veri manipülasyonu, veri görselleştirme ve temel istatistiksel analiz konuları işlenecek. Gerçek dünya veri setleri üzerinde çalışarak, teorik bilgileri pratiğe dökme imkanı bulacaksınız.

Eğitim İçeriği:
- R ve RStudio Kurulumu ve Arayüz Tanıtımı
- Veri Yapıları ve Veri Okuma
- Dplyr ile Veri Manipülasyonu
- Ggplot2 ile Veri Görselleştirme

Kendi bilgisayarınızı getirmeyi unutmayın!`,
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
          description: `Ruhunuzu dinlendirecek, sanat dolu bir akşam için Klasik Müzik Konseri'ne davetlisiniz. Üniversite senfoni orkestrasının icra edeceği eserlerle, klasik müziğin büyülü dünyasında bir yolculuğa çıkacağız.

Repertuarda Mozart, Beethoven, Vivaldi ve Çaykovski gibi usta bestecilerin ölümsüz eserleri yer alıyor. Müziğin evrensel diliyle buluşacağımız bu özel gecede, hem solo performanslar hem de orkestra uyumu kulaklarınızın pasını silecek.

Sanatın ve müziğin birleştirici gücünü hissetmek için tüm öğrencilerimizi ve akademisyenlerimizi bekliyoruz.`,
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
          description: `Bedenin diliyle anlatılan hikayelere tanıklık etmeye hazır mısınız? Üniversitemiz Dans Topluluğu'nun hazırladığı "Hareketin İzleri" modern dans gösterisi sahnede!

Aylardır süren provaların ardından ortaya çıkan bu gösteride, modern dansın estetiği, çağdaş koreografilerle buluşuyor. Duyguların hareketle ifade edildiği, müziğin ritmine kapılan dansçıların performansı izleyicileri büyüleyecek.

Sanatın her dalını destekleyen üniversitemizde, dansın enerjisini hissetmek ve arkadaşlarınızla keyifli bir akşam geçirmek için bu gösteriyi kaçırmayın.`,
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
          description: `Fikrine güvenen, girişimcilik ruhuna sahip gençler sahneye çıkıyor! Startup Pitching Day, inovatif iş fikirlerinin yatırımcılarla ve mentörlerle buluştuğu heyecan dolu bir etkinlik.

Ön elemeyi geçen girişimci takımlar, projelerini jüri karşısında sunacak ve büyük ödül için yarışacaklar. Etkinlikte ayrıca başarılı girişimcilerin deneyim paylaşımları, ekosistem analizi ve networking seansları da yer alacak.

Kendi girişiminizi kurma hayaliniz varsa veya girişimcilik dünyasındaki yenilikleri takip etmek istiyorsanız, bu etkinlik tam size göre. İlham almak ve geleceğin unicornlarıyla tanışmak için orada olun!`,
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
          description: `Sağlıklı yaşam için harekete geç! Geleneksel Kampüs Koşusu ile hem spor yapıyor hem de eğleniyoruz.

5K parkurunda gerçekleşecek koşuya, amatörden profesyonele her seviyeden koşucu davetli. Yarış öncesi ısınma hareketleri, müzik ve eğlenceli aktivitelerle başlayacak gün, koşu sonrası düzenlenecek ödül töreni ve ikramlarla devam edecek.

Sporun birleştirici gücüyle bir araya geleceğimiz bu etkinlikte, dereceye girenleri sürpriz hediyeler bekliyor. Kondisyonuna güvenen, temiz havada spor yapmak isteyen herkesi start çizgisine bekliyoruz.`,
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
          description: `Tarihin ve doğanın iç içe geçtiği Ege'nin incisi köyleri keşfe çıkıyoruz. Taş evleri, dar sokakları ve samimi insanlarıyla ünlü bu köylerde zamanın nasıl geçtiğini anlamayacaksınız.

Rota kapsamında Şirince, Birgi ve Sığacık gibi tarihi dokusu korunmuş yerleşimleri ziyaret edeceğiz. Yöresel lezzetlerin tadına bakacak, el sanatları atölyelerini gezecek ve bol bol fotoğraf çekeceğiz.

Baharın gelişini Ege'nin renkleriyle karşılamak, yeni arkadaşlıklar kurmak ve unutulmaz anılar biriktirmek için bu geziyi kaçırmayın. Kontenjan sınırlıdır, acele edin!`,
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
          description: `Merkeziyetsiz dünyanın kapılarını aralıyoruz! Blockchain teknolojisinin temellerini öğrenmek ve kripto varlık ekosistemini anlamak isteyenler için hazırlanan bu seminerde, teknolojinin geleceği masaya yatırılıyor.

Blokzincir nedir, nasıl çalışır? Akıllı kontratlar, NFT'ler ve DeFi (Merkeziyetsiz Finans) kavramları ne anlama geliyor? Bu soruların ve daha fazlasının cevabını uzman konuşmacılarımızdan dinleyeceksiniz. Sektördeki son gelişmelerin ve kariyer fırsatlarının da konuşulacağı etkinlik, teknoloji meraklıları için ufuk açıcı olacak.`,
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
          description: `Gitarların sesi, davulun ritmi ve gençliğin enerjisi bu festivalde buluşuyor! Üniversite kampüsünde gerçekleşecek Rock Festivali ile müziğe doyacaksınız.

Amatör üniversite gruplarının yanı sıra, profesyonel rock gruplarının da sahne alacağı festivalde, rock müziğin en sevilen parçaları hep bir ağızdan söylenecek. Festival alanında kurulacak oyun alanları ve yiyecek stantları ile eğlence gün boyu devam edecek.

Sınav stresini atmak, doyasıya eğlenmek ve rock müziğin coşkusunu yaşamak için herkesi bekliyoruz!`,
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
          description: `Çamurun sanata dönüştüğü yerde buluşuyoruz. Kendi ellerinizle şekil verip, boyayıp, pişireceğiniz seramik objeler tasarlamak ister misiniz?

Bu atölyede, seramik sanatının temel tekniklerini öğrenecek, çamuru yoğurma, şekillendirme ve sırlama aşamalarını deneyimleyeceksiniz. Yaratıcılığınızı serbest bırakarak yapacağınız kupa, tabak veya dekoratif objeler, tamamen size özel olacak.

Stres atmak, üretmenin keyfine varmak ve sanatla iç içe bir gün geçirmek için kontenjan dolmadan kaydınızı yaptırın.`,
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
          description: `Kariyer yolculuğunuzun ilk adımı olan staj imkanlarını keşfetmek için Staj Fuarı'na davetlisiniz. Farklı sektörlerden onlarca firma, stajyer adaylarıyla tanışmak için kampüse geliyor.

Mühendislikten işletmeye, sağlıktan iletişime kadar birçok alanda faaliyet gösteren şirketlerin stantlarını ziyaret ederek staj programları hakkında bilgi alabilir, başvurularınızı doğrudan yapabilirsiniz. Ayrıca fuar süresince düzenlenecek "Stajda Başarı Tüyoları" konulu seminerlere katılarak kendinizi geliştirebilirsiniz.`,
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
          description: `Takımını kur, sahaya çık ve şampiyonluk için ter dök! Fakülteler arası düzenlenen Voleybol Turnuvası'nda rekabet ve dostluk bir arada.

Elemeler sonucunda finale kalan takımların karşılaşacağı büyük final maçında heyecan dorukta olacak. Tribünlerde yerinizi alarak favori takımınızı destekleyebilir, sporun coşkusuna ortak olabilirsiniz. Maç aralarında düzenlenecek yarışmalar ve gösterilerle eğlenceli bir spor günü sizi bekliyor.`,
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
          description: `Masalsı bir coğrafyada unutulmaz bir hafta sonu! Güzel atlar ülkesi Kapadokya'yı keşfetmek için yola çıkıyoruz.

Peribacaları arasında yürüyüş yapacak, yeraltı şehirlerinin gizemini çözecek ve gün doğumunda balonların gökyüzünü süslediği o eşsiz manzaraya şahit olacağız. Avanos'ta çömlek yapımını izleyecek, Göreme Açık Hava Müzesi'nde tarihe yolculuk yapacağız.

Hem kültürel bir gezi hem de doğa ile iç içe keyifli bir tatil arayanlar için harika bir fırsat.`,
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
