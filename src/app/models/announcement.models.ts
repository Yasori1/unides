/**
 * Announcement Models
 * Backend DTO'larına birebir uyumlu TypeScript interface'leri
 */

// Backend: AnnouncementListItemDto
export interface AnnouncementListItemDto {
  annId: number;
  title: string;
  shortDescription?: string;
  annDate?: string; // DateTime ISO string
  imagePath?: string;
}

// Backend: AnnouncementDetailDto
export interface AnnouncementDetailDto {
  annId: number;
  title: string;
  shortDescription?: string;
  eventDate?: string; // DateTime ISO string (backend'de EventDate olarak dönüyor)
  description?: string;
  link?: string;
  imagePath?: string;
}

// Backend: CreateAnnouncementCommand (DTO)
export interface CreateAnnouncementDto {
  title: string;
  shortDescription?: string;
  annDate?: string; // DateTime ISO string
  description?: string;
  link?: string;
  imagePath?: string;
}

// Backend: UpdateAnnouncementCommand (DTO)
export interface UpdateAnnouncementDto {
  annId?: number; // Backend body'de de bekliyor
  title: string;
  shortDescription?: string;
  annDate?: string; // DateTime ISO string
  description?: string;
  link?: string;
  imagePath?: string;
}
