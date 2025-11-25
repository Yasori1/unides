import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';

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
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './privacy-policy-page.component.html',
  styleUrls: ['./privacy-policy-page.component.scss'],
})
export class PrivacyPolicyPageComponent implements OnInit {
  heroMoveX = 0;
  heroMoveY = 0;

  selectedPolicy: PolicyItem | null = null;
  isModalOpen = false;

  policyItems: PolicyItem[] = [
    {
      id: 1,
      title: 'Topladığımız Bilgiler',
      description: 'Ad, e-posta, öğrenci no ve otomatik toplanan veriler hakkında.',
      icon: 'folder_open',
      date: '20.11.2025',
      content: `
        <h3>1.1 Kişisel Bilgiler</h3>
        <ul>
          <li>Ad ve soyadı</li>
          <li>Üniversite e-posta adresi</li>
          <li>Öğrenci veya personel numarası</li>
          <li>Profil bilgileri (bölüm, program, rol)</li>
          <li>Sağlamayı tercih ettiğiniz iletişim bilgileri</li>
        </ul>
        <h3>1.2 Otomatik Toplanan Veriler</h3>
        <ul>
          <li>Cihaz bilgileri (tarayıcı türü, işletim sistemi)</li>
          <li>IP adresi</li>
          <li>Kullanım verileri</li>
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
        <ul>
          <li>Kullanıcı hesabı oluşturma ve yönetme</li>
          <li>Üniversite kimliğinin doğrulanması</li>
          <li>Topluluk içi iletişimi sağlama</li>
          <li>Hizmet güvenliği ve işlevselliğini artırma</li>
          <li>Duyuru ve bildirim gönderme</li>
        </ul>
      `,
    },
    {
      id: 3,
      title: 'Hukuki Dayanaklar',
      description: 'KVKK ve GDPR kapsamındaki işleme gerekçelerimiz.',
      icon: 'gavel',
      date: '20.11.2025',
      content: `
        <ul>
          <li>Açık rıza</li>
          <li>Sözleşmenin ifası</li>
          <li>Hukuki yükümlülükler</li>
          <li>Meşru menfaatler</li>
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
        <ul>
          <li>Üniversite birimleri</li>
          <li>Hizmet sağlayıcılar</li>
          <li>Yasal merciler (zorunlu hallerde)</li>
        </ul>
        <p class="highlight"><strong>Kişisel bilgiler üçüncü taraflara satılmaz.</strong></p>
      `,
    },
    {
      id: 5,
      title: 'Saklama Süresi',
      description: 'Verilerinizi ne kadar süreyle sistemlerimizde tutuyoruz?',
      icon: 'schedule',
      date: '20.11.2025',
      content: `
        <ul>
          <li>Hesabınız aktif olduğu sürece</li>
          <li>Yasal gereklilikler boyunca</li>
          <li>Hesap silme sonrası güvenlik amacıyla kısa bir süre</li>
        </ul>
      `,
    },
    {
      id: 6,
      title: 'Güvenlik Önlemleri',
      description: 'Verilerinizi korumak için aldığımız teknik tedbirler.',
      icon: 'security',
      date: '20.11.2025',
      content: `
        <ul>
          <li>HTTPS şifrelemesi</li>
          <li>Erişim kontrolleri</li>
          <li>Düzenli güvenlik taramaları</li>
        </ul>
        <p class="disclaimer">Hiçbir sistem %100 güvenli değildir, ancak en iyi endüstri standartlarını uyguluyoruz.</p>
      `,
    },
    {
      id: 7,
      title: 'Haklarınız',
      description: 'Verileriniz üzerindeki kontrol ve talep haklarınız.',
      icon: 'verified_user',
      date: '20.11.2025',
      content: `
        <ul>
          <li>Erişim ve düzeltme talebi</li>
          <li>Silme ve unutulma hakkı</li>
          <li>İtiraz etme</li>
          <li>Veri taşıma</li>
        </ul>
        <p class="contact">Talepleriniz için: <strong>info@unides.com</strong></p>
      `,
    },
    {
      id: 8,
      title: 'Çerezler (Cookies)',
      description: 'Site deneyimini iyileştirmek için kullanılan teknolojiler.',
      icon: 'cookie',
      date: '20.11.2025',
      content: `
        <ul>
          <li>Oturum yönetimi</li>
          <li>Tercihlerin hatırlanması</li>
          <li>Analitik veriler</li>
        </ul>
        <p>Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.</p>
      `,
    },
    {
      id: 9,
      title: 'Çocukların Gizliliği',
      description: 'Platformumuzun yaş sınırlaması ve politikası.',
      icon: 'child_care',
      date: '20.11.2025',
      content: `
        <p>Hizmetler, üniversite öğrencileri ve personeli içindir; 18 yaş altı veya üniversite öğrencisi olmayan bireylerden bilerek veri toplamayız.</p>
      `,
    },
    {
      id: 10,
      title: 'Değişiklikler',
      description: 'Bu politikada yapılan güncellemelerin takibi.',
      icon: 'update',
      date: '20.11.2025',
      content: `
        <p>Bu politika zaman zaman güncellenebilir. Değişiklikler bu sayfada yayınlandığı tarihte yürürlüğe girer.</p>
      `,
    },
    {
      id: 11,
      title: 'İletişim',
      description: 'Sorularınız için bize ulaşabileceğiniz kanallar.',
      icon: 'mail',
      date: '20.11.2025',
      content: `
        <p class="contact">
          <strong>GSB – Veri Koruma Birimi</strong><br>
          E-posta: info@unides.com<br>
          Telefon: (0312) 551 70 00
        </p>
      `,
    },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {}

  openCard(item: PolicyItem): void {
    this.selectedPolicy = item;
    this.isModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeCard(): void {
    this.isModalOpen = false;
    setTimeout(() => {
      this.selectedPolicy = null;
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
