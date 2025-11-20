import { Component } from '@angular/core';
import { NgxTypedWriterModule } from 'ngx-typed-writer';

@Component({
    selector: 'app-banner',
    imports: [NgxTypedWriterModule],
    templateUrl: './banner.component.html',
    styleUrl: './banner.component.scss'
})
export class BannerComponent {}