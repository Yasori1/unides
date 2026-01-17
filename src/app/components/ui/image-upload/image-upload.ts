import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { validateImageFile, FileValidationResult } from '../../../utils/file-upload.utils';

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
  @Input() uploadToServer: boolean = false; // Backend'e yükleme yapılacak mı?
  @Input() allowUrl: boolean = true; // URL ile ekleme izni
  @Output() onImageSelected = new EventEmitter<string>(); // Parent'a image path/url gönder
  @Output() onFileSelected = new EventEmitter<File>(); // Parent'a File objesi gönder (upload için)
  @Output() onValidationError = new EventEmitter<string>(); // Validation hatası için

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isDragging = false;
  fileName: string | null = null;
  urlInput: string = ''; // URL ile giriş için
  isUploading: boolean = false;
  validationError: string | null = null;

  // --- DOSYA SEÇME İŞLEMLERİ ---
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  handleFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.validateAndProcessFile(file);
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
      // Güvenlik kontrolü yap
      this.validateAndProcessFile(file);
    }
  }

  // --- DOSYAYI DOĞRULA VE İŞLE ---
  async validateAndProcessFile(file: File) {
    this.validationError = null;

    // Güvenlik doğrulaması
    const validation: FileValidationResult = await validateImageFile(file);

    if (!validation.valid) {
      const errorMsg = validation.error || 'Geçersiz dosya';
      this.validationError = errorMsg;
      this.onValidationError.emit(errorMsg);
      // Input'ı temizle
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
      return;
    }

    // Doğrulama başarılı, dosyayı işle
    this.processFile(file);
  }

  // --- DOSYAYI İŞLEME VE ÖNİZLEME ---
  processFile(file: File) {
    this.fileName = file.name;

    // Eğer uploadToServer true ise, dosyayı parent'a gönder (parent upload edecek)
    if (this.uploadToServer) {
      this.onFileSelected.emit(file);
      // Önizleme için base64 oku
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // Eski davranış: Base64 olarak gönder
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.onImageSelected.emit(this.previewUrl || ''); // Veriyi dışarı aktar
      };
      reader.readAsDataURL(file);
    }
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
