import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component'; 
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
  selector: 'app-forum-category',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent], 
  templateUrl: './forum-category.component.html',
  styleUrl: './forum-category.component.scss'
})
export class ForumCategoryComponent {

  categoryInfo = {
    title: 'Yazılım Dünyası',
    desc: 'Kodlama dilleri, framework tartışmaları, GitHub projeleri ve teknik yardım alanı.',
    parent: 'Teknoloji & Geliştirme'
  };

  stickyTopics = [
    {
      title: 'Bölüm Kuralları ve Kod Paylaşım Standartları',
      author: 'Admin',
      date: '12 Eki 2024',
      replies: '0',
      views: '15.2K',
      lastPost: { user: 'Admin', time: '12 Eki 2024' },
      status: 'locked',
      tag: 'DUYURU',
      tagColor: 'red'
    },
    {
      title: 'Sıkça Sorulan Sorular (SSS) - Yazılıma Nereden Başlamalıyım?',
      author: 'TechLead',
      date: '05 Kas 2024',
      replies: '142',
      views: '8.4K',
      lastPost: { user: 'Newbie_Coder', time: 'Bugün, 09:15' },
      status: 'sticky',
      tag: 'REHBER',
      tagColor: 'gold'
    }
  ];

  topics = [
    {
      title: 'Angular 18 vs React 19: Performans Karşılaştırması',
      author: 'FrontendMaster',
      date: 'Bugün, 14:20',
      replies: '34',
      views: '512',
      lastPost: { user: 'ReactLover', time: '2 dk önce' },
      tag: 'TARTIŞMA',
      tagColor: 'blue',
      status: 'normal'
    },
    {
      title: '[YARDIM] Python ile veri çekerken "403 Forbidden" hatası alıyorum',
      author: 'DataMiner',
      date: 'Bugün, 12:00',
      replies: '5',
      views: '89',
      lastPost: { user: 'Pythonista', time: '45 dk önce' },
      tag: 'SORU',
      tagColor: 'green',
      status: 'normal'
    }
  ];
}