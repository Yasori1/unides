import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

interface FaqCategory {
  id: string;
  title: string;
  icon: string;
  items: FaqItem[];
}

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './faq-page.component.html',
  styleUrls: ['./faq-page.component.scss'],
})
export class FaqPageComponent implements OnInit, AfterViewInit {
  activeCategory: string = 'cat1';
  heroMoveX = 0;
  heroMoveY = 0;
  searchText: string = '';

  // Ana Veri
  allCategories: FaqCategory[] = [
    {
      id: 'cat1',
      title: 'Üyelik ve Giriş',
      icon: 'login',
      items: [
        {
          question: 'Sisteme nasıl giriş yapabilirim?',
          answer: `Giriş ekranında üç farklı seçenek bulunmaktadır:<br><br>
          <strong>• Öğrenci Girişi:</strong> Üniversite öğrencileri bu sekmeyi kullanarak, üniversite e-postaları ile giriş yapmalıdır.<br>
          <strong>• Topluluk Girişi:</strong> Topluluk Başkanları bu sekmeyi kullanarak, üniversite e-postaları ile giriş yapmalıdır.<br>
          <strong>• Kurumsal Giriş:</strong> Yalnızca Gençlik ve Spor Bakanlığı (GSB) yetkilileri bu alanı kullanmalıdır.`,
          isOpen: true,
        },
        {
          question: 'Topluluk Başkanıyım, "Kurumsal Giriş"ten mi girmeliyim?',
          answer:
            'Hayır. Topluluk Başkanları "Topluluk Girişi" sekmesini kullanmalıdır. Sisteme giriş yaptığınızda, başkanlık yetkiniz otomatik olarak tanımlanacak ve yönetim paneline erişiminiz açılacaktır.',
          isOpen: false,
        },
        {
          question: 'Kişisel e-posta adresimle kayıt olabilir miyim?',
          answer:
            'Hayır. Platformun güvenliğini sağlamak amacıyla; sisteme yalnızca geçerli bir üniversite e-posta adresi (.edu / .edu.tr) ile kayıt olunabilmektedir.',
          isOpen: false,
        },
        {
          question: 'Şifremi unuttum, nasıl yenileyebilirim?',
          answer:
            'Giriş ekranında yer alan "Şifremi Unuttum" bağlantısına tıklayarak, sisteme kayıtlı üniversite e-posta adresinize şifre sıfırlama bağlantısı gönderilmesini sağlayabilirsiniz.',
          isOpen: false,
        },
      ],
    },
    {
      id: 'cat2',
      title: 'Topluluk Yönetimi',
      icon: 'groups',
      items: [
        {
          question: '"Benim Topluluğum" panelini neden göremiyorum?',
          answer:
            '"Benim Topluluğum" paneli, sistemde yalnızca Topluluk Başkanı yetkisine sahip kullanıcılara görünür. Eğer topluluk başkanı olduğunuz halde bu alanı göremiyorsanız, yetki kontrolü için <strong>unidesbilgi@gsb.gov.tr</strong> adresiyle iletişime geçiniz.',
          isOpen: false,
        },
        {
          question: 'Topluluk profil bilgilerini nasıl düzenlerim?',
          answer:
            'Topluluk bilgileri üniversitelerde bulunan GSB Genç Ofislerde bulunan yetkili kişi tarafından düzenlenebilir. Topluluk Başkanı kendisi güncelleyemez. Güncelleme talepleriniz için üniversitenizdeki GSB Genç Ofis ile iletişime geçebilirsiniz.',
          isOpen: false,
        },
        {
          question: 'Topluluk nasıl kaydedebilirim?',
          answer:
            'Üniversitenizde bulunan GSB Genç Ofise başvuru yaparak topluluk kaydınızı sistemde oluşturtabilirsiniz. GSB Genç Ofis yetkilileri başvurunuzu değerlendirecek ve onaylandıktan sonra topluluğunuz platformda görünür hale gelecektir.',
          isOpen: false,
        },
        {
          question: 'Topluluğuma nasıl üye ekleyebilirim?',
          answer:
            'Topluluk Başkanı olarak "Benim Topluluğum" panelinden "Üyeler" sekmesine giderek e-posta adresi ile üye arayabilir veya toplu üye ekleme özelliğini kullanabilirsiniz.',
          isOpen: false,
        },
        {
          question: 'Topluluğum için etkinlik nasıl oluşturabilirim?',
          answer:
            'Topluluk Başkanı olarak giriş yaptıktan sonra "Benim Topluluğum" panelinden "Etkinlikler" sekmesine giderek yeni etkinlik oluşturabilirsiniz. Oluşturduğunuz etkinlikler kurumsal onay sürecinden geçtikten sonra yayınlanacaktır.',
          isOpen: false,
        },
      ],
    },
    {
      id: 'cat3',
      title: 'Etkinlikler',
      icon: 'event',
      items: [
        {
          question: 'Etkinliklere nasıl katılabilirim?',
          answer:
            'Etkinlikler sayfasından ilgilendiğiniz etkinliği bulabilir ve detay sayfasından katılım bilgilerini görebilirsiniz. Etkinlikler genellikle topluluklar tarafından düzenlenir ve katılım koşulları etkinlik detayında belirtilir.',
          isOpen: false,
        },
        {
          question: 'Etkinliğim neden onay bekliyor durumunda?',
          answer:
            'Tüm etkinlikler yayınlanmadan önce Gençlik ve Spor Bakanlığı yetkilileri tarafından onaylanmalıdır. Onay süreci genellikle birkaç iş günü sürmektedir. Etkinliğiniz onaylandıktan sonra platformda görünür hale gelecektir.',
          isOpen: false,
        },
        {
          question: 'Etkinliğim reddedildi, ne yapmalıyım?',
          answer:
            'Etkinlik detay sayfasında reddedilme nedeni görüntülenir. Gerekli düzenlemeleri yaptıktan sonra etkinliği tekrar düzenleyip onaya gönderebilirsiniz.',
          isOpen: false,
        },
      ],
    },
    {
      id: 'cat4',
      title: 'Topluluklar',
      icon: 'groups',
      items: [
        {
          question: 'Topluluklara nasıl üye olabilirim?',
          answer:
            'Topluluklara sadece Topluluk Başkanları kendi panellerinden üyeleri kaydedebilir. Topluluğa üye olmak için topluluğun yetkilisiyle (Topluluk Başkanı) iletişime geçmeniz gerekmektedir.',
          isOpen: false,
        },
      ],
    },
    {
      id: 'cat5',
      title: 'Duyurular',
      icon: 'campaign',
      items: [
        {
          question: 'Duyuruları nasıl görüntüleyebilirim?',
          answer:
            'Ana sayfada veya "Duyurular" sayfasından tüm duyuruları görüntüleyebilirsiniz. Duyurular Gençlik ve Spor Bakanlığı tarafından yayınlanmaktadır.',
          isOpen: false,
        },
        {
          question: 'Duyuru detaylarına nasıl ulaşabilirim?',
          answer:
            'Duyurular sayfasından ilgilendiğiniz duyuruya tıklayarak detay sayfasına ulaşabilir ve tam içeriği okuyabilirsiniz.',
          isOpen: false,
        },
      ],
    },
    {
      id: 'cat6',
      title: 'Destek ve İletişim',
      icon: 'support_agent',
      items: [
        {
          question: 'Teknik bir sorun yaşıyorum, ne yapmalıyım?',
          answer:
            'Teknik sorunlarınız için <strong>unidesbilgi@gsb.gov.tr</strong> adresine e-posta gönderebilirsiniz. Sorunun çözümü için ekran görüntüsü veya hata mesajı eklemeniz faydalı olacaktır.',
          isOpen: false,
        },
        {
          question: 'Genel sorularım için nereye başvurabilirim?',
          answer:
            'Genel sorularınız için "İletişim" sayfasından bize ulaşabilir veya <strong>unidesbilgi@gsb.gov.tr</strong> adresine e-posta gönderebilirsiniz.',
          isOpen: false,
        },
        {
          question: 'Yetki veya erişim sorunum var, ne yapmalıyım?',
          answer:
            'Yetki veya erişim sorunlarınız için <strong>unidesbilgi@gsb.gov.tr</strong> adresine e-posta göndererek durumunuzu açıklayabilirsiniz. Yetkililer en kısa sürede size yardımcı olacaktır.',
          isOpen: false,
        },
      ],
    },
  ];

  filteredCategories: FaqCategory[] = [];

  documents = [
    {
      title: 'ÜNİDES Kurumsal Logosu',
      type: 'PNG / SVG',
      icon: 'image',
      url: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/T.C._Gen%C3%A7lik_ve_Spor_Bakanl%C4%B1%C4%9F%C4%B1_logo.svg',
    },
    {
      title: 'Proje Başvuru Rehberi',
      type: 'PDF Dokümanı',
      icon: 'description',
      url: 'https://www.ab.gov.tr/files/Siyasi%20İşler/2023_yili_proje_teklif_cagrisi_rehberi.pdf',
    },
    {
      title: 'Gençlik Merkezi Yönetmeliği',
      type: 'Resmi Gazete',
      icon: 'gavel',
      url: 'https://www.resmigazete.gov.tr/eskiler/2019/04/20190412-3.htm',
    },
  ];

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.filteredCategories = JSON.parse(JSON.stringify(this.allCategories));
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('reveal-active');
            }
          });
        },
        { threshold: 0.1 }
      );

      this.animItems.forEach((item) => observer.observe(item.nativeElement));
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

  filterFaq() {
    if (!this.searchText || this.searchText.trim() === '') {
      this.filteredCategories = JSON.parse(JSON.stringify(this.allCategories));
    } else {
      const term = this.searchText.toLowerCase();
      this.filteredCategories = this.allCategories
        .map((cat) => {
          const matchingItems = cat.items.filter(
            (item) =>
              item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term)
          );
          if (matchingItems.length > 0) {
            matchingItems.forEach((i) => (i.isOpen = true));
            return { ...cat, items: matchingItems };
          }
          return null;
        })
        .filter((cat) => cat !== null) as FaqCategory[];
    }
  }

  toggleQuestion(categoryIndex: number, questionIndex: number) {
    const item = this.filteredCategories[categoryIndex].items[questionIndex];
    item.isOpen = !item.isOpen;
  }

  scrollToCategory(catId: string) {
    this.activeCategory = catId;
    const element = document.getElementById(catId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  downloadFile(url: string) {
    if (isPlatformBrowser(this.platformId)) {
      window.open(url, '_blank');
    }
  }
}
