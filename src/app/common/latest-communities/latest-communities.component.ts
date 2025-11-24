import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// Servisi ve Modeli import ediyoruz
import { CommunityService, Community } from '../../services/community.services';

@Component({
  selector: 'app-latest-communities',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './latest-communities.component.html',
  styleUrls: ['./latest-communities.component.scss'],
})
export class LatestCommunitiesComponent implements OnInit {
  communities: Community[] = [];
  isLoading: boolean = true;

  firstColumn: Community[] = [];
  secondColumn: Community[] = [];
  thirdColumn: Community[] = [];

  // Servisi constructor'a ekliyoruz
  constructor(private communityService: CommunityService) {}

  ngOnInit(): void {
    this.loadTopCommunities();
  }

  loadTopCommunities() {
    this.isLoading = true;

    // Servisten en popüler 9 topluluğu istiyoruz
    this.communityService.getTopCommunities(9).subscribe({
      next: (data) => {
        this.communities = data;
        this.distributeData();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Favori topluluklar yüklenemedi', err);
        this.isLoading = false;
      },
    });
  }

  distributeData() {
    if (!this.communities || this.communities.length === 0) return;

    const total = this.communities.length;
    const third = Math.ceil(total / 3);

    this.firstColumn = this.communities.slice(0, third);
    this.secondColumn = this.communities.slice(third, third * 2);
    this.thirdColumn = this.communities.slice(third * 2);
  }
}
