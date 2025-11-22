import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// --- ÖNEMLİ: Bu yollar senin projendeki klasör yapısına göre değişebilir ---
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { FormsModule } from '@angular/forms';

// Proje veri tipi
interface Project {
  id: number;
  title: string;
  status: 'active' | 'upcoming';
  startDate: string;
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
    FormsModule,
    HeaderComponent,
    FooterComponent,
    PageBannerComponent
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {

  currentFilter: 'all' | 'active' | 'upcoming' = 'all';

  // 🔥 Detay modalı için
  selectedProject: Project | null = null;

  // 🔥 Ekleme modalı için
  showAddModal: boolean = false;

  // 🔥 Form için başlangıç modeli
  newProject: Project = {
    id: 0,
    title: '',
    status: 'upcoming',
    startDate: '',
    description: '',
    location: '',
    image: 'assets/images/events/default-add.jpg'
  };

  // 📌 Varsayılan liste
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

  // 📌 Filtreleme
  setFilter(filter: 'all' | 'active' | 'upcoming') {
    this.currentFilter = filter;
    this.selectedProject = null;
  }

  get filteredProjects() {
    if (this.currentFilter === 'all') return this.projects;
    return this.projects.filter(p => p.status === this.currentFilter);
  }

  // 💥 Detay Aç
  openProject(project: Project) {
    this.selectedProject = project;
  }

  // ❌ Detay Kapat
  closeDetail() {
    this.selectedProject = null;
  }

  // 🆕 Modal Aç (Etkinlik Ekle)
  openAddModal() {
    this.showAddModal = true;
  }

  // 🗑 Modal Kapat + Form resetle
  closeAddModal() {
    this.showAddModal = false;
    this.newProject = {
      id: 0,
      title: '',
      status: 'upcoming',
      startDate: '',
      description: '',
      location: '',
      image: 'assets/images/events/default-add.jpg'
    };
  }

  // 💾 Kaydet
  saveProject() {
    this.newProject.id = this.projects.length + 1;
    this.projects.push({ ...this.newProject });
    this.closeAddModal();
  }

  // 🎉 Demo Katılım Butonu
  participate(project: Project) {
    alert(`"${project.title}" projesine başvuru alındı! (Demo)`);
  }
}
