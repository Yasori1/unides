import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

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
  selector: 'app-sss', // Selector güncellendi
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sss.component.html', // DÜZELTİLDİ: Kendi html dosyasına bakıyor
  styleUrls: ['./sss.component.scss']   // DÜZELTİLDİ: Kendi scss dosyasına bakıyor
})
export class SssComponent implements OnInit, AfterViewInit { // Class ismi güncellendi

  activeCategory: string = 'cat1';
  heroMoveX = 0;
  heroMoveY = 0;

  categories: FaqCategory[] = [
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
          isOpen: true 
        },
        {
          question: 'Topluluk Başkanıyım, "Kurumsal Giriş"ten mi girmeliyim?',
          answer: 'Hayır. Topluluk Başkanları da üniversite öğrencisi statüsünde olduğu için "Üye Girişi" sekmesini kullanmalıdır. Sisteme giriş yaptığınızda, başkanlık yetkiniz otomatik olarak tanımlanacak ve yönetim paneline erişiminiz açılacaktır.',
          isOpen: false
        },
        {
          question: 'Kişisel e-posta adresimle (Gmail, Hotmail vb.) kayıt olabilir miyim?',
          answer: 'Hayır. Platformun güvenliğini ve kullanıcı doğruluğunu sağlamak amacıyla; sisteme yalnızca geçerli bir üniversite e-posta adresi (.edu / .edu.tr) ile kayıt olunabilmektedir.',
          isOpen: false
        },
        {
          question: 'Şifremi unuttum, nasıl yenileyebilirim?',
          answer: 'Giriş ekranında yer alan "Şifremi Unuttum" bağlantısına tıklayarak, sisteme kayıtlı üniversite e-posta adresinize şifre sıfırlama bağlantısı gönderilmesini sağlayabilirsiniz.',
          isOpen: false
        }
      ]
    },
    {
      id: 'cat2',
      title: 'Topluluk Yönetimi',
      icon: 'groups',
      items: [
        {
          question: '"Benim Topluluğum" panelini neden göremiyorum?',
          answer: '"Benim Topluluğum" paneli, sistemde yalnızca Topluluk Başkanı yetkisine sahip kullanıcılara görünür. Eğer topluluk başkanı olduğunuz halde bu alanı göremiyorsanız, yetki kontrolü için <strong>unidesbilgi@gsb.gov.tr</strong> adresiyle iletişime geçiniz.',
          isOpen: false
        },
        {
          question: 'Topluluk profil bilgilerini nasıl düzenlerim?',
          answer: 'Sisteme "Üye Girişi" üzerinden girdikten sonra menüdeki "Benim Topluluğum" butonuna tıklayarak yönetim paneline ulaşabilir; topluluk bilgilerinizi buradan güncelleyebilirsiniz.',
          isOpen: false
        },
        {
          question: 'Etkinliğimizi Ana Sayfadaki "Resmi Duyurular" alanında yayınlayabilir miyiz?',
          answer: 'Hayır. Ana sayfada yer alan "Resmi Duyurular" alanı, yalnızca Bakanlık (GSB) tarafından yapılan bilgilendirmeler içindir. Kendi etkinliklerinizi profiliniz üzerinden yayınlayabilirsiniz.',
          isOpen: false
        },
        {
          question: 'Tamamlanan ÜNİDES projelerimizi sisteme nasıl yükleyebiliriz?',
          answer: 'Gerçekleştirdiğiniz projelere ait görselleri ve sonuç metinlerini <strong>unidesbilgi@gsb.gov.tr</strong> adresine e-posta yoluyla iletmeniz gerekmektedir.',
          isOpen: false
        }
      ]
    },
    {
      id: 'cat3',
      title: 'Forum ve Etkileşim',
      icon: 'forum',
      items: [
        {
          question: 'Forumda paylaştığım gönderi neden hemen görünmüyor?',
          answer: 'Platformdaki içerik kalitesini korumak amacıyla tüm mesajlar yönetici onayı sürecinden geçmektedir. Onaylandıktan sonra yayınlanacaktır.',
          isOpen: false
        },
        {
          question: 'Başka bir toplulukla ortak proje yapmak için nasıl iletişim kurabilirim?',
          answer: 'Forum alanındaki "Partner Arayışı" kategorisini kullanabilir veya topluluk profillerindeki iletişim bilgilerinden ulaşabilirsiniz.',
          isOpen: false
        }
      ]
    },
    {
      id: 'cat4',
      title: 'Destek ve Mentörlük',
      icon: 'support_agent',
      items: [
        {
          question: 'Mentörlük sistemine kimler başvurabilir?',
          answer: 'Üniversite e-posta adresi ile kayıtlı ve doğrulanmış tüm öğrenci üyeler başvurabilir.',
          isOpen: false
        },
        {
          question: 'Teknik bir sorun yaşıyorum, ne yapmalıyım?',
          answer: 'Hatanın ekran görüntüsünü <strong>unidesbilgi@gsb.gov.tr</strong> adresine iletebilirsiniz.',
          isOpen: false
        }
      ]
    }
  ];

  documents = [
    { title: 'ÜNİDES Kurumsal Logosu', type: 'PNG / SVG', icon: 'image' },
    { title: 'GSB ve GHGM Logoları', type: 'PNG / SVG', icon: 'shield' },
    { title: 'Proje Başvuru ve Uygulama Rehberi', type: 'PDF', icon: 'description' }
  ];

  @ViewChildren('animItem') animItems!: QueryList<ElementRef>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
          }
        });
      }, { threshold: 0.1 });

      this.animItems.forEach(item => observer.observe(item.nativeElement));
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

  toggleQuestion(categoryIndex: number, questionIndex: number) {
    const item = this.categories[categoryIndex].items[questionIndex];
    item.isOpen = !item.isOpen;
  }

  scrollToCategory(catId: string) {
    this.activeCategory = catId;
    const element = document.getElementById(catId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}