/**
 * Event Models
 * Backend DTO'larına birebir uyumlu TypeScript interface'leri
 */

// Backend: EventListItemDto
export interface EventListItemDto {
  eventId: number;
  eventName: string;
  eventPictureLink?: string;
  eventDate: string; // DateOnly format: "YYYY-MM-DD"
  eventClock: string; // TimeOnly format: "HH:mm"
  eventLocation?: string;
  eventKontenjan?: number;
  eventAbout?: string;
  miniAbout?: string;
  communityName?: string;
  city?: string;
  eventConfirm: number; // 0=Pending, 1=Accepted, 2=Rejected
  daysUntil?: number;
}

// Backend: EventDetailDto
export interface EventDetailDto {
  eventId: number;
  eventName: string;
  eventPictureLink?: string;
  eventDate: string; // DateOnly format: "YYYY-MM-DD"
  eventClock: string; // TimeOnly format: "HH:mm"
  eventLocation?: string;
  eventKontenjan?: number;
  eventAbout?: string;
  miniAbout?: string;
  eventConfirm: number; // 0=Pending, 1=Accepted, 2=Rejected
  updatedAt: string; // DateTime ISO string
  confirmUpdatedAt?: string; // DateTime ISO string
  confirmUserId?: number;
  confirmAbout?: string;
  communityId: string; // Guid
  communityName?: string;
  city?: string;
}

// Backend: CreateEventDto
export interface CreateEventDto {
  eventName: string;
  eventPictureLink?: string;
  eventDate: string; // DateOnly format: "dd.MM.yyyy" (Backend DateOnlyJsonConverter bekliyor)
  eventClock: string; // TimeOnly format: "HH:mm"
  eventLocation?: string;
  eventKontenjan?: number;
  eventAbout?: string;
  miniAbout?: string;
}

// Backend: UpdateEventDto
export interface UpdateEventDto {
  eventName?: string;
  eventPictureLink?: string;
  eventDate?: string; // DateOnly format: "dd.MM.yyyy"
  eventClock?: string; // TimeOnly format: "HH:mm"
  eventLocation?: string;
  eventKontenjan?: number;
  eventAbout?: string;
  miniAbout?: string;
}

// Backend: ReviewEventDto
export interface ReviewEventDto {
  comment?: string;
}

// Backend: EventsByStatusDto
export interface EventsByStatusDto {
  pending: EventListItemDto[];
  accepted: EventListItemDto[];
  rejected: EventListItemDto[];
}
