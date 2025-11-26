import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.scss']
})
export class ContactPageComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // Sayfa yüklendiğinde çalışacak kodlar buraya
    console.log('İletişim sayfası hazır 🚀');
  }

}