import {
  Component,
  ElementRef,
  Input,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  NgZone,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

interface Neuron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulse: number;
  pulseSpeed: number;
}

@Component({
  selector: 'app-neurons-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas #canvas class="neurons-canvas"></canvas>
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
      .neurons-canvas {
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
    `,
  ],
})
export class NeuronsBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() nodeCount = 50;
  @Input() connectionDistance = 200;
  @Input() nodeColor = 'rgba(59, 130, 246, 0.4)'; // Soft blue
  @Input() lineColor = 'rgba(147, 197, 253, 0.3)'; // Light blue

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private neurons: Neuron[] = [];
  private animationFrameId: number | null = null;
  private onResize = () => this.resizeCanvas();

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.initCanvas();
      this.initNeurons();
      this.animate();
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', this.onResize);
      }
    });
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }
  }

  private initCanvas() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.resizeCanvas();
  }

  private resizeCanvas() {
    if (!isPlatformBrowser(this.platformId) || !this.canvas || !this.canvas.parentElement) return;
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.initNeurons();
  }

  private initNeurons() {
    if (!isPlatformBrowser(this.platformId) || !this.canvas) return;
    this.neurons = [];
    for (let i = 0; i < this.nodeCount; i++) {
      this.neurons.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        radius: 2 + Math.random() * 2,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.015,
      });
    }
  }

  private animate = () => {
    if (!isPlatformBrowser(this.platformId) || !this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update neurons
    this.updateNeurons();

    // Draw connections
    this.drawConnections();

    // Draw neurons
    this.drawNeurons();

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private updateNeurons() {
    if (!this.canvas) return;

    this.neurons.forEach((neuron) => {
      // Update position
      neuron.x += neuron.vx;
      neuron.y += neuron.vy;

      // Bounce off edges
      if (neuron.x < 0 || neuron.x > this.canvas.width) {
        neuron.vx *= -1;
        neuron.x = Math.max(0, Math.min(this.canvas.width, neuron.x));
      }
      if (neuron.y < 0 || neuron.y > this.canvas.height) {
        neuron.vy *= -1;
        neuron.y = Math.max(0, Math.min(this.canvas.height, neuron.y));
      }

      // Update pulse
      neuron.pulse += neuron.pulseSpeed;
      if (neuron.pulse > Math.PI * 2) neuron.pulse -= Math.PI * 2;

      // Damping for smooth movement
      neuron.vx *= 0.995;
      neuron.vy *= 0.995;
    });
  }

  private drawConnections() {
    if (!this.ctx) return;

    for (let i = 0; i < this.neurons.length; i++) {
      for (let j = i + 1; j < this.neurons.length; j++) {
        const n1 = this.neurons[i];
        const n2 = this.neurons[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.connectionDistance) {
          const opacity = (1 - distance / this.connectionDistance) * 0.4;
          
          // Gradient for connections (cyan to blue to purple)
          const gradient = this.ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
          const colorIndex = (i + j) % 3;
          if (colorIndex === 0) {
            // Cyan
            gradient.addColorStop(0, `rgba(34, 211, 238, ${opacity})`);
            gradient.addColorStop(1, `rgba(59, 130, 246, ${opacity * 0.7})`);
          } else if (colorIndex === 1) {
            // Blue
            gradient.addColorStop(0, `rgba(59, 130, 246, ${opacity})`);
            gradient.addColorStop(1, `rgba(139, 92, 246, ${opacity * 0.7})`);
          } else {
            // Purple
            gradient.addColorStop(0, `rgba(139, 92, 246, ${opacity})`);
            gradient.addColorStop(1, `rgba(34, 211, 238, ${opacity * 0.7})`);
          }

          this.ctx.strokeStyle = gradient;
          this.ctx.lineWidth = 1.5;
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = `rgba(59, 130, 246, ${opacity * 0.5})`;
          this.ctx.beginPath();
          this.ctx.moveTo(n1.x, n1.y);
          this.ctx.lineTo(n2.x, n2.y);
          this.ctx.stroke();
          this.ctx.shadowBlur = 0;
        }
      }
    }
  }

  private drawNeurons() {
    if (!this.ctx) return;

    this.neurons.forEach((neuron, index) => {
      // Pulsing effect - more subtle
      const pulseSize = 1 + Math.sin(neuron.pulse) * 0.2;
      const radius = neuron.radius * pulseSize;

      // Color variation - cyan, blue, purple
      const colorIndex = index % 3;
      let nodeColor = this.nodeColor;
      if (colorIndex === 0) {
        // Cyan
        nodeColor = 'rgba(34, 211, 238, 0.5)';
      } else if (colorIndex === 1) {
        // Blue
        nodeColor = 'rgba(59, 130, 246, 0.5)';
      } else {
        // Purple
        nodeColor = 'rgba(139, 92, 246, 0.4)';
      }

      // Outer glow
      const glowGradient = this.ctx.createRadialGradient(
        neuron.x,
        neuron.y,
        0,
        neuron.x,
        neuron.y,
        radius * 4
      );
      const glowOpacity = 0.15 * (1 + Math.sin(neuron.pulse) * 0.3);
      glowGradient.addColorStop(0, nodeColor.replace(/[\d.]+(?=\))/, (0.6 * pulseSize).toString()));
      glowGradient.addColorStop(0.4, nodeColor.replace(/[\d.]+(?=\))/, (0.3 * pulseSize).toString()));
      glowGradient.addColorStop(1, nodeColor.replace(/[\d.]+(?=\))/, '0'));

      // Draw glow
      this.ctx.fillStyle = glowGradient;
      this.ctx.beginPath();
      this.ctx.arc(neuron.x, neuron.y, radius * 4, 0, Math.PI * 2);
      this.ctx.fill();

      // Core node
      const coreGradient = this.ctx.createRadialGradient(
        neuron.x,
        neuron.y,
        0,
        neuron.x,
        neuron.y,
        radius * 2
      );
      coreGradient.addColorStop(0, nodeColor.replace(/[\d.]+(?=\))/, (0.9 * pulseSize).toString()));
      coreGradient.addColorStop(1, nodeColor.replace(/[\d.]+(?=\))/, '0'));

      this.ctx.fillStyle = coreGradient;
      this.ctx.beginPath();
      this.ctx.arc(neuron.x, neuron.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}
