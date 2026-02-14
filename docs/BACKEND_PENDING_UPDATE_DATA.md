# Onay Bekleyen (Güncelleme) – PendingUpdateData

## Backend (uygulandı)
- **CommunityDetailDto:** `PendingUpdateData` kolonu JSON string olarak dönüyor (`PendingCommunityUpdatesDto` kaldırıldı).
- **Detay endpoint'leri** (lead-by-me ve GET /{id}): `PendingUpdateData = com.ComConfirm == 4 ? com.PendingUpdateData : null`.

## API yanıtı (comConfirm = 4)
- **Ana alanlar** (comName, bannerUrl, logoUrl, comAbout, …) → mevcut (yayında olan) veri.
- **pendingUpdateData** → onaya gelen tüm değişiklikler (banner, logo dahil) **JSON string**. İçerik PascalCase (ComName, ComAbout, BannerUrl, LogoUrl, MiniAbout, City, University, ComMail, ComLeadMail, ComCategory).
- comConfirm ≠ 4 ise `pendingUpdateData = null`.

Örnek:
```json
{
  "communityId": "...",
  "comName": "Mevcut onaylı isim",
  "bannerUrl": "/ImagesUnides/Banner/eski-banner.jpg",
  "logoUrl": "/ImagesUnides/Logo/eski-logo.jpg",
  "comConfirm": 4,
  "pendingUpdateData": "{\"ComName\":\"Yeni İsim\",\"ComAbout\":\"Yeni Hakkında\",\"BannerUrl\":\"/ImagesUnides/Banner/yeni-banner.jpg\",\"LogoUrl\":\"/ImagesUnides/Logo/yeni-logo.jpg\",\"MiniAbout\":\"Yeni Mini\",\"City\":\"Bartın\",\"University\":\"Bartın Üniversitesi\",\"ComMail\":\"...\",\"ComLeadMail\":\"...\",\"ComCategory\":\"Teknoloji\"}"
}
```

## Liste endpoint'i (GET /api/Communities)
- **Kartlarda güncellenecek verinin görünmesi için:** comConfirm=4 olan her topluluk için yanıtta `pendingUpdateData` ve `hasEverBeenApproved` (veya en azından comConfirm) dönmelidir. Böylece Kurumsal Dashboard topluluk kartlarında "şu anda bu yazacak" (onay sonrası geçerli olacak) veriler gösterilir.
- Liste DTO'sunda bu alanlar yoksa kartta mevcut (onaylı) veri görünür; detay açıldığında yine onaya gelen veri kullanılır.

## Onay / Red davranışı
- **Güncellemeyi Reddet (confirm=2):** Topluluk bilgileri **eski (mevcut)** haliyle kalır; sadece güncelleme talebi iptal edilir.
- **Güncellemeyi Kabul Et (confirm=1):** Topluluk bilgileri **yeni (pending)** verilerle güncellenir; onay sonrası bu veriler geçerli olur.

## Frontend
- `pendingUpdateData` string'ini `JSON.parse()` ile parse ediyor.
- Hem camelCase hem PascalCase anahtarları okuyor (ComName, comName vb.).
- **Detay (modal):** Banner, logo ve diğer alanlar onaya gelen veri olarak gösteriliyor (Eskiden → Yeni).
- **Kart listesi (Kurumsal):** `getPendingDisplay(item)` ile kartta isim, açıklama, logo, banner, şehir, üniversite, kategori onaya gönderilen veriyle gösteriliyor (liste cevabında `pendingUpdateData` varsa).
