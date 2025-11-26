import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
  selector: 'app-forum-topic',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './forum-topic.component.html',
  styleUrl: './forum-topic.component.scss'
})
export class ForumTopicComponent {

  topicInfo = {
    title: 'Angular 18 ile Gelen Yeni "Signal" Tabanlı Input Yapısı',
    parent: 'Yazılım Dünyası',
    tags: ['ANGULAR', 'JAVASCRIPT', 'REHBER'],
    isLocked: false,
    isSticky: true
  };

  posts = [
    {
      id: 1,
      user: {
        name: 'Selir',
        title: 'Platform Yöneticisi',
        avatar: 'Selir',
        roleColor: 'admin',
        rankImage: 'assets/ranks/admin-stars.png',
        stats: {
          joinDate: '12 Eki 2023',
          messages: '12,405',
          location: 'İstanbul',
          likes: '5,200'
        },
        badges: [
            { 
              name: 'Yönetici', 
              image: 'https://img.shields.io/badge/Y%C3%96NET%C4%B0C%C4%B0-red?style=for-the-badge&logo=security&logoColor=white', 
              tooltip: 'Platform Yöneticisi' 
            },
            { 
              name: 'Developer', 
              image: 'https://img.shields.io/badge/DEV-Team-blue?style=for-the-badge&logo=github', 
              tooltip: 'Çekirdek Geliştirici' 
            },
            { 
              name: '5 Yıl', 
              image: 'https://img.shields.io/badge/5%20YIL-gold?style=social&logo=google-awards', 
              tooltip: '5 Yıllık Sadakat Rozeti' 
            }
        ]
      },
      content: `
        <p>Merhaba arkadaşlar,</p>
        <p>Angular 18 ile birlikte <strong>Signal</strong> yapısı artık input'lara da geldi.</p>
        <pre class="code-block">userId = input<string>('');</pre>
      `,
      date: 'Bugün, 14:30',
      signature: `<strong>ÜNİDES Platform Yöneticisi</strong>`,
      likes: 12 
    },
    {
      id: 2,
      user: {
        name: 'DevOne',
        title: 'Kıdemli Üye',
        avatar: 'DevOne',
        roleColor: 'member',
        stats: {
          joinDate: '05 Kas 2024',
          messages: '856',
          location: 'Ankara',
          likes: '142' 
        },
        badges: [
            { 
              name: 'Kıdemli', 
              icon: 'fa-solid fa-medal', 
              color: '#95a5a6', 
              tooltip: 'Kıdemli Üye' 
            },
            { 
              name: 'Pythonist', 
              image: 'https://img.shields.io/badge/PYTHON-Expert-yellow?style=flat-square&logo=python&logoColor=white', 
              tooltip: 'Python Uzmanı' 
            }
        ]
      },
      content: `<p>Hocam harika bir konu olmuş, eline sağlık.</p>`,
      date: 'Bugün, 15:15',
      signature: `Python & Angular Lover`,
      likes: 4
    },
    {
      id: 3,
      user: {
        name: 'TechLead',
        title: 'Global Moderatör',
        avatar: 'TechLead',
        roleColor: 'mod',
        stats: {
          joinDate: '20 Ara 2023',
          messages: '4,210',
          location: 'İzmir',
          likes: '2,100'
        },
        badges: [
            { icon: 'fa-solid fa-gavel', name: 'Moderatör', color: '#2ecc71', tooltip: 'Moderatör' },
            { icon: 'fa-solid fa-server', name: 'SysAdmin', color: '#e67e22', tooltip: 'Sistem Yöneticisi' }
        ]
      },
      content: `<p>Model yapısı da geldi arkadaşlar.</p>`,
      date: 'Bugün, 16:00',
      signature: `System Administrator`,
      likes: 8
    }
  ];
}