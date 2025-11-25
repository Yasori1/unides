import {
  Component,
  ElementRef,
  Input,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-card.html',
  styleUrls: ['./profile-card.scss'],
})
export class ProfileCardComponent implements AfterViewInit, OnDestroy {
  @Input() name: string = 'Developer Name';
  @Input() title: string = 'Role';
  @Input() enableTilt: boolean = true;

  // Görsel efekt ayarları (Açık tema için güncellendi)
  @Input() innerGradient: string = 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)';
  @Input() behindGlowColor: string = 'rgba(59, 130, 246, 0.15)'; // Çok hafif mavi
  @Input() behindGlowSize: string = '60%';

  @ViewChild('wrapper') wrapperRef!: ElementRef<HTMLDivElement>;
  @ViewChild('shell') shellRef!: ElementRef<HTMLDivElement>;

  private tiltEngine: any;
  private enterTimer: any;
  private leaveRaf: any;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    if (this.enableTilt) {
      this.initTiltEngine();
      this.addEventListeners();
    }
  }

  ngOnDestroy() {
    this.removeEventListeners();
    if (this.tiltEngine) this.tiltEngine.cancel();
    if (this.enterTimer) clearTimeout(this.enterTimer);
    if (this.leaveRaf) cancelAnimationFrame(this.leaveRaf);
  }

  get cardStyle() {
    return {
      '--inner-gradient': this.innerGradient,
      '--behind-glow-color': this.behindGlowColor,
      '--behind-glow-size': this.behindGlowSize,
    };
  }

  private initTiltEngine() {
    const ANIMATION_CONFIG = {
      INITIAL_DURATION: 1200,
      INITIAL_X_OFFSET: 70,
      INITIAL_Y_OFFSET: 60,
      ENTER_TRANSITION_MS: 500, // Çok yumuşak geçiş
    };

    const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
    const round = (v: number, precision = 3) => parseFloat(v.toFixed(precision));
    const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
      round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let initialUntil = 0;

    const DEFAULT_TAU = 0.15; // Yavaş takip
    const INITIAL_TAU = 0.6;

    const setVarsFromXY = (x: number, y: number) => {
      const shell = this.shellRef.nativeElement;
      const wrap = this.wrapperRef.nativeElement;
      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;

      // Hareketi iyice kısıtladık (/35)
      const rotateX = round(-(centerY / 35));
      const rotateY = round(centerX / 35);

      const properties: any = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 40, 60)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 40, 60)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${rotateX}deg`,
        '--rotate-y': `${rotateY}deg`,
      };

      for (const [k, v] of Object.entries(properties)) {
        wrap.style.setProperty(k, v as string);
      }
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      setVarsFromXY(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;

      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    this.tiltEngine = {
      setTarget: (x: number, y: number) => {
        targetX = x;
        targetY = y;
        if (!running) {
          running = true;
          lastTs = 0;
          this.ngZone.runOutsideAngular(() => {
            rafId = requestAnimationFrame(step);
          });
        }
      },
      toCenter: () => {
        const shell = this.shellRef.nativeElement;
        this.tiltEngine.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      setImmediate: (x: number, y: number) => {
        currentX = x;
        currentY = y;
        setVarsFromXY(x, y);
      },
      getCurrent: () => ({ x: currentX, y: currentY, tx: targetX, ty: targetY }),
      cancel: () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
      },
    };

    const shell = this.shellRef.nativeElement;
    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    this.tiltEngine.setImmediate(initialX, initialY);
    this.tiltEngine.toCenter();
    initialUntil = performance.now() + ANIMATION_CONFIG.INITIAL_DURATION;
  }

  private addEventListeners() {
    const shell = this.shellRef.nativeElement;
    this.ngZone.runOutsideAngular(() => {
      shell.addEventListener('pointerenter', this.handlePointerEnter.bind(this));
      shell.addEventListener('pointermove', this.handlePointerMove.bind(this));
      shell.addEventListener('pointerleave', this.handlePointerLeave.bind(this));
    });
  }

  private removeEventListeners() {
    if (!this.shellRef) return;
    const shell = this.shellRef.nativeElement;
    shell.removeEventListener('pointerenter', this.handlePointerEnter.bind(this));
    shell.removeEventListener('pointermove', this.handlePointerMove.bind(this));
    shell.removeEventListener('pointerleave', this.handlePointerLeave.bind(this));
  }

  private getOffsets(evt: PointerEvent) {
    const rect = this.shellRef.nativeElement.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  }

  private handlePointerEnter(event: any) {
    const shell = this.shellRef.nativeElement;
    shell.classList.add('active', 'entering');

    if (this.enterTimer) clearTimeout(this.enterTimer);
    this.enterTimer = setTimeout(() => {
      shell.classList.remove('entering');
    }, 180);

    const { x, y } = this.getOffsets(event);
    this.tiltEngine.setTarget(x, y);
  }

  private handlePointerMove(event: any) {
    const { x, y } = this.getOffsets(event);
    this.tiltEngine.setTarget(x, y);
  }

  private handlePointerLeave() {
    const shell = this.shellRef.nativeElement;
    this.tiltEngine.toCenter();

    const checkSettle = () => {
      const { x, y, tx, ty } = this.tiltEngine.getCurrent();
      const settled = Math.hypot(tx - x, ty - y) < 0.6;
      if (settled) {
        shell.classList.remove('active');
        this.leaveRaf = null;
      } else {
        this.leaveRaf = requestAnimationFrame(checkSettle);
      }
    };
    if (this.leaveRaf) cancelAnimationFrame(this.leaveRaf);
    this.leaveRaf = requestAnimationFrame(checkSettle);
  }
}
