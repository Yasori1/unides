import { Component } from '@angular/core';
import { OverviewService } from './overview.service';

@Component({
    selector: 'app-overview',
    imports: [],
    templateUrl: './overview.component.html',
    styleUrl: './overview.component.scss'
})
export class OverviewComponent {

    constructor(
        private overviewService: OverviewService
    ) {}

    ngOnInit(): void {
        this.overviewService.loadChart();
    }

}