import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [RouterLink, HeaderComponent, FooterComponent, NgFor, NgIf],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent {
  student = {
    name: 'Ayşe Yılmaz',
    email: 'ayse.yilmaz@universite.edu.tr',
    studentId: '2021517005',
    department: 'Yönetim Bilişim Sistemleri',
    program: 'Lisans',
    avatar: 'https://i.pravatar.cc/150?img=5', // Örnek modern avatar
  };

  // İkon yerine Emoji kullanarak daha samimi bir hava kattık
  quickLinks = [
    { title: 'Profili Düzenle', emoji: '✏️', link: '/hesabim/profil', color: '#FFD700' }, // Gold
    { title: 'Şifre Değiştir', emoji: '🔒', link: '/hesabim/sifre', color: '#FF6B6B' }, // Red
    { title: 'Bildirimler', emoji: '🔔', link: '/bildirimler', color: '#4ECDC4' }, // Teal
    { title: 'Topluluklar', emoji: '🚀', link: '/communities', color: '#1A535C' }, // '/topluluklar' buraya gidecek
    { title: 'Etkinlikler', emoji: '📅', link: '/events', color: '#FF9F1C' }, // '/etkinlikler' buraya gidecek
    { title: 'Destek Al', emoji: '💬', link: '/destek', color: '#292F36' }, // Dark
  ];

  notifications = [
    {
      id: 1,
      text: '🎉 Yeni bir duyuru: Bahar Şenliği başvuruları başladı!',
      time: '2 saat önce',
      read: false,
    },
    {
      id: 2,
      text: '👋 “YBS Topluluğu” seni bir etkinliğe davet etti.',
      time: '1 gün önce',
      read: true,
    },
    {
      id: 3,
      text: '⚠️ Profilinde eksik bilgiler var, tamamlamayı unutma.',
      time: '3 gün önce',
      read: false,
    },
  ];

  toggleRead(id: number): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.read = !notif.read;
  }
}
