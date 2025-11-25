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

import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';

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
  imports: [CommonModule, FormsModule, HeaderComponent, FooterComponent],
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
          answer: `Giriş ekranında iki farklı seçenek bulunmaktadır:<br><br>
          <strong>• Üye Girişi:</strong> Üniversite öğrencileri ve Topluluk Başkanları bu sekmeyi kullanarak, üniversite e-postaları ile giriş yapmalıdır.<br>
          <strong>• Kurumsal Giriş:</strong> Yalnızca Gençlik ve Spor Bakanlığı (GSB) yetkilileri bu alanı kullanmalıdır.`,
          isOpen: true,
        },
        {
          question: 'Topluluk Başkanıyım, "Kurumsal Giriş"ten mi girmeliyim?',
          answer:
            'Hayır. Topluluk Başkanları da üniversite öğrencisi statüsünde olduğu için "Üye Girişi" sekmesini kullanmalıdır. Sisteme giriş yaptığınızda, başkanlık yetkiniz otomatik olarak tanımlanacak ve yönetim paneline erişiminiz açılacaktır.',
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
            'Sisteme "Üye Girişi" üzerinden girdikten sonra menüdeki "Benim Topluluğum" butonuna tıklayarak yönetim paneline ulaşabilir; topluluk bilgilerinizi buradan güncelleyebilirsiniz.',
          isOpen: false,
        },
        {
          question: 'Tamamlanan projelerimizi sisteme nasıl yükleyebiliriz?',
          answer:
            'Gerçekleştirdiğiniz projelere ait görselleri ve sonuç metinlerini <strong>unidesbilgi@gsb.gov.tr</strong> adresine iletmeniz gerekmektedir.',
          isOpen: false,
        },
      ],
    },
    {
      id: 'cat3',
      title: 'Forum ve Etkileşim',
      icon: 'forum',
      items: [
        {
          question: 'Forumda paylaştığım gönderi neden hemen görünmüyor?',
          answer:
            'Tüm başlıklar ve mesajlar yönetici onayı sürecinden geçmektedir. Onaylandıktan sonra yayınlanacaktır.',
          isOpen: false,
        },
        {
          question: 'Partnerlik için nasıl iletişim kurabilirim?',
          answer:
            'Forum alanındaki "Partner Arayışı" kategorisini kullanabilir veya topluluk profillerindeki iletişim bilgilerinden ulaşabilirsiniz.',
          isOpen: false,
        },
      ],
    },
    {
      id: 'cat4',
      title: 'Destek ve Mentörlük',
      icon: 'support_agent',
      items: [
        {
          question: 'Mentörlük sistemine kimler başvurabilir?',
          answer:
            'Üniversite e-posta adresi ile kayıtlı ve doğrulanmış tüm öğrenci üyeler başvurabilir.',
          isOpen: false,
        },
        {
          question: 'Teknik bir sorun yaşıyorum?',
          answer:
            'Hatanın ekran görüntüsünü <strong>unidesbilgi@gsb.gov.tr</strong> adresine iletebilirsiniz.',
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
