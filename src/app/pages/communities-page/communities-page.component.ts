import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';
// Servisi ve Modeli import ediyoruz
import { CommunityService, Community } from '../../services/community.services';

@Component({
  selector: 'app-communities-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './communities-page.component.html',
  styleUrls: ['./communities-page.component.scss'],
})
export class CommunitiesPageComponent implements OnInit {
  allCommunities: Community[] = [];
  displayedCommunities: Community[] = [];

  currentPage: number = 1;
  itemsPerPage: number = 15;
  totalPages: number = 0;
  pages: number[] = [];

  isLoading: boolean = true;

  // Servisi constructor'a ekliyoruz
  constructor(private communityService: CommunityService) {}

  ngOnInit(): void {
    this.fetchCommunities();
  }

  fetchCommunities() {
    this.isLoading = true;

    // Servisten TÜM toplulukları istiyoruz
    this.communityService.getAllCommunities().subscribe({
      next: (data) => {
        this.allCommunities = data;
        this.initPagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Topluluklar yüklenemedi:', err);
        this.isLoading = false;
      },
    });
  }

  initPagination() {
    this.totalPages = Math.ceil(this.allCommunities.length / this.itemsPerPage);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updateDisplayedData();
  }

  updateDisplayedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.displayedCommunities = this.allCommunities.slice(startIndex, endIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedData();
    }
  }
}
