import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ElementRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms';
import { SiteNavbarComponent } from '../../common/site-navbar/site-navbar.component';
import { SiteFooterComponent } from '../../common/site-footer/site-footer.component';

interface Slide { subtitle: string; title: string; description: string; image: string; }
interface Community { id: number; name: string; image: string; category: string; memberCount: number; eventCount: number; isFeatured: boolean; }

@Component({
  selector: 'app-home2',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SiteNavbarComponent, SiteFooterComponent],
  templateUrl: './home2.component.html',
  styleUrls: ['./home2.component.scss']
})
export class Home2Component implements OnInit, OnDestroy {

  mouseX: number = 0;
  mouseY: number = 0;

  // --- SLIDER ---
  currentSlide = 0;
  slideInterval: any;
  slides: Slide[] = [
    { subtitle: 'GENÇLİK VE SPOR BAKANLIĞI', title: '2025 EĞİTİM BURSLARI', description: 'Yükseköğretim öğrencileri için burs ve kredi başvuruları başlamıştır.', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2000&auto=format&fit=crop' },
    { subtitle: 'MİLLİ TEKNOLOJİ HAMLESİ', title: 'TEKNOFEST 2025', description: 'Dünyanın en büyük havacılık, uzay ve teknoloji festivali için geri sayım başladı.', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2000&auto=format&fit=crop' },
    { subtitle: 'KARİYER KAPISI', title: 'KAMUDA STAJ FIRSATI', description: 'Ulusal Staj Programı başvuruları açıldı.', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2000&auto=format&fit=crop' }
  ];

  aboutImage: string = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop'; 
  videoThumbnail: string = 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop'; 

  searchText: string = '';
  isCategoryOpen: boolean = false;
  isLocationOpen: boolean = false;
  selectedCategory: string | null = null;
  selectedLocation: string | null = null;
  categories: string[] = ['Eğitim', 'Kariyer', 'Burslar', 'Teknoloji', 'Sanat', 'Spor'];
  locations: string[] = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Online'];

  isLoading: boolean = true;
  featuredCommunities: Community[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private eRef: ElementRef, private router: Router) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startSlider();
      this.loadFeaturedCommunities(); 
    }
  }

  ngOnDestroy() { if (this.slideInterval) { clearInterval(this.slideInterval); } }

  // ÖNEMLİ: Tüm dökümandaki mouse hareketini dinle
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (isPlatformBrowser(this.platformId)) {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    }
  }

  loadFeaturedCommunities() {
    this.isLoading = true;
    setTimeout(() => {
      this.featuredCommunities = [
        { id: 1, name: 'Yapay Zeka Kulübü', category: 'Teknoloji', memberCount: 1250, eventCount: 45, isFeatured: true, image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop' },
        { id: 2, name: 'Girişimcilik Topluluğu', category: 'Kariyer', memberCount: 980, eventCount: 32, isFeatured: true, image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop' },
        { id: 3, name: 'Doğa Sporları', category: 'Spor', memberCount: 650, eventCount: 12, isFeatured: true, image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=800&auto=format&fit=crop' },
        { id: 4, name: 'Müzik Atölyesi', category: 'Sanat', memberCount: 820, eventCount: 28, isFeatured: true, image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop' },
        { id: 5, name: 'Siber Güvenlik', category: 'Teknoloji', memberCount: 1100, eventCount: 50, isFeatured: true, image: 'https://images.unsplash.com/photo-1563206767-5b1d97287374?q=80&w=800&auto=format&fit=crop' },
        { id: 6, name: 'Fotoğrafçılık Kulübü', category: 'Sanat', memberCount: 450, eventCount: 15, isFeatured: true, image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=800&auto=format&fit=crop' }
      ];
      this.isLoading = false;
    }, 1500);
  }

  goToCommunityDetail(id: number) { this.router.navigate(['/communities', id]); }
  startSlider() { this.slideInterval = setInterval(() => { this.nextSlide(); }, 6000); }
  nextSlide() { this.currentSlide = (this.currentSlide + 1) % this.slides.length; }
  setSlide(index: number) { this.currentSlide = index; if (isPlatformBrowser(this.platformId)) { clearInterval(this.slideInterval); this.startSlider(); } }
  toggleDropdown(type: 'category' | 'location') {
    if (type === 'category') { this.isCategoryOpen = !this.isCategoryOpen; this.isLocationOpen = false; } else { this.isLocationOpen = !this.isLocationOpen; this.isCategoryOpen = false; }
  }
  selectOption(type: 'category' | 'location', value: string) {
    if (type === 'category') { this.selectedCategory = value; this.isCategoryOpen = false; } else { this.selectedLocation = value; this.isLocationOpen = false; }
  }
  @HostListener('document:click', ['$event'])
  clickOutside(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) { this.isCategoryOpen = false; this.isLocationOpen = false; }
  }
  onSearch() {
    const queryParams: any = {};
    if (this.searchText?.trim()) queryParams.name = this.searchText.trim();
    if (this.selectedCategory) queryParams.category = this.selectedCategory;
    if (this.selectedLocation) queryParams.location = this.selectedLocation;
    this.router.navigate(['/events'], { queryParams: queryParams });
  }
}