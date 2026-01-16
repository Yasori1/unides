import "./chunk-XFJW3PKC.js";
import {
  animate,
  state,
  style,
  transition,
  trigger
} from "./chunk-FEKJ5PAW.js";
import {
  CommonModule,
  NgStyle
} from "./chunk-MCOA44J4.js";
import "./chunk-WOQ47UI3.js";
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  NgModule,
  Output,
  ViewChild,
  setClassMetadata,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵdefineComponent,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵinterpolate1,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵresolveWindow,
  ɵɵstyleProp,
  ɵɵviewQuery
} from "./chunk-VFSAWEOH.js";
import "./chunk-RSS3ODKE.js";
import "./chunk-WDMUDEB6.js";

// node_modules/@ctrl/ngx-headroom/fesm2020/ctrl-ngx-headroom.mjs
var _c0 = ["ref"];
var _c1 = ["*"];
var _c2 = (a0, a1) => ({
  duration: a0,
  easing: a1
});
var _c3 = (a0, a1) => ({
  value: a0,
  params: a1
});
function shouldUpdate(lastKnownScrollY = 0, currentScrollY = 0, disable, pinStart, downTolerance, upTolerance, state2, height) {
  const scrollDirection = currentScrollY >= lastKnownScrollY ? "down" : "up";
  const distanceScrolled = Math.abs(currentScrollY - lastKnownScrollY);
  if (disable) {
    return {
      action: "none",
      scrollDirection,
      distanceScrolled
    };
  } else if (currentScrollY <= pinStart && state2 !== "unfixed") {
    return {
      action: "unfix",
      scrollDirection,
      distanceScrolled
    };
  } else if (currentScrollY <= height && scrollDirection === "down" && state2 === "unfixed") {
    return {
      action: "none",
      scrollDirection,
      distanceScrolled
    };
  } else if (scrollDirection === "down" && ["pinned", "unfixed"].indexOf(state2) >= 0 && currentScrollY > height + pinStart && distanceScrolled > downTolerance) {
    return {
      action: "unpin",
      scrollDirection,
      distanceScrolled
    };
  } else if (scrollDirection === "up" && distanceScrolled > upTolerance && ["pinned", "unfixed"].indexOf(state2) < 0) {
    return {
      action: "pin",
      scrollDirection,
      distanceScrolled
    };
  } else if (scrollDirection === "up" && currentScrollY <= height && ["pinned", "unfixed"].indexOf(state2) < 0) {
    return {
      action: "pin",
      scrollDirection,
      distanceScrolled
    };
  } else {
    return {
      action: "none",
      scrollDirection,
      distanceScrolled
    };
  }
}
var HeadroomComponent = class {
  constructor(document) {
    this.document = document;
    this.wrapperClassName = "";
    this.innerClassName = "";
    this.innerStyle = {
      top: "0",
      left: "0",
      right: "0",
      zIndex: "1",
      position: "relative"
    };
    this.wrapperStyle = {};
    this.disable = false;
    this.upTolerance = 5;
    this.downTolerance = 0;
    this.pinStart = 0;
    this.calcHeightOnResize = true;
    this.duration = 200;
    this.easing = "ease-in-out";
    this.pin = new EventEmitter();
    this.unpin = new EventEmitter();
    this.unfix = new EventEmitter();
    this.wrapperHeight = 0;
    this.currentScrollY = 0;
    this.lastKnownScrollY = 0;
    this.scrolled = false;
    this.resizeTicking = false;
    this.state = "unfixed";
    this.translateY = "0px";
    this.scrollTicking = false;
  }
  scroll() {
    this.handleScroll();
  }
  resize() {
    this.handleResize();
  }
  ngOnInit() {
    this.innerStyle.transform = `translateY(${this.translateY})`;
    if (this.disable === true) {
      this.handleUnfix();
    }
  }
  getParent() {
    if (this.parent) {
      return this.parent();
    }
    if (this.document.documentElement && this.document.documentElement.scrollTop) {
      return this.document.documentElement;
    }
    if (this.document.body && this.document.body.scrollTop) {
      return this.document.body;
    }
    if (this.document.body && this.document.body.parentNode.scrollTop) {
      return this.document.body.parentNode;
    }
    return this.document;
  }
  ngAfterContentInit() {
    this.setHeightOffset();
    this.wrapperHeight = this.height ? this.height : null;
  }
  setHeightOffset() {
    this.height = null;
    setTimeout(() => {
      this.height = this.inner.nativeElement.offsetHeight;
      this.resizeTicking = false;
    }, 0);
  }
  getScrollY() {
    if (this.getParent().pageYOffset !== void 0) {
      return this.getParent().pageYOffset;
    }
    return this.getParent().scrollTop || 0;
  }
  getViewportHeight() {
    return this.getParent().innerHeight || this.document.documentElement.clientHeight || this.document.body.clientHeight;
  }
  getDocumentHeight() {
    const body = this.document.body;
    const documentElement = this.document.documentElement;
    return Math.max(body.scrollHeight, documentElement.scrollHeight, body.offsetHeight, documentElement.offsetHeight, body.clientHeight, documentElement.clientHeight);
  }
  getElementPhysicalHeight(elm) {
    return Math.max(elm.offsetHeight, elm.clientHeight);
  }
  getElementHeight(elm) {
    return Math.max(elm.scrollHeight, elm.offsetHeight, elm.clientHeight);
  }
  getScrollerPhysicalHeight() {
    const parent = this.getParent();
    return parent === this.getParent() || parent === this.document.body ? this.getViewportHeight() : this.getElementPhysicalHeight(parent);
  }
  getScrollerHeight() {
    const parent = this.getParent();
    return parent === this.getParent() || parent === this.document.body ? this.getDocumentHeight() : this.getElementHeight(parent);
  }
  isOutOfBound(currentScrollY) {
    const pastTop = currentScrollY < 0;
    const scrollerPhysicalHeight = this.getScrollerPhysicalHeight();
    const scrollerHeight = this.getScrollerHeight();
    const pastBottom = currentScrollY + scrollerPhysicalHeight > scrollerHeight;
    return pastTop || pastBottom;
  }
  handleScroll() {
    if (this.disable) {
      return;
    }
    if (!this.scrollTicking) {
      this.scrollTicking = true;
      this.update();
    }
  }
  handleResize() {
    if (this.disable || !this.calcHeightOnResize) {
      return;
    }
    if (!this.resizeTicking) {
      this.resizeTicking = true;
      this.setHeightOffset();
    }
  }
  handleUnpin() {
    this.unpin.emit();
    this.state = "unpinned";
    this.innerStyle.position = this.disable || this.state === "unfixed" ? "relative" : "fixed";
  }
  handlePin() {
    this.pin.emit();
    this.state = "pinned";
    this.innerStyle.position = this.disable || this.state === "unfixed" ? "relative" : "fixed";
  }
  handleUnfix() {
    this.unfix.emit();
    this.state = "unfixed";
    this.innerStyle.position = this.disable || this.state === "unfixed" ? "relative" : "fixed";
  }
  update() {
    this.currentScrollY = this.getScrollY();
    if (!this.isOutOfBound(this.currentScrollY)) {
      const {
        action
      } = shouldUpdate(this.lastKnownScrollY, this.currentScrollY, this.disable, this.pinStart, this.downTolerance, this.upTolerance, this.state, this.height);
      if (action === "pin") {
        this.handlePin();
      } else if (action === "unpin") {
        this.handleUnpin();
      } else if (action === "unfix") {
        this.handleUnfix();
      }
    }
    this.lastKnownScrollY = this.currentScrollY;
    this.scrollTicking = false;
  }
};
HeadroomComponent.ɵfac = function HeadroomComponent_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || HeadroomComponent)(ɵɵdirectiveInject(DOCUMENT));
};
HeadroomComponent.ɵcmp = ɵɵdefineComponent({
  type: HeadroomComponent,
  selectors: [["ngx-headroom"]],
  viewQuery: function HeadroomComponent_Query(rf, ctx) {
    if (rf & 1) {
      ɵɵviewQuery(_c0, 7);
    }
    if (rf & 2) {
      let _t;
      ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.inner = _t.first);
    }
  },
  hostBindings: function HeadroomComponent_HostBindings(rf, ctx) {
    if (rf & 1) {
      ɵɵlistener("scroll", function HeadroomComponent_scroll_HostBindingHandler() {
        return ctx.scroll();
      }, ɵɵresolveWindow)("resize", function HeadroomComponent_resize_HostBindingHandler() {
        return ctx.resize();
      }, ɵɵresolveWindow);
    }
  },
  inputs: {
    wrapperClassName: "wrapperClassName",
    innerClassName: "innerClassName",
    innerStyle: "innerStyle",
    wrapperStyle: "wrapperStyle",
    disable: "disable",
    upTolerance: "upTolerance",
    downTolerance: "downTolerance",
    pinStart: "pinStart",
    calcHeightOnResize: "calcHeightOnResize",
    duration: "duration",
    easing: "easing",
    parent: "parent",
    scroll: "scroll",
    resize: "resize"
  },
  outputs: {
    pin: "pin",
    unpin: "unpin",
    unfix: "unfix"
  },
  standalone: false,
  ngContentSelectors: _c1,
  decls: 4,
  vars: 26,
  consts: [["ref", ""], [3, "ngStyle"]],
  template: function HeadroomComponent_Template(rf, ctx) {
    if (rf & 1) {
      ɵɵprojectionDef();
      ɵɵelementStart(0, "div", 1)(1, "div", 1, 0);
      ɵɵprojection(3);
      ɵɵelementEnd()();
    }
    if (rf & 2) {
      ɵɵclassMap(ɵɵinterpolate1("headroom-wrapper ", ctx.wrapperClassName));
      ɵɵstyleProp("height", ctx.wrapperHeight, "px");
      ɵɵproperty("ngStyle", ctx.wrapperStyle);
      ɵɵadvance();
      ɵɵclassMap(ctx.innerClassName);
      ɵɵclassProp("headroom", true)("headroom--unfixed", ctx.state === "unfixed")("headroom--unpinned", ctx.state === "unpinned")("headroom--pinned", ctx.state === "pinned")("headroom--unfixed", ctx.state === "unfixed");
      ɵɵproperty("@headroom", ɵɵpureFunction2(23, _c3, ctx.state, ɵɵpureFunction2(20, _c2, ctx.duration, ctx.easing)))("ngStyle", ctx.innerStyle);
    }
  },
  dependencies: [NgStyle],
  encapsulation: 2,
  data: {
    animation: [trigger("headroom", [state("unfixed", style({
      transform: "translateY(0)"
    })), state("unpinned", style({
      transform: "translateY(-100%)"
    })), state("pinned", style({
      transform: "translateY(0px)"
    })), transition("unpinned <=> pinned", animate("{{ duration }}ms {{ easing }}"))])]
  },
  changeDetection: 0
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HeadroomComponent, [{
    type: Component,
    args: [{
      selector: "ngx-headroom",
      template: `
    <div
      [ngStyle]="wrapperStyle"
      class="headroom-wrapper {{ wrapperClassName }}"
      [style.height.px]="wrapperHeight"
    >
      <div
        #ref
        [@headroom]="{
          value: state,
          params: {
            duration: duration,
            easing: easing
          }
        }"
        [ngStyle]="innerStyle"
        [class]="innerClassName"
        [class.headroom]="true"
        [class.headroom--unfixed]="state === 'unfixed'"
        [class.headroom--unpinned]="state === 'unpinned'"
        [class.headroom--pinned]="state === 'pinned'"
        [class.headroom--unfixed]="state === 'unfixed'"
      >
        <ng-content></ng-content>
      </div>
    </div>
  `,
      animations: [trigger("headroom", [state("unfixed", style({
        transform: "translateY(0)"
      })), state("unpinned", style({
        transform: "translateY(-100%)"
      })), state("pinned", style({
        transform: "translateY(0px)"
      })), transition("unpinned <=> pinned", animate("{{ duration }}ms {{ easing }}"))])],
      preserveWhitespaces: false,
      changeDetection: ChangeDetectionStrategy.OnPush
    }]
  }], function() {
    return [{
      type: void 0,
      decorators: [{
        type: Inject,
        args: [DOCUMENT]
      }]
    }];
  }, {
    wrapperClassName: [{
      type: Input
    }],
    innerClassName: [{
      type: Input
    }],
    innerStyle: [{
      type: Input
    }],
    wrapperStyle: [{
      type: Input
    }],
    disable: [{
      type: Input
    }],
    upTolerance: [{
      type: Input
    }],
    downTolerance: [{
      type: Input
    }],
    pinStart: [{
      type: Input
    }],
    calcHeightOnResize: [{
      type: Input
    }],
    duration: [{
      type: Input
    }],
    easing: [{
      type: Input
    }],
    pin: [{
      type: Output
    }],
    unpin: [{
      type: Output
    }],
    unfix: [{
      type: Output
    }],
    inner: [{
      type: ViewChild,
      args: ["ref", {
        static: true
      }]
    }],
    parent: [{
      type: Input
    }],
    scroll: [{
      type: Input
    }, {
      type: HostListener,
      args: ["window:scroll"]
    }],
    resize: [{
      type: Input
    }, {
      type: HostListener,
      args: ["window:resize"]
    }]
  });
})();
var HeadroomModule = class {
};
HeadroomModule.ɵfac = function HeadroomModule_Factory(__ngFactoryType__) {
  return new (__ngFactoryType__ || HeadroomModule)();
};
HeadroomModule.ɵmod = ɵɵdefineNgModule({
  type: HeadroomModule,
  declarations: [HeadroomComponent],
  imports: [CommonModule],
  exports: [HeadroomComponent]
});
HeadroomModule.ɵinj = ɵɵdefineInjector({
  imports: [[CommonModule]]
});
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HeadroomModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule],
      exports: [HeadroomComponent],
      declarations: [HeadroomComponent]
    }]
  }], null, null);
})();
export {
  HeadroomComponent,
  HeadroomModule
};
//# sourceMappingURL=@ctrl_ngx-headroom.js.map
