import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class OverviewService {

    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) private platformId: any) {
        this.isBrowser = isPlatformBrowser(this.platformId);
    }

    async loadChart(): Promise<void> {
        if (this.isBrowser) {
            try {
                // Dynamically import ApexCharts
                const ApexCharts = (await import('apexcharts')).default;

                // Define chart options
                const options = {
                    series: [
                        {
                            name: "Listings Views",
                            data: [130, 90, 120, 160, 200, 120, 130]
                        },
                        {
                            name: "Bookings",
                            data: [20, 80, 50, 40, 120, 150, 140]
                        }
                    ],
                    chart: {
                        height: 420,
                        type: "area",
                        toolbar: {
                            show: false
                        }
                    },
                    dataLabels: {
                        enabled: false
                    },
                    fill: {
                        type: "gradient",
                        gradient: {
                            opacityFrom: 0.45,
                            opacityTo: 0.05
                        }
                    },
                    grid: {
                        show: true,
                        strokeDashArray: 0,
                        borderColor: "#ffffff",
                        xaxis: {
                            lines: {
                                show: true
                            }
                        },
                        yaxis: {
                            lines: {
                                show: true
                            }
                        }
                    },
                    stroke: {
                        width: 4,
                        curve: "smooth"
                    },
                    colors: [
                        "#EDEFF5", "#088dd3"
                    ],
                    xaxis: {
                        axisBorder: {
                            show: true,
                            color: '#edeff5'
                        },
                        axisTicks: {
                            show: true,
                            color: '#edeff5'
                        },
                        labels: {
                            show: true,
                            style: {
                                colors: "#262626",
                                fontSize: "13px"
                            }
                        },
                        categories: [
                            "Sunday",
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday"
                        ]
                    },
                    yaxis: {
                        labels: {
                            show: true,
                            style: {
                                colors: "#a9a9c8",
                                fontSize: "13px"
                            }
                        },
                        axisBorder: {
                            show: true,
                            color: '#edeff5'
                        }
                    },
                    legend: {
                        show: false
                    }
                };

                // Initialize and render the chart
                const chart = new ApexCharts(document.querySelector('#overview_chart'), options);
                chart.render();
            } catch (error) {
                console.error('Error loading ApexCharts:', error);
            }
        }
    }

}