import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface CodeChar {
  char: string;
  y: number;
  speed: number;
  changeInterval: number;
  lastChange: number;
}

interface CodeColumn {
  x: number;
  chars: CodeChar[];
  height: number;
  speed: number;
  nextChange: number;
}

@Component({
  selector: 'app-code-stream',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #canvas class="code-canvas"></canvas>
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
      .code-canvas {
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
    `,
  ],
})
export class CodeStreamComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private columns: CodeColumn[] = [];
  private fontSize = 16;
  private columnWidth = 24; // Daha az sütun, daha iyi performans
  private chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
  private numbers = '0123456789';
  private names = ['UNIDES', 'CODE', 'TEAM', 'DEV', 'API', 'REACT', 'ANGULAR', 'NODE', 'TYPESCRIPT', 'JAVASCRIPT', 'JSON', 'HTML', 'CSS', 'JS', 'TS'];
  private dataStrings = ['function', 'const', 'let', 'class', 'import', 'export', 'return', 'async', 'await', 'promise', 'interface', 'type', 'var', 'if', 'else', 'for', 'while', 'switch', 'case'];
  private frameCount = 0;

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;

    if (!this.ctx) return;

    this.resize();
    setTimeout(() => {
      this.initColumns();
      this.animate();
    }, 100);

    window.addEventListener('resize', this.resize);
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.resize);
  }

  private resize = () => {
    if (!this.canvas) return;

    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;
    
    this.canvas.width = width;
    this.canvas.height = height;

    if (width > 0 && height > 0) {
      this.columns = [];
      this.initColumns();
    }
  };

  private getRandomChar(): string {
    if (Math.random() < 0.35) {
      return this.numbers[Math.floor(Math.random() * this.numbers.length)];
    }
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }

  private getRandomText(): string {
    // More frequently show names/data strings (30% chance)
    if (Math.random() < 0.3) {
      const allStrings = [...this.names, ...this.dataStrings];
      return allStrings[Math.floor(Math.random() * allStrings.length)];
    }
    // Random character
    return this.getRandomChar();
  }

  private initColumns(): void {
    if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;

    const columnCount = Math.floor(this.canvas.width / this.columnWidth);
    this.columns = [];

    for (let i = 0; i < columnCount; i++) {
      const x = i * this.columnWidth + this.columnWidth / 2;
      const height = Math.floor(Math.random() * 15) + 12; // Daha kısa sütunlar
      const speed = 1.5 + Math.random() * 2; // Daha hızlı
      const chars: CodeChar[] = [];

      // Create initial characters
      for (let j = 0; j < height; j++) {
        chars.push({
          char: this.getRandomText(),
          y: -height * this.fontSize + j * this.fontSize,
          speed,
          changeInterval: 30 + Math.random() * 50,
          lastChange: Math.random() * 100,
        });
      }

      this.columns.push({
        x,
        chars,
        height,
        speed,
        nextChange: Math.random() * 50 + 30, // Daha az sıklıkta değişim
      });
    }
  }

  private getColorForPosition(yPosition: number, canvasHeight: number): { r: number; g: number; b: number } {
    // Calculate position ratio (0 = top, 1 = bottom)
    const ratio = Math.max(0, Math.min(1, yPosition / canvasHeight));
    
    // Top: Bright electric blue
    // Middle: Transition blue to purple
    // Bottom: Vibrant magenta/fuchsia
    
    if (ratio < 0.3) {
      // Top 30%: Bright electric blue
      const t = ratio / 0.3;
      return {
        r: Math.floor(100 + t * 60),   // 100 -> 160 (bright blue)
        g: Math.floor(200 - t * 40),   // 200 -> 160
        b: Math.floor(255 - t * 50),   // 255 -> 205
      };
    } else if (ratio < 0.65) {
      // Middle 35%: Transition blue to purple
      const t = (ratio - 0.3) / 0.35;
      return {
        r: Math.floor(160 + t * 80),   // 160 -> 240
        g: Math.floor(160 - t * 90),   // 160 -> 70
        b: Math.floor(205 - t * 50),   // 205 -> 155
      };
    } else {
      // Bottom 35%: Vibrant magenta/fuchsia
      const t = (ratio - 0.65) / 0.35;
      return {
        r: Math.floor(240 + t * 15),   // 240 -> 255 (vibrant magenta)
        g: Math.floor(70 + t * 30),    // 70 -> 100
        b: Math.floor(155 + t * 100),  // 155 -> 255 (fuchsia)
      };
    }
  }

  private animate = () => {
    if (!this.ctx || !this.canvas || this.canvas.width === 0 || this.canvas.height === 0) {
      this.animationFrameId = requestAnimationFrame(this.animate);
      return;
    }

    this.frameCount++;

    // Very dark background for trail effect - optimized
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.font = `${this.fontSize}px 'Courier New', monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    // Update and draw columns
    this.columns.forEach((column) => {
      // Randomly change characters in column (Matrix effect) - optimized
      if (this.frameCount >= column.nextChange) {
        // Change single character for better performance
        const randomIndex = Math.floor(Math.random() * column.chars.length);
        if (randomIndex < column.chars.length) {
          column.chars[randomIndex].char = this.getRandomText();
          column.chars[randomIndex].lastChange = this.frameCount;
        }
        column.nextChange = this.frameCount + Math.random() * 40 + 30;
      }

      // Update and draw each character in column
      column.chars.forEach((charObj, charIndex) => {
        // Update position
        charObj.y += charObj.speed;

        // Calculate position in canvas (0 = top, 1 = bottom) - simplified
        const normalizedY = charObj.y / this.canvas.height;
        const color = this.getColorForPosition(charObj.y, this.canvas.height);

        // Simplified opacity calculation
        let opacity = 1;
        const relativePos = (charObj.y % (column.height * this.fontSize)) / (column.height * this.fontSize);
        
        if (relativePos < 0.15) {
          opacity = 0.9;
        } else if (relativePos < 0.5) {
          opacity = 0.75;
        } else {
          const t = (relativePos - 0.5) / 0.5;
          opacity = 0.75 - t * 0.6;
        }
        opacity = Math.max(0.2, Math.min(1, opacity));

        // Draw character if visible - simplified rendering
        if (charObj.y > -this.fontSize && charObj.y < this.canvas.height + this.fontSize) {
          // Simple glow for top characters only
          if (opacity > 0.7 && relativePos < 0.2) {
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`;
          } else {
            this.ctx.shadowBlur = 0;
          }

          this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
          this.ctx.fillText(charObj.char, column.x, charObj.y);
          this.ctx.shadowBlur = 0;
        }

        // Reset character when it goes off screen
        if (charObj.y > this.canvas.height + this.fontSize) {
          charObj.y = -column.height * this.fontSize;
          charObj.char = this.getRandomText();
          charObj.lastChange = this.frameCount;
        }
      });
    });

    this.animationFrameId = requestAnimationFrame(this.animate);
  };
}
