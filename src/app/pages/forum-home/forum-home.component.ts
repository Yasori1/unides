import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forum-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './forum-home.component.html',
  styleUrl: './forum-home.component.scss'
})
export class ForumHomeComponent {
  
  // Haber Bandı
  tickerItems = [
    'ÜNİDES 2025 Başvuruları Başladı!',
    'Hackathon İstanbul Kazananları Belli Oldu.',
    'Yapay Zeka Topluluğu Yeni Üyelerini Arıyor.',
    'Forum Bakım Çalışması: Bu gece 03:00 - 04:00 arası.'
  ];

  // Kategoriler
  categories = [
    {
      title: 'ÜNİDES GENEL MERKEZ', 
      forums: [
        { 
          title: 'Duyurular & Yönetim', 
          desc: 'Resmi duyurular, kural değişiklikleri ve yönetim mesajları.',
          iconClass: 'fa-solid fa-bullhorn', iconColor: 'gold',
          stats: { topics: '142', posts: '1.2K' },
          lastPost: { title: 'V3 Güncelleme Notları', user: 'Admin', date: 'Bugün, 14:30', avatar: 'Admin' },
          subLinks: ['Forum Kuralları', 'Yönetim Kadrosu'] 
        },
        { 
          title: 'Tanışma & Kaynaşma', 
          desc: 'Aramıza yeni katılanlar, kendinizi tanıtın.',
          iconClass: 'fa-solid fa-mug-hot', iconColor: 'orange',
          stats: { topics: '5.2K', posts: '48K' },
          lastPost: { title: 'Merhaba ben ODTÜ\'den...', user: 'Canan', date: 'Dün, 22:15', avatar: 'Canan' },
          subLinks: ['Hoşgeldin Mesajları', 'İl İl Tanışma']
        }
      ]
    },
    {
      title: 'KAMPÜS & ÖĞRENCİ YAŞAMI',
      forums: [
        { 
          title: 'Üniversite Sohbetleri', 
          desc: 'Kendi kampüsündeki olayları, itirafları ve gündemi konuş.',
          iconClass: 'fa-solid fa-building-columns', iconColor: 'blue',
          stats: { topics: '8.9K', posts: '120K' },
          lastPost: { title: 'Yemekhane zamları hk.', user: 'Mert', date: '34 dk önce', avatar: 'Mert' },
          subLinks: ['İstanbul Üni.', 'ODTÜ', 'İTÜ', 'YTÜ']
        },
        { 
          title: 'KYK & Barınma', 
          desc: 'Yurt başvuruları, ev arkadaşı arayanlar ve barınma sorunları.',
          iconClass: 'fa-solid fa-house-chimney', iconColor: 'green',
          stats: { topics: '3.1K', posts: '15K' },
          lastPost: { title: 'Kadıköy ev arkadaşı', user: 'Selin', date: '2 saat önce', avatar: 'Selin' },
          subLinks: null
        }
      ]
    },
    {
      title: 'TEKNOLOJİ & GELİŞTİRME',
      forums: [
        { 
          title: 'Yazılım Dünyası', 
          desc: 'Kodlama dilleri, framework tartışmaları ve GitHub projeleri.',
          iconClass: 'fa-solid fa-code', iconColor: 'purple',
          stats: { topics: '12K', posts: '95K' },
          lastPost: { title: 'Angular 19 Standalone', user: 'DevOne', date: '10 dk önce', avatar: 'Dev' },
          subLinks: ['Web Dev', 'Mobile', 'AI/ML']
        },
        { 
          title: 'Donanım & Sistem', 
          desc: 'PC toplama, laptop önerileri ve yeni teknolojiler.',
          iconClass: 'fa-solid fa-microchip', iconColor: 'cyan',
          stats: { topics: '4K', posts: '22K' },
          lastPost: { title: 'RTX 5090 Beklenir mi?', user: 'TechGuy', date: 'Dün, 18:00', avatar: 'Tech' },
          subLinks: null
        }
      ]
    },
    {
      title: 'KARİYER & GELECEK',
      forums: [
        { 
          title: 'Staj & İş İlanları', 
          desc: 'Öğrenciler için part-time işler ve staj fırsatları.',
          iconClass: 'fa-solid fa-briefcase', iconColor: 'red',
          stats: { topics: '900', posts: '2.5K' },
          lastPost: { title: 'ASELSAN Staj Başvurusu', user: 'İK_Bot', date: 'Bugün, 09:00', avatar: 'HR' },
          subLinks: ['Staj İlanları', 'Part-Time']
        }
      ]
    }
  ];

  // İstatistikler
  forumStats = {
    totalPosts: '342,102',
    totalTopics: '45,201',
    totalMembers: '12,045',
    activeUsers: '1,204',
    newestMember: 'Deniz_34',
    recordOnline: '3,450 (24.11.2024)'
  };
}