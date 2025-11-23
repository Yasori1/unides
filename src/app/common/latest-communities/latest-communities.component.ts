import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // EKLENDİ: *ngFor için gerekli
import { RouterModule } from '@angular/router'; // EKLENDİ: routerLink için gerekli

// Topluluk veri yapısını (Interface) tanımlayalım
export interface Community {
  id: number;
  name: string;
  category: string;
  description: string;
  logo: string;
  memberCount: number;
}

@Component({
  selector: 'app-latest-communities',
  standalone: true, // EKLENDİ: Bileşeni bağımsız hale getirir
  imports: [CommonModule, RouterModule], // EKLENDİ: HTML'deki komutları tanıtır
  templateUrl: './latest-communities.component.html',
  styleUrls: ['./latest-communities.component.scss'],
})
export class LatestCommunitiesComponent implements OnInit {
  // HTML'in kullandığı ana veri listesi
  communities: Community[] = [];

  // Yükleniyor durumu
  isLoading: boolean = true;

  // Sütun verileri (Responsive tasarım için)
  firstColumn: Community[] = [];
  secondColumn: Community[] = [];
  thirdColumn: Community[] = [];

  // --- DEMO VERİLERİ ---
  private demoData: Community[] = [
    {
      id: 1,
      name: 'Yazılım ve İnovasyon',
      category: 'Teknoloji',
      description: 'Kampüsün en aktif kodlama topluluğu.',
      logo: 'assets/images/tech-club.jpg',
      memberCount: 120,
    },
    {
      id: 2,
      name: 'Tiyatro Kulübü',
      category: 'Sanat',
      description: 'Sahne tozu yutmak isteyenler buraya.',
      logo: 'assets/images/theater.jpg',
      memberCount: 45,
    },
    {
      id: 3,
      name: 'Doğa Yürüyüşü',
      category: 'Spor',
      description: 'Hafta sonları doğadayız.',
      logo: 'assets/images/hiking.jpg',
      memberCount: 88,
    },
    {
      id: 4,
      name: 'Girişimcilik',
      category: 'Kariyer',
      description: 'Fikirlerini işe dönüştür.',
      logo: 'assets/images/startup.jpg',
      memberCount: 200,
    },
    {
      id: 5,
      name: 'Fotoğrafçılık',
      category: 'Sanat',
      description: 'Anı yakalayanlar topluluğu.',
      logo: 'assets/images/photo.jpg',
      memberCount: 60,
    },
    {
      id: 6,
      name: 'Müzik Topluluğu',
      category: 'Sanat',
      description: 'Ritim ve melodi.',
      logo: 'assets/images/music.jpg',
      memberCount: 150,
    },
    {
      id: 7,
      name: 'Sinema Kulübü',
      category: 'Sanat',
      description: 'Haftalık film analizleri ve gösterimler.',
      logo: 'assets/images/cinema.jpg',
      memberCount: 95,
    },
    {
      id: 8,
      name: 'E-Spor',
      category: 'Oyun',
      description: 'Rekabetçi oyun turnuvaları.',
      logo: 'assets/images/esports.jpg',
      memberCount: 310,
    },
    {
      id: 9,
      name: 'Gastronomi',
      category: 'Yaşam',
      description: 'Lezzet avcıları buluşuyor.',
      logo: 'assets/images/food.jpg',
      memberCount: 75,
    },
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadCommunities();
  }

  loadCommunities() {
    this.isLoading = true;

    // Backend olmadığı için veriyi manuel eşitliyoruz.
    setTimeout(() => {
      this.communities = this.demoData;
      this.distributeData();
      this.isLoading = false;
    }, 100);
  }

  // Veriyi 3 sütuna dengeli dağıtan yardımcı fonksiyon
  distributeData() {
    if (!this.communities || this.communities.length === 0) return;

    const total = this.communities.length;
    const third = Math.ceil(total / 3);

    this.firstColumn = this.communities.slice(0, third);
    this.secondColumn = this.communities.slice(third, third * 2);
    this.thirdColumn = this.communities.slice(third * 2);
  }
}
