import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

interface PolicyItem {
  id: number;
  title: string;
  description: string;
  icon: string;
  content: string;
  date: string;
}

@Component({
  selector: 'app-privacy-policy-page',
  standalone: true,
  imports: [CommonModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './privacy-policy-page.component.html',
  styleUrls: ['./privacy-policy-page.component.scss'],
})
export class PrivacyPolicyPageComponent implements OnInit {
  heroMoveX = 0;
  heroMoveY = 0;

  selectedPolicy: PolicyItem | null = null;
  isModalOpen = false;
  private closeTimeoutId: number | null = null;

  policyItems: PolicyItem[] = [
    {
      id: 1,
      title: 'Topladığımız Bilgiler',
      description: 'Ad, e-posta, öğrenci no ve otomatik toplanan veriler hakkında.',
      icon: 'folder_open',
      date: '20.11.2025',
      content: `
        <h3>Hesap Bilgileri</h3>
        <ul>
          <li>Topluluk başkanının .edu.tr uzantılı e-posta adresi</li>
          <li>Hesap şifresi (şifrelenmiş olarak saklanır)</li>
        </ul>
        <h3>Topluluk Kayıt Bilgileri</h3>
        <ul>
          <li>Topluluk adı</li>
          <li>Topluluk kategorisi</li>
          <li>Kısa açıklama</li>
          <li>Topluluk hakkında detaylı açıklama</li>
          <li>Şehir</li>
          <li>Üniversite adı</li>
          <li>Topluluk başkanı .edu.tr e-posta adresi</li>
          <li>Topluluk iletişim e-posta adresi</li>
          <li>Topluluk banner görseli</li>
          <li>Topluluk logosu</li>
        </ul>
        <h3>Otomatik Toplanan Veriler</h3>
        <p>Platform kullanımı sırasında aşağıdaki teknik veriler otomatik olarak toplanabilir:</p>
        <ul>
          <li>Tarayıcı türü ve sürümü</li>
          <li>IP adresi ve coğrafi konum (şehir düzeyinde)</li>
          <li>Sayfa görüntüleme ve oturum verileri</li>
        </ul>
      `,
    },
    {
      id: 2,
      title: 'Veri Kullanımı',
      description: 'Bilgilerinizi hizmet sunumu ve güvenlik için nasıl işliyoruz?',
      icon: 'manage_accounts',
      date: '20.11.2025',
      content: `
        <p>Topladığımız veriler yalnızca aşağıdaki amaçlar doğrultusunda kullanılmaktadır:</p>
        <ul>
          <li>Topluluk hesabı oluşturma ve kimlik doğrulama</li>
          <li>Etkinlik ve proje duyurularının yayınlanması ve yönetimi</li>
          <li>GSB Genç Ofis yetkililerinin onay süreçlerinin yürütülmesi</li>
          <li>Topluluklar arası iletişim ve iş birliği olanaklarının sağlanması</li>
          <li>Platform güvenliği ve kötüye kullanımın önlenmesi</li>
          <li>Sistem bildirimleri ve duyuru e-postalarının iletilmesi</li>
        </ul>
        <p class="highlight"><strong>Verileriniz hiçbir koşulda reklam amaçlı kullanılmaz veya üçüncü taraflarla ticari olarak paylaşılmaz.</strong></p>
      `,
    },
    {
      id: 3,
      title: 'Hukuki Dayanaklar',
      description: 'KVKK kapsamındaki veri işleme gerekçelerimiz.',
      icon: 'gavel',
      date: '20.11.2025',
      content: `
        <p>Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında aşağıdaki hukuki dayanaklara göre işlenmektedir:</p>
        <ul>
          <li><strong>Açık rıza:</strong> Platforma kayıt sırasında onayladığınız kullanım koşulları</li>
          <li><strong>Sözleşmenin ifası:</strong> Üyelik sözleşmesinin yerine getirilmesi</li>
          <li><strong>Hukuki yükümlülük:</strong> Yasal mercilerin talep ettiği durumlarda bilgi paylaşımı</li>
          <li><strong>Meşru menfaat:</strong> Platformun güvenli ve sürdürülebilir işletilmesi</li>
          <li><strong>Kamu yararı:</strong> T.C. Gençlik ve Spor Bakanlığı destekli bir program olması nedeniyle kamusal hizmet sunumu</li>
        </ul>
      `,
    },
    {
      id: 4,
      title: 'Bilgi Paylaşımı',
      description: 'Verileriniz kimlerle ve hangi durumlarda paylaşılır?',
      icon: 'share',
      date: '20.11.2025',
      content: `
        <p>Verileriniz yalnızca zorunlu hallerde ve aşağıdaki taraflarla sınırlı ölçüde paylaşılabilir:</p>
        <ul>
          <li><strong>GSB Genç Ofis yetkilileri:</strong> Topluluk profili ve etkinlik onay süreçleri için</li>
          <li><strong>Bağlı üniversite birimleri:</strong> Topluluk kaydının doğrulanması amacıyla</li>
          <li><strong>Teknik altyapı sağlayıcıları:</strong> Sunucu ve veri depolama hizmetleri için (gizlilik sözleşmesi kapsamında)</li>
          <li><strong>Yasal merciler:</strong> Mahkeme kararı veya yasal zorunluluk durumlarında</li>
        </ul>
        <p class="highlight"><strong>Kişisel bilgileriniz hiçbir koşulda üçüncü taraflara satılmaz veya ticari amaçla paylaşılmaz.</strong></p>
      `,
    },
    {
      id: 5,
      title: 'Saklama Süresi',
      description: 'Verilerinizi ne kadar süreyle sistemlerimizde tutuyoruz?',
      icon: 'schedule',
      date: '20.11.2025',
      content: `
        <p>Verileriniz, amacın gerektirdiği süre boyunca ve yasal yükümlülüklere uygun şekilde saklanır:</p>
        <ul>
          <li><strong>Aktif hesap süresi boyunca:</strong> Hesabınız aktif olduğu sürece tüm veriler korunur</li>
          <li><strong>Hesap silme sonrası 90 gün:</strong> Olası itiraz ve güvenlik süreçleri için geçici saklama</li>
          <li><strong>Etkinlik ve proje kayıtları:</strong> GSB raporlama yükümlülükleri gereği 5 yıl</li>
          <li><strong>Yasal zorunluluk halinde:</strong> İlgili mevzuatın öngördüğü süreler boyunca</li>
        </ul>
        <p>Saklama süresi dolan veriler güvenli şekilde silinir veya anonimleştirilir.</p>
      `,
    },
    {
      id: 6,
      title: 'Güvenlik Önlemleri',
      description: 'Verilerinizi korumak için aldığımız teknik tedbirler.',
      icon: 'security',
      date: '20.11.2025',
      content: `
        <p>Verilerinizin güvenliği için endüstri standartlarında teknik ve idari önlemler uygulanmaktadır:</p>
        <ul>
          <li>Tüm iletişim HTTPS/TLS şifrelemesi ile korunur</li>
          <li>Üniversite e-posta doğrulaması ile yetkisiz erişim engellenir</li>
          <li>Rol tabanlı erişim kontrolü (yönetici, topluluk başkanı, GSB yetkilisi)</li>
          <li>Şifreler tek yönlü hash algoritması ile saklanır; düz metin olarak tutulmaz</li>
          <li>Düzenli güvenlik taramaları ve güvenlik açığı değerlendirmeleri yapılır</li>
          <li>Anormal giriş denemeleri otomatik olarak tespit edilir ve engellenir</li>
        </ul>
        <p class="disclaimer">Hiçbir sistem %100 güvenli değildir. Şüpheli bir durum fark ederseniz lütfen <strong>bilgi@unidesportal.org</strong> adresine bildirin.</p>
      `,
    },
    {
      id: 7,
      title: 'Haklarınız',
      description: 'Verileriniz üzerindeki kontrol ve talep haklarınız.',
      icon: 'verified_user',
      date: '20.11.2025',
      content: `
        <p>KVKK'nın 11. maddesi kapsamında kişisel verileriniz üzerinde aşağıdaki haklara sahipsiniz:</p>
        <ul>
          <li><strong>Erişim hakkı:</strong> Hakkınızda hangi verilerin işlendiğini öğrenme</li>
          <li><strong>Düzeltme hakkı:</strong> Yanlış veya eksik bilgilerin güncellenmesini talep etme</li>
          <li><strong>Silme hakkı:</strong> Verilerinizin silinmesini veya anonimleştirilmesini isteme</li>
          <li><strong>İtiraz hakkı:</strong> Otomatik karar alma süreçlerine itiraz etme</li>
          <li><strong>Veri taşıma hakkı:</strong> Verilerinizi yapılandırılmış biçimde alma</li>
          <li><strong>İşlemeyi kısıtlama:</strong> Belirli durumlarda veri işlemenin durdurulmasını talep etme</li>
        </ul>
        <p class="contact">Talepleriniz için: <strong>bilgi@unidesportal.org</strong><br>Başvurular 30 gün içinde yanıtlanır.</p>
      `,
    },
    {
      id: 8,
      title: 'Çerezler (Cookies)',
      description: 'Site deneyimini iyileştirmek için kullanılan teknolojiler.',
      icon: 'cookie',
      date: '20.11.2025',
      content: `
        <p>ÜNİDES Dijital Portal, aşağıdaki amaçlarla çerez ve benzeri teknolojiler kullanmaktadır:</p>
        <ul>
          <li><strong>Zorunlu çerezler:</strong> Oturum yönetimi ve güvenli giriş için gereklidir, devre dışı bırakılamaz</li>
          <li><strong>Tercih çerezleri:</strong> Dil ve görünüm tercihlerinizin hatırlanması için kullanılır</li>
          <li><strong>Analitik çerezler:</strong> Hangi özelliklerin kullanıldığını anlayarak platformu iyileştirmemize yardımcı olur</li>
        </ul>
        <p>Zorunlu çerezler dışındaki çerezleri tarayıcı ayarlarınızdan yönetebilir veya devre dışı bırakabilirsiniz. Çerezleri engellemek bazı özelliklerin düzgün çalışmamasına yol açabilir.</p>
      `,
    },
    {
      id: 9,
      title: 'Çocukların Gizliliği',
      description: 'Platformumuzun yaş sınırlaması ve politikası.',
      icon: 'child_care',
      date: '20.11.2025',
      content: `
        <p>ÜNİDES Dijital Portal, yalnızca üniversite öğrencileri ve ilgili kurumsal kullanıcılara yönelik tasarlanmıştır.</p>
        <ul>
          <li>Platform, aktif üniversite öğrencilerine özel .edu / .edu.tr uzantılı e-posta ile kayıt gerektirir</li>
          <li>18 yaş altındaki bireylerden bilerek kişisel veri toplanmaz</li>
          <li>18 yaş altı bir kullanıcıya ait veri tespit edilmesi durumunda söz konusu veriler derhal silinir</li>
        </ul>
        <p>Bu konuda endişeniz varsa <strong>bilgi@unidesportal.org</strong> adresinden bizimle iletişime geçebilirsiniz.</p>
      `,
    },
    {
      id: 10,
      title: 'Değişiklikler',
      description: 'Bu politikada yapılan güncellemelerin takibi.',
      icon: 'update',
      date: '20.11.2025',
      content: `
        <p>Bu Gizlilik Politikası, ÜNİDES Dijital Portal'ın gelişimine ve yasal gerekliliklere bağlı olarak zaman zaman güncellenebilir.</p>
        <ul>
          <li>Önemli değişiklikler, kayıtlı e-posta adresinize bildirim gönderilerek duyurulur</li>
          <li>Tüm değişiklikler bu sayfada yayınlandığı tarihte geçerlilik kazanır</li>
          <li>Politika geçmişine erişmek için <strong>bilgi@unidesportal.org</strong> adresine başvurabilirsiniz</li>
          <li>Güncellemeler sonrasında platformu kullanmaya devam etmeniz, değişiklikleri kabul ettiğiniz anlamına gelir</li>
        </ul>
        <p>Son güncelleme tarihi: <strong>20.11.2025</strong></p>
      `,
    },
    {
      id: 11,
      title: 'İletişim',
      description: 'Sorularınız için bize ulaşabileceğiniz kanallar.',
      icon: 'mail',
      date: '20.11.2025',
      content: `
        <p>Gizlilik politikamız veya kişisel verilerinizle ilgili her türlü soru, talep ve şikayetleriniz için aşağıdaki kanallardan bize ulaşabilirsiniz:</p>
        <p class="contact">
          <strong>ÜNİDES Dijital Portal – Veri Sorumlusu</strong><br>
          E-posta: bilgi@unidesportal.org<br>
          Yanıt süresi: En fazla 30 iş günü
        </p>
        <p>KVKK kapsamındaki resmi başvurularınız için yazılı olarak veya kayıtlı elektronik posta (KEP) aracılığıyla da başvuru yapabilirsiniz. Başvurunuzda ad-soyad, iletişim bilgisi ve talep konusunu belirtmeniz yeterlidir.</p>
      `,
    },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {}

  openCard(item: PolicyItem): void {
    if (this.closeTimeoutId !== null) {
      clearTimeout(this.closeTimeoutId);
      this.closeTimeoutId = null;
    }
    this.selectedPolicy = item;
    this.isModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeCard(): void {
    if (!this.isModalOpen && !this.selectedPolicy) return;
    this.isModalOpen = false;
    // Keep a short timeout only if you want a close animation in the future.
    // Crucially, we store/clear the timeout so it cannot clobber a newly opened modal.
    this.closeTimeoutId = window.setTimeout(() => {
      if (!this.isModalOpen) {
        this.selectedPolicy = null;
      }
      this.closeTimeoutId = null;
    }, 300);
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  onHeroMouseMove(event: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      const x = event.clientX - window.innerWidth / 2;
      const y = event.clientY - window.innerHeight / 2;
      this.heroMoveX = x / 40;
      this.heroMoveY = y / 40;
    }
  }
}
