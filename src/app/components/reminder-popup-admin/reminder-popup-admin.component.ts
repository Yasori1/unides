import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  ReminderPopupService,
  ReminderPopupDetail,
  CreateReminderPopupRequest,
  UpdateReminderPopupRequest,
} from '../../services/reminder-popup.service';
import { ToastService } from '../../services/toast.services';
import { ImageUploadComponent } from '../ui/image-upload/image-upload';
import { LumaSpinComponent } from '../ui/luma-spin/luma-spin.component';

@Component({
  selector: 'app-reminder-popup-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent, LumaSpinComponent],
  templateUrl: './reminder-popup-admin.component.html',
  styleUrls: ['./reminder-popup-admin.component.scss'],
})
export class ReminderPopupAdminComponent implements OnInit {
  readonly maxWords = 70;
  readonly maxChars = 500;
  items: ReminderPopupDetail[] = [];
  loading = false;
  saving = false;
  formOpen = false;
  editingId: number | null = null;
  deleteTarget: ReminderPopupDetail | null = null;

  form: {
    title: string;
    shortDescription: string;
    startDate: string;
    endDate: string;
    noEndDate: boolean;
    announcementLink: string;
    applicationLink: string;
    isActive: boolean;
  } = {
    title: '',
    shortDescription: '',
    startDate: '',
    endDate: '',
    noEndDate: true,
    announcementLink: '',
    applicationLink: '',
    isActive: true,
  };

  imageFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    public reminderService: ReminderPopupService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadList();
  }

  wordCount(text: string): number {
    const t = (text || '').trim();
    if (!t) return 0;
    return t.split(/\s+/).length;
  }

  charCount(text: string): number {
    return (text || '').length;
  }

  loadList(): void {
    this.loading = true;
    this.reminderService.listAdmin().subscribe({
      next: (rows) => {
        this.items = rows || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.show('Hatırlatıcı listesi yüklenemedi.', 'error');
      },
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form = {
      title: '',
      shortDescription: '',
      startDate: this.nowDatetimeLocal(),
      endDate: '',
      noEndDate: true,
      announcementLink: '',
      applicationLink: '',
      isActive: true,
    };
    this.imageFile = null;
    this.imagePreview = null;
    this.formOpen = true;
  }

  openEdit(row: ReminderPopupDetail): void {
    this.editingId = row.id;
    this.form = {
      title: row.title,
      shortDescription: row.shortDescription || '',
      startDate: this.toDatetimeLocalValue(row.startDate),
      endDate: row.endDate ? this.toDatetimeLocalValue(row.endDate) : '',
      noEndDate: !row.endDate,
      announcementLink: row.announcementLink || '',
      applicationLink: row.applicationLink || '',
      isActive: row.isActive,
    };
    this.imageFile = null;
    this.imagePreview = row.imageUrl ? this.reminderService.resolveImageUrl(row.imageUrl) : null;
    this.formOpen = true;
  }

  closeForm(): void {
    this.formOpen = false;
    this.editingId = null;
    this.imageFile = null;
    this.imagePreview = null;
  }

  /** image-upload: kayıt sonrası API'ye yüklenecek dosya */
  onReminderImageFile(file: File): void {
    this.imageFile = file;
  }

  /** Önizleme / kullanıcı görseli kaldırdığında temizlik */
  onReminderImagePreview(src: string): void {
    if (!src) {
      this.imageFile = null;
      this.imagePreview = null;
      return;
    }
    this.imagePreview = src;
  }

  private validate(): string | null {
    if (!this.form.title.trim()) return 'Başlık zorunludur.';
    if (this.wordCount(this.form.shortDescription) > this.maxWords) {
      return `Kısa açıklama en fazla ${this.maxWords} kelime olabilir.`;
    }
    if (this.charCount(this.form.shortDescription) > this.maxChars) {
      return `Kısa açıklama en fazla ${this.maxChars} karakter olabilir.`;
    }
    if (!this.form.startDate) return 'Başlangıç tarihi zorunludur.';
    if (!this.form.noEndDate && this.form.endDate) {
      const a = new Date(this.form.startDate).getTime();
      const b = new Date(this.form.endDate).getTime();
      if (b < a) return 'Bitiş tarihi başlangıçtan önce olamaz.';
    }
    return null;
  }

  save(): void {
    const err = this.validate();
    if (err) {
      this.toast.show(err, 'error');
      return;
    }

    const startIso = new Date(this.form.startDate).toISOString();
    let endIso: string | undefined;
    if (!this.form.noEndDate && this.form.endDate) {
      endIso = new Date(this.form.endDate).toISOString();
    }

    this.saving = true;

    if (this.editingId == null) {
      const body: CreateReminderPopupRequest = {
        title: this.form.title.trim(),
        shortDescription: this.form.shortDescription.trim() || undefined,
        startDate: startIso,
        endDate: endIso,
        announcementLink: this.form.announcementLink.trim() || undefined,
        applicationLink: this.form.applicationLink.trim() || undefined,
      };
      this.reminderService
        .create(body)
        .pipe(
          switchMap((id) => {
            if (this.imageFile) {
              return this.reminderService.uploadImage(id, this.imageFile).pipe(
                catchError(() => {
                  this.toast.show('Kayıt oluşturuldu ancak görsel yüklenemedi.', 'error');
                  return of('');
                }),
              );
            }
            return of('');
          }),
        )
        .subscribe({
          next: () => {
            this.saving = false;
            this.toast.show('Hatırlatıcı oluşturuldu.', 'success');
            this.closeForm();
            this.loadList();
          },
          error: (e) => {
            this.saving = false;
            this.toast.show(e?.error?.message || 'Kayıt başarısız.', 'error');
          },
        });
      return;
    }

    const upd: UpdateReminderPopupRequest = {
      title: this.form.title.trim(),
      shortDescription: this.form.shortDescription.trim() || undefined,
      startDate: startIso,
      clearEndDate: this.form.noEndDate,
      endDate: this.form.noEndDate ? undefined : endIso,
      announcementLink: this.form.announcementLink.trim() || undefined,
      applicationLink: this.form.applicationLink.trim() || undefined,
      isActive: this.form.isActive,
    };

    this.reminderService
      .update(this.editingId, upd)
      .pipe(
        switchMap(() => {
          if (this.imageFile && this.editingId != null) {
            return this.reminderService.uploadImage(this.editingId, this.imageFile).pipe(
              catchError(() => {
                this.toast.show('Güncellendi ancak görsel yüklenemedi.', 'error');
                return of('');
              }),
            );
          }
          return of('');
        }),
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.toast.show('Hatırlatıcı güncellendi.', 'success');
          this.closeForm();
          this.loadList();
        },
        error: (e) => {
          this.saving = false;
          this.toast.show(e?.error?.message || 'Güncelleme başarısız.', 'error');
        },
      });
  }

  confirmDelete(row: ReminderPopupDetail): void {
    this.deleteTarget = row;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  doDelete(): void {
    if (!this.deleteTarget) return;
    const id = this.deleteTarget.id;
    this.reminderService.delete(id).subscribe({
      next: () => {
        this.toast.show('Silindi.', 'success');
        this.deleteTarget = null;
        this.loadList();
      },
      error: (e) => {
        this.toast.show(e?.error?.message || 'Silinemedi.', 'error');
      },
    });
  }

  formatDisplayDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('tr-TR');
    } catch {
      return iso;
    }
  }

  private nowDatetimeLocal(): string {
    const d = new Date();
    return this.toDatetimeLocalValue(d.toISOString());
  }

  private toDatetimeLocalValue(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
