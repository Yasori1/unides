import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
import { PageBannerComponent } from '../../common/page-banner/page-banner.component';
import { MagicCardComponent } from '../../common/magic-card/magic-card.component';
import { SwipeStackComponent } from '../../common/swipe-stack/swipe-stack.component';
import { EventService, Project } from '../../services/event.services';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    PageBannerComponent,
    MagicCardComponent,
    SwipeStackComponent,
  ],
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
})
export class EventsComponent implements OnInit {
  currentFilter: 'all' | 'active' | 'upcoming' = 'all';

  // Veri Listeleri
  allProjects: Project[] = [];
  paginatedProjects: Project[] = [];
  swipeProjects: Project[] = [];

  // Sayfalama
  currentPage: number = 1;
  itemsPerPage: number = 15;
  totalPages: number = 0;
  pages: number[] = [];

  // Swipe Hafızası
  seenSwipeIds: number[] = [];

  isLoading = true;

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    // Listeyi Çek
    this.eventService.getEvents().subscribe((data) => {
      this.allProjects = data;
      this.applyFilterAndPagination();
      this.isLoading = false;
    });

    // Swipe Kartlarını Çek
    this.loadMoreSwipeCards();
  }

  setFilter(filter: 'all' | 'active' | 'upcoming') {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  applyFilterAndPagination() {
    // Filtrele
    let filtered = this.allProjects;
    if (this.currentFilter !== 'all') {
      filtered = this.allProjects.filter((p) => p.status === this.currentFilter);
    }

    // Sayfala
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProjects = filtered.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilterAndPagination();

      // Sayfa başına scroll
      const gridElement = document.querySelector('.events-filter-menu');
      if (gridElement) gridElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  loadMoreSwipeCards() {
    this.eventService.getRandomSwipeEvents(20, this.seenSwipeIds).subscribe((data) => {
      if (data.length === 0) {
        // Veri bittiyse başa sar
        alert('Tüm etkinlikleri incelediniz! Liste başa sarılıyor...');
        this.seenSwipeIds = [];
        this.loadMoreSwipeCards();
        return;
      }

      this.swipeProjects = data;

      // Gelenleri hafızaya at
      const newIds = data.map((p: Project) => p.id);
      this.seenSwipeIds = [...this.seenSwipeIds, ...newIds];
    });
  }
}
