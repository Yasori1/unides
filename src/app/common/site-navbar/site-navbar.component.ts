import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './site-navbar.component.html',
  styleUrls: ['./site-navbar.component.scss'],
})
export class SiteNavbarComponent {}
