import { Component, OnInit, HostListener, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ChatbotService, ChatResponse } from '../../services/chatbot.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

interface Message {
  text: string;
  isBot: boolean;
  buttons?: string[];
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe],
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.scss'],
  animations: [
    trigger('slideUpFadeIn', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(30px) scale(0.95)',
        }),
        animate(
          '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          style({
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({
            opacity: 0,
            transform: 'translateY(30px) scale(0.95)',
          })
        ),
      ]),
    ]),
  ],
})
export class ChatbotWidgetComponent implements OnInit, OnDestroy {
  isOpen = false;
  isVisible = true; // Chatbot görünürlüğü
  messages: Message[] = [];
  userInput = '';
  isLoading = false;
  private routerSubscription: Subscription | undefined;

  // Gizlenecek rotalar
  private hiddenRoutes = ['/community-dashboard', '/corporate-dashboard', '/profile', '/student-dashboard'];

  // Türkçe karakterli buton metinlerini backend'in beklediği İngilizce karakterli metinlere çevir
  // Frontend'de gösterilen -> Backend'e gönderilecek
  private buttonTextToBackend: { [key: string]: string } = {
    'ÜNİDES Nedir?': 'UNIDES Nedir?',
    'Başvuru Süreci': 'Başvuru Süreci',
    Duyurular: 'Duyurular',
  };

  // Backend'den gelen butonları Türkçe karakterlere çevir
  // Backend'den gelen -> Frontend'de gösterilecek
  private buttonTextFromBackend: { [key: string]: string } = {
    'UNIDES Nedir?': 'ÜNİDES Nedir?',
    'Başvuru Süreci': 'Başvuru Süreci',
    Duyurular: 'Duyurular',
  };

  constructor(
    private chatbotService: ChatbotService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Başlangıç mesajı
      this.addBotMessage(
        '👋 **Hoş Geldiniz!** Ben ÜNİDES Dijital Portal Asistanı.\n\nÜniversite topluluklarına sağlanan ayni destekler, proje başvuruları, görünürlük, mali süreçler ve raporlama konularında size yardımcı olabilirim.\n\nBaşlamak için bir konu seçin 👇',
        ['ÜNİDES Nedir?', 'Başvuru Süreci', 'Duyurular']
      );

      // Rota takibi yap
      this.checkVisibility(this.router.url);
      this.routerSubscription = this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        this.checkVisibility(event.urlAfterRedirects || event.url);
      });
    }
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private checkVisibility(url: string) {
    // URL, hiddenRoutes listesindeki herhangi biriyle başlıyorsa gizle
    this.isVisible = !this.hiddenRoutes.some(route => url.startsWith(route));
    if (!this.isVisible) {
      this.isOpen = false; // Gizlendiğinde sohbeti de kapat
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  closeChat(): void {
    this.isOpen = false;
  }

  sendMessage(text?: string, isButton = false): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let message = text || this.userInput.trim();
    if (!message) return;

    // Eğer buton tıklamasıysa, Türkçe karakterli metni backend'in beklediği formata çevir
    if (isButton && this.buttonTextToBackend[message]) {
      message = this.buttonTextToBackend[message];
    }

    // Kullanıcı mesajını ekle (orijinal Türkçe metinle)
    this.addUserMessage(text || this.userInput.trim());
    this.userInput = '';

    // Loading göster
    this.isLoading = true;

    // API'ye istek at (çevrilmiş metinle)
    this.chatbotService.sendMessage(message, isButton ? 'button' : 'text').subscribe({
      next: (response: ChatResponse) => {
        this.isLoading = false;
        // Backend'den gelen butonları Türkçe karakterlere çevir
        const translatedButtons = (response.butonlar || []).map(
          (btn) => this.buttonTextFromBackend[btn] || btn
        );
        // Bot cevabını ekle
        this.addBotMessage(response.cevap, translatedButtons);
      },
      error: (error) => {
        this.isLoading = false;
        // Error handling - logging is backend-only

        let errorMessage = 'Üzgünüm, bir hata oluştu. Lütfen daha sonra tekrar deneyin.';

        if (error.status === 0) {
          errorMessage = 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.';
        } else if (error.status === 404) {
          errorMessage = 'Chatbot servisi bulunamadı. Lütfen daha sonra tekrar deneyin.';
        } else if (error.status === 500) {
          errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
        } else if (error.status === 403 || error.status === 401) {
          errorMessage = 'Erişim hatası. Lütfen daha sonra tekrar deneyin.';
        }

        this.addBotMessage(errorMessage, []);
      },
    });
  }

  onButtonClick(buttonText: string): void {
    this.sendMessage(buttonText, true);
  }

  private addUserMessage(text: string): void {
    this.messages.push({
      text,
      isBot: false,
      timestamp: new Date(),
    });
    this.scrollToBottom();
  }

  private addBotMessage(text: string, buttons: string[] = []): void {
    this.messages.push({
      text,
      isBot: true,
      buttons: buttons.length > 0 ? buttons : undefined,
      timestamp: new Date(),
    });
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-messages');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    }
  }

  formatMessage(text: string): string {
    // Markdown basit formatlamaları (bold, link vb.)
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // HostListener kaldırıldı - HTML'deki (keydown.enter) event binding kullanılıyor
}
