import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// --- ÖNEMLİ: Bu yollar senin projendeki klasör yapısına göre değişebilir ---
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';

// Proje veri tipi
interface Project {
  id: number;
  title: string;
  status: 'active' | 'upcoming';
  startDate: string;          // <-- EKLENMİŞ OLMALI
  description: string;
  location?: string;
  image: string;
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

  // 🔥 DETAY MODALINI AÇMAK İÇİN GEREKEN STATE
  selectedProject: Project | null = null;  // <-- EKLENDİ

  projects: Project[] = [
    {
      id: 1,
      title: 'Kampüs Kodluyor Hackathonu',
      status: 'active',
      startDate: '25 Kasım 2025 - 27 Kasım 2025',
      description: '48 saat sürecek maratonda takımlar en iyi dijital çözümü üretmek için yarışıyor.',
      location: 'İstanbul Kampüs',
      image: 'assets/images/events/event1.jpg'
    },
    {
      id: 2,
      title: 'Sürdürülebilir Kampüs Zirvesi',
      status: 'upcoming',
      startDate: '10 Aralık 2025',
      description: 'Yeşil bir gelecek için üniversiteler arası işbirliği projeleri konuşuluyor.',
      location: 'Ankara',
      image: 'assets/images/events/event2.jpg'
    },
    {
      id: 3,
      title: 'Dijital Girişimcilik Akademisi',
      status: 'active',
      startDate: 'Her Cumartesi',
      description: 'Fikrini girişime dönüştürmek isteyenler için 8 haftalık eğitim programı devam ediyor.',
      location: 'Online',
      image: 'assets/images/events/event3.jpg'
    },
    {
      id: 4,
      title: 'Yapay Zeka ve Sanat Sergisi',
      status: 'upcoming',
      startDate: 'Ocak 2026',
      description: 'Yapay zeka araçlarıyla üretilen eserlerin sergileneceği büyük buluşma.',
      location: 'İzmir',
      image: 'assets/images/events/event4.jpg'
    }
  ];

  constructor() {}

  ngOnInit(): void {}

  setFilter(filter: 'all' | 'active' | 'upcoming') {
    this.currentFilter = filter;
    this.selectedProject = null;  // <-- FİLTRE DEĞİŞİNCE DETAY KAPANSIN
  }

  get filteredProjects() {
    if (this.currentFilter === 'all') return this.projects;
    return this.projects.filter(p => p.status === this.currentFilter);
  }

  // 💥 DETAY AÇMA FONKSİYONU (EKLENDİ)
  openProject(project: Project) {
    this.selectedProject = project;
  }

  // ❌ DETAY KAPATMA (EKLENDİ)
  closeDetail() {
    this.selectedProject = null;
  }

  // 🎉 KATIL BUTONU (EKLENDİ - DEMO)
  participate(project: Project) {
    alert(`"${project.title}" projesine başvuru alındı! (Demo)`);
  }
}
