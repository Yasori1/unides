import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  Input,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface CodeChar {
  char: string;
  y: number;
  speed: number;
  opacity: number;
  isDeveloperName: boolean;
  colorIndex: number;
}

interface CodeColumn {
  x: number;
  chars: CodeChar[];
  height: number;
  speed: number;
  nextChange: number;
}

@Component({
  selector: 'app-developer-stream',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #canvas class="developer-canvas"></canvas>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 0;
      }
      .developer-canvas {
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
    `,
  ],
})
export class DeveloperStreamComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() developerNames: string[] = [];

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private columns: CodeColumn[] = [];
  private fontSize = 16;
  private columnWidth = 28;
  private frameCount = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Matrix tarzı karakterler
  private chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
  private numbers = '0123456789';
  private symbols = '@#$%^&*()_+-=[]{}|;:,.<>?';

  // Matrix tarzı renkler - siteye uygun ama Matrix görünümü
  private colors = [
    { r: 0, g: 255, b: 150 },    // Parlak Cyan/Green (Matrix tarzı)
    { r: 0, g: 200, b: 255 },     // Parlak Cyan Blue
    { r: 100, g: 255, b: 200 },   // Açık Turquoise
    { r: 0, g: 255, b: 100 },     // Parlak Green
    { r: 150, g: 100, b: 255 },   // Parlak Purple
    { r: 100, g: 150, b: 255 },   // Parlak Blue
  ];

  // Geliştirici isimleri için daha açık/silik renkler (Matrix tarzı ama silik)
  private developerColors = [
    { r: 100, g: 116, b: 139 },  // Slate 500 - silik
    { r: 71, g: 85, b: 105 },    // Slate 600 - daha silik
    { r: 51, g: 65, b: 85 },     // Slate 700 - çok silik
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;

    if (!this.ctx) return;

    this.resize();
    setTimeout(() => {
      this.initColumns();
      this.animate();
    }, 100);

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resize);
    }
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resize);
    }
  }

  private resize = () => {
    if (!this.canvas || !isPlatformBrowser(this.platformId)) return;

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || (typeof window !== 'undefined' ? window.innerWidth : 0);
    const height = rect.height || (typeof window !== 'undefined' ? window.innerHeight : 0);
    
    this.canvas.width = width;
    this.canvas.height = height;

    if (width > 0 && height > 0) {
      this.columns = [];
      this.initColumns();
    }
  };

  private getRandomChar(): string {
    if (Math.random() < 0.4) {
      return this.numbers[Math.floor(Math.random() * this.numbers.length)];
    }
    if (Math.random() < 0.2) {
      return this.symbols[Math.floor(Math.random() * this.symbols.length)];
    }
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }

  private getRandomDeveloperName(): string {
    const names = this.developerNames.length > 0 
      ? this.developerNames 
      : ['Safa G.', 'Elif Y.', 'Caner K.', 'Zeynep S.', 'Murat D.', 'Ayşe T.', 'Burak Y.', 'Selin D.', 'Oğuzhan K.', 'Fatma A.', 'Emre V.', 'Gamze Ö.', 'Hakan Ç.', 'İrem B.', 'Kaan L.', 'Leyla M.'];
    
    return names[Math.floor(Math.random() * names.length)];
  }

  private initColumns(): void {
    if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;

    const columnCount = Math.floor(this.canvas.width / this.columnWidth);
    this.columns = [];

    for (let i = 0; i < columnCount; i++) {
      const x = i * this.columnWidth + this.columnWidth / 2;
      const height = Math.floor(Math.random() * 20) + 15;
      const speed = 1.2 + Math.random() * 1.5;
      const chars: CodeChar[] = [];

      // Her sütunda geliştirici ismi olma şansı %20 (daha fazla görünsün)
      const hasDeveloperName = Math.random() < 0.2;
      let developerNameIndex = -1;
      if (hasDeveloperName) {
        // Geliştirici ismini sütunun ortasına yakın bir yere koy (daha görünür olsun)
        developerNameIndex = Math.floor(height * (0.3 + Math.random() * 0.4));
      }

      for (let j = 0; j < height; j++) {
        const isDeveloperName = hasDeveloperName && j === developerNameIndex;
        chars.push({
          char: isDeveloperName ? this.getRandomDeveloperName() : this.getRandomChar(),
          y: -height * this.fontSize + j * this.fontSize,
          speed,
          opacity: 0,
          isDeveloperName,
          colorIndex: Math.floor(Math.random() * this.colors.length),
        });
      }

      this.columns.push({
        x,
        chars,
        height,
        speed,
        nextChange: Math.random() * 50 + 30,
      });
    }
  }

  private getColorForChar(charObj: CodeChar): { r: number; g: number; b: number } {
    if (charObj.isDeveloperName) {
      // Geliştirici isimleri için silik renkler
      return this.developerColors[charObj.colorIndex % this.developerColors.length];
    }
    // Normal karakterler için parlak renkler
    return this.colors[charObj.colorIndex % this.colors.length];
  }

  private animate = () => {
    if (!isPlatformBrowser(this.platformId) || !this.ctx || !this.canvas || this.canvas.width === 0 || this.canvas.height === 0) {
      if (isPlatformBrowser(this.platformId)) {
        this.animationFrameId = requestAnimationFrame(this.animate);
      }
      return;
    }

    this.frameCount++;

    // Siyah arkaplan - trail effect yok, sadece temiz siyah
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = `${this.fontSize}px 'Courier New', monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    // Update and draw columns
    this.columns.forEach((column) => {
      // Randomly change characters in column
      if (this.frameCount >= column.nextChange) {
        const randomIndex = Math.floor(Math.random() * column.chars.length);
        if (randomIndex < column.chars.length) {
          const charObj = column.chars[randomIndex];
          if (!charObj.isDeveloperName) {
            charObj.char = this.getRandomChar();
          }
        }
        column.nextChange = this.frameCount + Math.random() * 40 + 30;
      }

      // Update and draw each character in column
      column.chars.forEach((charObj) => {
        // Update position
        charObj.y += charObj.speed;

        // Matrix efekti: Sütun içindeki pozisyona göre opacity
        // Üstteki karakterler parlak, aşağıdakiler soluk
        const columnHeight = column.height * this.fontSize;
        const charPosInColumn = ((charObj.y % columnHeight) + columnHeight) % columnHeight;
        const relativePos = charPosInColumn / columnHeight; // 0 (üst) -> 1 (alt)
        
        // Üstte parlak (opacity 1), aşağıya indikçe soluyor
        // Matrix tarzı: en üstteki karakter en parlak, en alttaki en soluk
        charObj.opacity = 1 - relativePos * 0.95; // 1 -> 0.05 arası
        
        // Canvas pozisyonuna göre de fade out (ekranın altına yaklaştıkça)
        const canvasRelativeY = charObj.y / this.canvas.height;
        if (canvasRelativeY > 0.85) {
          // Ekranın alt %15'inde hızlı fade out
          const fadeOut = (canvasRelativeY - 0.85) / 0.15;
          charObj.opacity *= Math.max(0, 1 - fadeOut);
        }

        // Geliştirici isimleri daha silik
        if (charObj.isDeveloperName) {
          charObj.opacity *= 0.4; // Çok daha silik
        }

        // Draw character if visible
        if (charObj.y > -this.fontSize && charObj.y < this.canvas.height + this.fontSize && charObj.opacity > 0.05) {
          let color = this.getColorForChar(charObj);
          
          // Renkleri de opacity ile birlikte soluyor (Matrix efekti)
          // Üstteki karakterler parlak renkler, aşağıdakiler soluk
          const brightness = charObj.opacity;
          color = {
            r: Math.floor(color.r * brightness),
            g: Math.floor(color.g * brightness),
            b: Math.floor(color.b * brightness),
          };
          
          // Geliştirici isimleri için daha küçük font
          if (charObj.isDeveloperName) {
            this.ctx.font = `${this.fontSize - 2}px 'Courier New', monospace`;
          } else {
            this.ctx.font = `${this.fontSize}px 'Courier New', monospace`;
          }

          // Üstteki parlak karakterler için glow efekti
          if (!charObj.isDeveloperName && charObj.opacity > 0.8) {
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${charObj.opacity * 0.5})`;
          } else {
            this.ctx.shadowBlur = 0;
          }

          this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${charObj.opacity})`;
          this.ctx.fillText(charObj.char, column.x, charObj.y);
          this.ctx.shadowBlur = 0;
        }

        // Reset character when it goes off screen
        if (charObj.y > this.canvas.height + this.fontSize) {
          charObj.y = -column.height * this.fontSize;
          
          // Geliştirici ismi değiştirme şansı
          if (charObj.isDeveloperName) {
            charObj.char = this.getRandomDeveloperName();
          } else {
            charObj.char = this.getRandomChar();
            // Bazen geliştirici ismine dönüş
            if (Math.random() < 0.1) {
              charObj.isDeveloperName = true;
              charObj.char = this.getRandomDeveloperName();
            }
          }
          
          charObj.colorIndex = Math.floor(Math.random() * (charObj.isDeveloperName ? this.developerColors.length : this.colors.length));
        }
      });
    });

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
