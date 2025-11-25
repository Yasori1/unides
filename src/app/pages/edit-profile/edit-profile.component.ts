import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf, NgClass } from '@angular/common'; // NgClass eklendi
import { HeaderComponent } from '../../common/header/header.component';
import { FooterComponent } from '../../common/footer/footer.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    ReactiveFormsModule,
    NgIf,
    NgClass
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent {
  profileForm: FormGroup;
  avatarPreview: string | null = null;
  isSaving = false;
  saveSuccess = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      fullName: ['Ayşe Yılmaz', [Validators.required, Validators.minLength(3)]],
      email: ['ayse.yilmaz@universite.edu.tr', [Validators.required, Validators.email]],
      studentId: ['2021517005', [Validators.required]],
      department: ['Yönetim Bilişim Sistemleri', [Validators.required]],
      program: ['Lisans', [Validators.required]],
      phone: [''],
      bio: ['']
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isSaving = true;
      // API isteği simülasyonu
      setTimeout(() => {
        this.isSaving = false;
        this.saveSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/hesabim']); // Dashboard'a yönlendir
        }, 1500);
      }, 1000);
    } else {
      // Form valid değilse tüm alanları touch et ki hatalar görünsün
      this.profileForm.markAllAsTouched();
    }
  }

  goBack(): void {
    this.router.navigate(['/hesabim']);
  }
}