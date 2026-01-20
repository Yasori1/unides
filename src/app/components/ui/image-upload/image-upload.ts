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
  @Input() uploadToServer: boolean = false; // Backend'e yükleme yapılacak mı?
  @Input() allowUrl: boolean = true; // URL ile ekleme izni
  @Input() maxFileSizeMB: number = 1; // Maksimum dosya boyutu (MB)
  @Output() onImageSelected = new EventEmitter<string>(); // Parent'a image path/url gönder
  @Output() onFileSelected = new EventEmitter<File>(); // Parent'a File objesi gönder (upload için)
  @Output() onFileSizeError = new EventEmitter<{ file: File; maxSize: number; actualSize: number }>(); // Dosya boyutu hatası

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isDragging = false;
  fileName: string | null = null;
  urlInput: string = ''; // URL ile giriş için
  isUploading: boolean = false;

  // Dosya boyutu hatası için internal state
  showFileSizeError: boolean = false;
  fileSizeErrorMessage: string = '';

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
    // Dosya boyutu kontrolü (maxFileSizeMB MB üzeri dosyalar reddedilir)
    const maxSizeBytes = this.maxFileSizeMB * 1024 * 1024; // MB -> Bytes
    const actualSizeMB = file.size / (1024 * 1024);

    if (file.size > maxSizeBytes) {
      // Dosya çok büyük - hata göster
      this.showFileSizeError = true;
      this.fileSizeErrorMessage = `Dosya boyutu çok büyük! Maksimum ${this.maxFileSizeMB}MB yükleyebilirsiniz. Seçilen dosya: ${actualSizeMB.toFixed(2)}MB`;

      // Input'u temizle
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }

      // Parent component'e hata bildir
      this.onFileSizeError.emit({
        file: file,
        maxSize: this.maxFileSizeMB,
        actualSize: parseFloat(actualSizeMB.toFixed(2))
      });

      return; // İşlemi durdur
    }

    // Dosya boyutu uygun - hata mesajını temizle
    this.showFileSizeError = false;
    this.fileSizeErrorMessage = '';

    this.fileName = file.name;

    // Eğer uploadToServer true ise, dosyayı parent'a gönder (parent upload edecek)
    if (this.uploadToServer) {
      this.onFileSelected.emit(file);
      // Önizleme için base64 oku ve onImageSelected'i de emit et (preview için)
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        // Base64 preview'ı da emit et (parent component preview için kullanabilir)
        this.onImageSelected.emit(this.previewUrl || '');
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

  // Dosya boyutu hata popup'ını kapat
  closeFileSizeError() {
    this.showFileSizeError = false;
    this.fileSizeErrorMessage = '';
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
