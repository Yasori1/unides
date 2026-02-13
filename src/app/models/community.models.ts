/**
 * Community Models
 * Backend DTO'larına birebir uyumlu TypeScript interface'leri
 */

// Backend: CommunityMiniDto (List endpoint için)
export interface CommunityMiniDto {
  communityId: string; // Guid
  comName: string;
  comCategory?: string;
  city?: string;
  university?: string;
  bannerUrl?: string;
  logoUrl?: string;
  miniAbout?: string;
  isActivity: boolean;
  comCreatedAt?: string; // ISO date string
  ComCreatedAt?: string; // PascalCase variant
  comMail?: string;
  comLeadMail?: string;
  comConfirm?: number; // 0=beklemede, 1=onaylandı, 2=reddedildi
  confirmAbout?: string; // Reddedilme gerekçesi (ComConfirm=2)
  ConfirmAbout?: string;
}

// Backend: CommunityEventDto
export interface CommunityEventDto {
  eventId: string; // Guid
  title?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  location?: string;
}

// Backend: CommunityDetailDto (Detail endpoint için)
export interface CommunityDetailDto {
  communityId: string; // Guid
  comName: string;
  comCategory?: string;
  comAbout?: string;
  city?: string;
  university?: string;
  comMail?: string;
  comLeadMail?: string;
  webSiteUrl?: string;
  instagramUrl?: string;
  bannerUrl?: string;
  logoUrl?: string;
  miniAbout?: string;
  isActivity: boolean;
  comConfirm?: number;
  confirmAbout?: string; // Reddetme gerekçesi (ComConfirm=2)
  /** Backend: true ise topluluk daha önce en az bir kez onaylanmış (şu anki bekleme = güncelleme onayı) */
  hasEverBeenApproved?: boolean;
  events: CommunityEventDto[];
}

// Backend: CreateCommunityDto
export interface CreateCommunityDto {
  comName: string;
  comCategory?: string;
  comAbout?: string;
  city?: string;
  university?: string;
  comMail?: string;
  comLeadMail?: string;
  webSiteUrl?: string;
  instagramUrl?: string;
  bannerUrl?: string;
  logoUrl?: string;
  miniAbout?: string;
  /** Topluluk Kaydı ile oluşturulduğunda false (onay bekleyen); GSB onayından sonra true yapılır. */
  isActivity?: boolean;
}

// Backend: UpdateCommunityDto
export interface UpdateCommunityDto {
  comName?: string;
  comCategory?: string;
  comAbout?: string;
  city?: string;
  university?: string;
  comMail?: string;
  comLeadMail?: string;
  webSiteUrl?: string;
  instagramUrl?: string;
  bannerUrl?: string;
  logoUrl?: string;
  isActivity?: boolean;
  miniAbout?: string;
}

// Backend: AddCommunityMemberDto
export interface AddCommunityMemberDto {
  email: string;
}

// Backend: RemoveCommunityMemberDto
export interface RemoveCommunityMemberDto {
  email: string;
}

// Backend: CommunityReviewDto (GSB onay/red)
export interface CommunityReviewDto {
  confirm: 1 | 2; // 1=onay, 2=red
  confirmAbout?: string; // Red gerekçesi
}

// Frontend için uyumlu Community interface (eski kodlarla uyumluluk için)
export interface Community {
  id: string; // Guid (eski number yerine)
  name: string;
  university: string;
  category: string;
  description?: string;
  coverImage?: string;
  logo: string;
  memberCount: number;
  city?: string;
  about?: string;
  banner?: string;
  socialMedia?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  email?: string;
  status?: 'Aktif' | 'Pasif' | 'Onay Bekleyen' | 'Reddedilen' | 'Silinmiş';
  /** Reddetme gerekçesi (ComConfirm=2 iken backend ConfirmAbout) */
  confirmAbout?: string;
  /** Soft delete: Backend DeletedAt döndürürse dolu (Silinmiş filtresi için) */
  deletedAt?: string | null;
  /** Silinme gerekçesi (Backend DeleteReason) */
  deleteReason?: string | null;
  presidentEmail?: string;
  // Backend'den gelen ek alanlar
  comMail?: string;
  comLeadMail?: string;
  webSiteUrl?: string;
  instagramUrl?: string;
  miniAbout?: string;
  isActivity?: boolean;
  comConfirm?: number; // 0=beklemede, 1=onaylandı, 2=reddedildi
  /** true ise topluluk daha önce en az bir kez onaylanmış (şu anki bekleme = profil güncellemesi onayı); ilk kayıt onayı vs güncelleme onayı ayrımı için */
  hasEverBeenApproved?: boolean;
  events?: CommunityEventDto[];
  upcomingEventCount?: number; // Featured communities için
}
