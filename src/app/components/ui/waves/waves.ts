import {
  Component,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  NgZone,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { createNoise2D } from 'simplex-noise';

interface Point {
  x: number;
  y: number;
  wave: { x: number; y: number };
  cursor: { x: number; y: number; vx: number; vy: number };
}

@Component({
  selector: 'app-waves',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container class="waves-container" [style.background-color]="backgroundColor">
      <svg #svg class="waves-svg" xmlns="http://www.w3.org/2000/svg"></svg>
      <div class="pointer-dot" [ngStyle]="getDotStyle()"></div>
    </div>
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
      .waves-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
        --x: 0px;
        --y: 0px;
      }
      .waves-svg {
        display: block;
        width: 100%;
        height: 100%;
      }
      .pointer-dot {
        position: absolute;
        top: 0;
        left: 0;
        width: 0.5rem;
        height: 0.5rem;
        background: white;
        border-radius: 50%;
        transform: translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0);
        will-change: transform;
        pointer-events: none;
        transition: width 0.2s, height 0.2s;
      }
    `,
  ],
})
export class WavesComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('svg') svgRef!: ElementRef<SVGElement>;

  @Input() strokeColor = '#000000';
  @Input() backgroundColor = '#ffffff';
  @Input() pointerSize = 0.5;

  private noise = createNoise2D();
  private lines: Point[][] = [];
  private paths: SVGPathElement[] = [];
  private rafId: number | null = null;
  private mouse = {
    x: -10,
    y: 0,
    lx: 0,
    ly: 0,
    sx: 0,
    sy: 0,
    v: 0,
    vs: 0,
    a: 0,
    set: false,
  };
  private bounding: DOMRect | null = null;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => {
      this.initWaves();
      this.addEventListeners();
      this.loop();
    });
  }

  ngOnDestroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.removeEventListeners();
  }

  private initWaves() {
    this.setSize();
    this.setLines();
  }

  private setSize() {
    if (!this.containerRef) return;
    this.bounding = this.containerRef.nativeElement.getBoundingClientRect();
  }

  private setLines() {
    if (!this.svgRef || !this.bounding) return;

    const { width, height } = this.bounding;
    this.lines = [];
    this.paths = [];

    while (this.svgRef.nativeElement.firstChild) {
      this.svgRef.nativeElement.removeChild(this.svgRef.nativeElement.firstChild);
    }

    const xGap = 10;
    const yGap = 30;
    const oWidth = width + 200;
    const oHeight = height + 30;
    const totalLines = Math.ceil(oWidth / xGap);
    const totalPoints = Math.ceil(oHeight / yGap);
    const xStart = (width - xGap * totalLines) / 2;
    const yStart = (height - yGap * totalPoints) / 2;

    for (let i = 0; i < totalLines; i++) {
      const points: Point[] = [];
      for (let j = 0; j < totalPoints; j++) {
        points.push({
          x: xStart + xGap * i,
          y: yStart + yGap * j,
          wave: { x: 0, y: 0 },
          cursor: { x: 0, y: 0, vx: 0, vy: 0 },
        });
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', this.strokeColor);
      path.setAttribute('stroke-width', '1');

      this.svgRef.nativeElement.appendChild(path);
      this.paths.push(path);
      this.lines.push(points);
    }
  }

  private loop = (time: number = 0) => {
    this.updateMouse();
    this.updatePoints(time);
    this.drawLines();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private updateMouse() {
    this.mouse.sx += (this.mouse.x - this.mouse.sx) * 0.1;
    this.mouse.sy += (this.mouse.y - this.mouse.sy) * 0.1;

    const dx = this.mouse.x - this.mouse.lx;
    const dy = this.mouse.y - this.mouse.ly;
    const d = Math.hypot(dx, dy);

    this.mouse.v = d;
    this.mouse.vs += (d - this.mouse.vs) * 0.1;
    this.mouse.vs = Math.min(100, this.mouse.vs);

    this.mouse.lx = this.mouse.x;
    this.mouse.ly = this.mouse.y;
    this.mouse.a = Math.atan2(dy, dx);

    if (this.containerRef) {
      this.containerRef.nativeElement.style.setProperty('--x', `${this.mouse.sx}px`);
      this.containerRef.nativeElement.style.setProperty('--y', `${this.mouse.sy}px`);
    }
  }

  private updatePoints(time: number) {
    this.lines.forEach((points) => {
      points.forEach((p) => {
        const move = this.noise((p.x + time * 0.008) * 0.003, (p.y + time * 0.003) * 0.002) * 8;
        p.wave.x = Math.cos(move) * 12;
        p.wave.y = Math.sin(move) * 6;

        const dx = p.x - this.mouse.sx;
        const dy = p.y - this.mouse.sy;
        const d = Math.hypot(dx, dy);
        const l = Math.max(175, this.mouse.vs);

        if (d < l) {
          const s = 1 - d / l;
          const f = Math.cos(d * 0.001) * s;
          p.cursor.vx += Math.cos(this.mouse.a) * f * l * this.mouse.vs * 0.00035;
          p.cursor.vy += Math.sin(this.mouse.a) * f * l * this.mouse.vs * 0.00035;
        }

        p.cursor.vx += (0 - p.cursor.x) * 0.01;
        p.cursor.vy += (0 - p.cursor.y) * 0.01;
        p.cursor.vx *= 0.95;
        p.cursor.vy *= 0.95;

        p.cursor.x += p.cursor.vx;
        p.cursor.y += p.cursor.vy;
      });
    });
  }

  private drawLines() {
    this.lines.forEach((points, i) => {
      let d = '';
      points.forEach((p, j) => {
        const x = p.x + p.wave.x + p.cursor.x;
        const y = p.y + p.wave.y + p.cursor.y;
        d += j === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      });
      this.paths[i].setAttribute('d', d);
    });
  }

  private onResize = () => {
    this.setSize();
    this.setLines();
  };

  private onMouseMove = (e: MouseEvent) => {
    // DÜZELTME: Scroll yapıldığında farenin doğru konumunu almak için her harekette rect hesaplıyoruz.
    if (!this.containerRef) return;
    const rect = this.containerRef.nativeElement.getBoundingClientRect();

    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;

    if (!this.mouse.set) {
      this.mouse.sx = this.mouse.x;
      this.mouse.sy = this.mouse.y;
      this.mouse.set = true;
    }
  };

  private addEventListeners() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
  }

  private removeEventListeners() {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
  }

  getDotStyle() {
    return {
      width: `${this.pointerSize}rem`,
      height: `${this.pointerSize}rem`,
      background: this.strokeColor,
    };
  }
}
