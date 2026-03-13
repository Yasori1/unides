/**
 * Auth Models
 * Backend DTO'larına birebir uyumlu TypeScript interface'leri
 */

// Backend: RegisterRequest
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  roleId: number; // 1=Kullanıcı, 2=GSB Görevlisi, 3=Topluluk Başkanı
}

// Backend: LoginRequest
export interface LoginRequest {
  email: string;
  password: string;
  roleId: number; // 1=Kullanıcı, 2=GSB Görevlisi, 3=Topluluk Başkanı
}

// Backend: RefreshRequest
export interface RefreshRequest {
  refreshToken?: string;
}

// Backend: ChangePasswordRequest
export interface ChangePasswordRequest {
  email: string; // Backend PascalCase: Email
  oldPassword: string; // Backend PascalCase: OldPassword
  newPassword: string; // Backend PascalCase: NewPassword
  confirmNewPassword: string; // Backend PascalCase: ConfirmNewPassword
}

// Backend: AuthResponse
export interface AuthResponse {
  id: number;
  fullName: string;
  email: string;
  roleName: string;
  accessToken: string;
  refreshToken: string;
  /**
   * Efektif rol ID'si:
   * 2 = Normal GSB personeli
   * 6 = UNIDES_GODMODE (tam yetkili GSB admin)
   * 7 = UNIDES_DUYURU (duyuru yöneticisi)
   */
  roleId?: number | null;
  /**
   * UserPermission tablosundan türetilen görev listesi.
   * Örn: ["UNIDES_GODMODE"], ["UNIDES_DUYURU"], []
   */
  permissions?: string[] | null;
}
