import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // *ngFor, *ngIf, ngClass için
import { RouterModule } from '@angular/router'; // routerLink için

import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';

interface Project {
  id: number;
  title: string;
  category: string;
  date: string;
  description: string;
  image: string;
  status: 'active' | 'upcoming'; // active: Devam Eden, upcoming: Yakında
  location?: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    PageBannerComponent
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  currentFilter: 'all' | 'active' | 'upcoming' = 'all';

  // Örnek veriler (görselleri assets/images/events içine eklemeyi unutma)
  projects: Project[] = [
    {
      id: 1,
      title: 'Kampüs Kodluyor Hackathonu',
      category: 'Yazılım & Teknoloji',
      date: '25 Kasım 2025 - 27 Kasım 2025',
      description: '48 saat sürecek maratonda takımlar en iyi dijital çözümü üretmek için yarışıyor.',
      image: 'assets/images/events/event1.jpg',
      status: 'active',
      location: 'İstanbul Kampüs'
    },
    {
      id: 2,
      title: 'Sürdürülebilir Kampüs Zirvesi',
      category: 'Sosyal Sorumluluk',
      date: '10 Aralık 2025',
      description: 'Yeşil bir gelecek için üniversiteler arası işbirliği projeleri konuşuluyor.',
      image: 'assets/images/events/event2.jpg',
      status: 'upcoming',
      location: 'Ankara'
    },
    {
      id: 3,
      title: 'Dijital Girişimcilik Akademisi',
      category: 'Kariyer & Eğitim',
      date: 'Her Cumartesi',
      description: 'Fikrini girişime dönüştürmek isteyenler için 8 haftalık eğitim programı devam ediyor.',
      image: 'assets/images/events/event3.jpg',
      status: 'active',
      location: 'Online'
    },
    {
      id: 4,
      title: 'Yapay Zeka ve Sanat Sergisi',
      category: 'Kültür & Sanat',
      date: 'Ocak 2026',
      description: 'Yapay zeka araçlarıyla üretilen eserlerin sergileneceği büyük buluşma.',
      image: 'assets/images/events/event4.jpg',
      status: 'upcoming',
      location: 'İzmir'
    }
  ];

  constructor() { }

  ngOnInit(): void {}

  setFilter(filter: 'all' | 'active' | 'upcoming') {
    this.currentFilter = filter;
  }

  get filteredProjects(): Project[] {
    if (this.currentFilter === 'all') {
      return this.projects;
    }
    return this.projects.filter(project => project.status === this.currentFilter);
  }
}
