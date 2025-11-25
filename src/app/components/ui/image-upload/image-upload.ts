import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-upload.html',
  styleUrls: ['./image-upload.scss'],
})
export class ImageUploadComponent {
  @Input() label: string = 'Resim Yükle';
  @Input() previewUrl: string | null = null; // Mevcut resim varsa göster
  @Output() onImageSelected = new EventEmitter<string>(); // Parent'a veriyi gönder

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isDragging = false;
  fileName: string | null = null;
  urlInput: string = ''; // URL ile giriş için

  // --- DOSYA SEÇME İŞLEMLERİ ---
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  handleFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  // --- SÜRÜKLE BIRAK İŞLEMLERİ ---
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.processFile(file);
      }
    }
  }

  // --- DOSYAYI İŞLEME VE ÖNİZLEME ---
  processFile(file: File) {
    this.fileName = file.name;

    // Dosyayı okuyup Base64'e çevirelim (Demo için backend'e gerek kalmadan göstermek için)
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
      this.onImageSelected.emit(this.previewUrl || ''); // Veriyi dışarı aktar
    };
    reader.readAsDataURL(file);
  }

  // --- URL GİRİŞİ ---
  handleUrlInput() {
    if (this.urlInput) {
      this.previewUrl = this.urlInput;
      this.fileName = 'URL Bağlantısı';
      this.onImageSelected.emit(this.previewUrl);
    }
  }

  // --- SİLME ---
  removeImage(event: Event) {
    event.stopPropagation(); // Tıklama bubble'ını engelle
    this.previewUrl = null;
    this.fileName = null;
    this.urlInput = '';
    if (this.fileInput) this.fileInput.nativeElement.value = '';
    this.onImageSelected.emit('');
  }
}
