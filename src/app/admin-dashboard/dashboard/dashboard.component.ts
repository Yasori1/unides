import { Component } from '@angular/core';
import { WelcomeComponent } from './welcome/welcome.component';
import { StatsComponent } from './stats/stats.component';
import { RecentActivitiesComponent } from './recent-activities/recent-activities.component';
import { RecentBookingsComponent } from './recent-bookings/recent-bookings.component';
import { OverviewComponent } from './overview/overview.component';

@Component({
    selector: 'app-dashboard',
    imports: [WelcomeComponent, StatsComponent, RecentActivitiesComponent, RecentBookingsComponent, OverviewComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {}