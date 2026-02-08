import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { Logger } from '../../../utils/logger.util';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageCropperComponent],
  templateUrl: './image-upload.html',
  styleUrls: ['./image-upload.scss'],
})
export class ImageUploadComponent {
  @Input() label: string = 'Resim Yükle';
  @Input() previewUrl: string | null = null; // Mevcut resim varsa göster
  @Input() uploadToServer: boolean = false; // Backend'e yükleme yapılacak mı?
  @Input() allowUrl: boolean = true; // URL ile ekleme izni
  @Input() maxFileSizeMB: number = 1; // Maksimum dosya boyutu (MB)
  /** Kırpma açıksa, kullanıcı yüklemeden önce fotoğrafın hangi kısmının görüneceğini seçebilir */
  @Input() enableCrop: boolean = false;
  /** Kırpma en-boy oranını kilitle (false = kullanıcı serbest oran seçer) */
  @Input() cropMaintainAspectRatio: boolean = true;
  /** Kırpma en-boy oranı (örn: 1 = kare, 16/9 ≈ 1.78); cropMaintainAspectRatio true iken kullanılır */
  @Input() cropAspectRatio: number = 1;
  /** Kırpma alanı minimum genişlik (px, 0 = sınır yok) */
  @Input() cropMinWidth: number = 0;
  /** Kırpma alanı minimum yükseklik (px, 0 = sınır yok) */
  @Input() cropMinHeight: number = 0;
  /** Kırpma alanı maksimum genişlik (px, 0 = sınır yok) */
  @Input() cropMaxWidth: number = 0;
  /** Kırpma alanı maksimum yükseklik (px, 0 = sınır yok) */
  @Input() cropMaxHeight: number = 0;
  /** Kırpma modalında gösterilecek ek rehber metni (örn. "Logo kartlarda küçük karede gösterilir; önemli öğeleri ortada tutun.") */
  @Input() cropHint: string = '';
  @Output() onImageSelected = new EventEmitter<string>(); // Parent'a image path/url gönder
  @Output() onFileSelected = new EventEmitter<File>(); // Parent'a File objesi gönder (upload için)
  @Output() onFileSizeError = new EventEmitter<{ file: File; maxSize: number; actualSize: number }>(); // Dosya boyutu hatası

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild(ImageCropperComponent) imageCropper!: ImageCropperComponent;

  isDragging = false;
  fileName: string | null = null;
  urlInput: string = ''; // URL ile giriş için
  isUploading: boolean = false;

  // Dosya boyutu hatası için internal state
  showFileSizeError: boolean = false;
  fileSizeErrorMessage: string = '';

  // Kırpma modalı
  showCropModal: boolean = false;
  cropImageFile: File | null = null; // Cropper'da gösterilecek dosya
  pendingCropFile: File | null = null; // Kırpma sonrası dosya adı vb. için
  lastCroppedResult: ImageCroppedEvent | null = null;

  // --- DOSYA SEÇME İŞLEMLERİ ---
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  handleFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Dosya tipi ve uzantı kontrolü
      if (this.isValidImageFile(file)) {
        this.processFile(file);
      } else {
        // Geçersiz dosya tipi
        this.showFileTypeError(file);
      }
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
      // Dosya tipi ve uzantı kontrolü
      if (this.isValidImageFile(file)) {
        this.processFile(file);
      } else {
        // Geçersiz dosya tipi
        this.showFileTypeError(file);
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

    // Kırpma açıksa ve dosya SVG değilse (SVG canvas ile kırpılamaz) kırpma modalını aç
    const isSvg = file.type === 'image/svg+xml';
    if (this.enableCrop && !isSvg) {
      this.pendingCropFile = file;
      this.lastCroppedResult = null;
      this.cropImageFile = file; // Cropper bu dosyayı gösterecek
      this.showCropModal = true;
      return;
    }

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

  /** Kırpma tamamlandığında cropper'dan gelen sonucu sakla */
  onImageCropped(event: ImageCroppedEvent) {
    this.lastCroppedResult = event;
  }

  /** Kırpma modalında "Kırp ve kullan" */
  async confirmCrop() {
    if (!this.lastCroppedResult || !this.pendingCropFile) return;
    const event = this.lastCroppedResult;

    // Önizleme: objectUrl (blob URL) veya base64
    if (event.objectUrl) {
      this.previewUrl = event.objectUrl;
      this.onImageSelected.emit(event.objectUrl);
    } else if (event.base64) {
      this.previewUrl = event.base64;
      this.onImageSelected.emit(event.base64);
    }

    // uploadToServer ise kırpılmış blob'u File olarak emit et
    if (this.uploadToServer && event.blob) {
      const croppedFile = new File([event.blob], this.pendingCropFile.name, {
        type: this.pendingCropFile.type,
        lastModified: Date.now()
      });
      this.onFileSelected.emit(croppedFile);
    }

    this.closeCropModal();
  }

  /** Kırpma modalını kapat (iptal veya tamamlandıktan sonra) */
  closeCropModal() {
    this.showCropModal = false;
    this.cropImageFile = null;
    this.pendingCropFile = null;
    this.lastCroppedResult = null;
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  // Dosya boyutu hata popup'ını kapat
  closeFileSizeError() {
    this.showFileSizeError = false;
    this.fileSizeErrorMessage = '';
  }

  // --- DOSYA TİPİ VALİDASYONU (GÜVENLİK) ---
  /**
   * Dosya tipini ve uzantısını kontrol eder
   * MIME type spoofing saldırılarına karşı koruma sağlar
   */
  private isValidImageFile(file: File): boolean {
    // İzin verilen MIME type'lar
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];

    // İzin verilen dosya uzantıları
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    // MIME type kontrolü
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      return false;
    }

    // Dosya uzantısı kontrolü (MIME type spoofing koruması)
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      return false;
    }

    // MIME type ve uzantı uyumluluğu kontrolü
    const mimeToExtension: { [key: string]: string[] } = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg']
    };

    const expectedExtensions = mimeToExtension[file.type.toLowerCase()];
    if (expectedExtensions && !expectedExtensions.includes(fileExtension)) {
      // MIME type ve uzantı uyuşmuyor - şüpheli dosya
      return false;
    }

    return true;
  }

  // Dosya tipi hatası göster
  private showFileTypeError(file: File): void {
    // Input'u temizle
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    // Hata mesajı logla (Logger ile)
    Logger.warn('Geçersiz dosya tipi reddedildi:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    // Kullanıcıya görsel geri bildirim için (opsiyonel - toast service kullanılabilir)
    // Burada sadece input'u temizliyoruz, parent component toast gösterebilir
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
