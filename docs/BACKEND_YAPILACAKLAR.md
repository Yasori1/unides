# Backend Ekibinin Yapması Gerekenler (Mevcut Frontend Akışına Göre)

Bu belge, frontend’in **Topluluk Paneli → Profilim** ekranındaki “Güncellemeleri Onaya Gönder” akışına göre backend’de yapılması gereken değişiklikleri özetler. Amaç: **Tüm fotoğrafların sunucuda tutulması** ve **banner + logo + metin alanlarının tek güncelleme talebinde birlikte** işlenebilmesi.

---

## 1. Frontend’in Şu Anki Akışı

1. Kullanıcı Profilim’de metin alanlarını ve/veya yeni banner/logo dosyası seçer.
2. “Güncellemeleri Onaya Gönder”e basınca frontend **sırayla** şunları yapar:
   - Varsa **önce** `POST /api/Communities/{id}/banner` (FormData, `File` alanı).
   - Varsa **sonra** `POST /api/Communities/{id}/logo` (FormData, `File` alanı).
   - **En sonda** `PUT /api/Communities/update/{id}` + header `X-Submit-For-Approval: true` ile metin alanları + `bannerUrl` + `logoUrl` (upload yanıtlarından veya mevcut URL’lerden) gönderilir.

Yani tek bir “onaya gönder” işleminde **önce iki upload (banner, logo) sırayla**, **sonra bir PUT** çağrılıyor. Backend’in bu sırayı kabul etmesi ve **ComConfirm = 4** (güncelleme onayı bekliyor) iken ikinci upload’ı ve PUT’ı reddetmemesi gerekir.

---

## 2. Backend’de Yapılması Gerekenler

### 2.1. ComConfirm = 4 iken ikinci upload’a izin verin (merge)

**Durum:** Topluluk zaten “güncelleme onayı bekliyor” (ComConfirm = 4) iken frontend sırayla önce banner, sonra logo atıyor. Şu an ikinci upload (ör. logo) muhtemelen **400 Bad Request** veya “zaten güncelleme bekliyor” benzeri bir nedenle reddediliyor.

**Yapılacak:**

- **`POST /api/Communities/{id}/banner`** ve **`POST /api/Communities/{id}/logo`** çağrıldığında:
  - Topluluk için **ComConfirm = 4** ise isteği **reddetmeyin**.
  - Mevcut **PendingUpdateData** (JSON string) varsa parse edin.
  - **Banner** endpoint’i için: Döndüğünüz yeni `BannerUrl` değerini PendingUpdateData içine yazın (merge).
  - **Logo** endpoint’i için: Döndüğünüz yeni `LogoUrl` değerini PendingUpdateData içine yazın (merge).
  - Diğer alanlar (ComName, ComAbout, vb.) varsa **silinmesin**; sadece ilgili alan (BannerUrl veya LogoUrl) güncellensin.
  - Güncellenmiş JSON’u tekrar **PendingUpdateData** olarak kaydedin.

Böylece önce banner, sonra logo atıldığında ikisi de aynı “onay bekleyen” güncellemede tutulur.

### 2.2. ComConfirm = 4 iken PUT (güncelleme) isteğine izin verin (merge)

**Durum:** Frontend, iki upload’tan sonra metin + banner/logo URL’leri ile **`PUT /api/Communities/update/{id}`** ve **`X-Submit-For-Approval: true`** gönderiyor. ComConfirm = 4 iken bu PUT’ın da **reddedilmemesi** gerekiyor.

**Yapılacak:**

- **`PUT /api/Communities/update/{id}`** ve **`X-Submit-For-Approval: true`** ile gelen istekte:
  - Topluluk için **ComConfirm = 4** ise isteği **“zaten güncelleme bekliyor”** diyerek reddetmeyin.
  - Mevcut **PendingUpdateData**’yı okuyun, parse edin.
  - Gönderilen DTO’daki **gönderilen alanları** (comName, comAbout, bannerUrl, logoUrl, city, university, comMail, comLeadMail, comCategory, miniAbout, webSiteUrl, instagramUrl vb.) PendingUpdateData ile **merge** edin (gönderilen alan varsa güncelleyin, gönderilmeyen alanlar mevcut PendingUpdateData’da kalabilir).
  - Sonucu tekrar **PendingUpdateData** olarak kaydedin.
  - ComConfirm değerini **4** olarak koruyun (yeni bir “onay bekleyen” kayıt oluşturmayın, mevcut güncelleme talebini güncellemiş olun).

Böylece frontend’in “önce banner + logo upload, sonra PUT ile metin + URL’ler” akışı tek bir onay bekleyen güncelleme altında birleşir.

---

## 3. API Sözleşmesi (Referans)

### 3.1. Banner upload

- **Endpoint:** `POST /api/Communities/{id}/banner`
- **Body:** `multipart/form-data`, alan adı: **`File`** (dosya).
- **Yanıt:** En az birini döndürün: **`BannerUrl`** veya **`bannerUrl`** (string). Frontend `/assets/img/` veya `/images/` ile başlayan path’leri `/ImagesUnides/` ile değiştiriyor; backend’in tutarlı bir path formatı kullanması yeterli.

### 3.2. Logo upload

- **Endpoint:** `POST /api/Communities/{id}/logo`
- **Body:** `multipart/form-data`, alan adı: **`File`** (dosya).
- **Yanıt:** En az birini döndürün: **`LogoUrl`** veya **`logoUrl`** (string). Path konvansiyonu banner ile aynı.

### 3.3. Güncelleme (onaya gönder)

- **Endpoint:** `PUT /api/Communities/update/{id}` (veya mevcut update route’unuz).
- **Header:** **`X-Submit-For-Approval: true`** (frontend bu header ile gönderiyor).
- **Body (JSON):** Örnek alanlar: `comName`, `comCategory`, `comAbout`, `city`, `university`, `comMail`, `comLeadMail`, `webSiteUrl`, `instagramUrl`, `miniAbout`, **`bannerUrl`**, **`logoUrl`**. Hepsi opsiyonel; sadece gönderilen alanlar güncellenmeli.

---

## 4. PendingUpdateData formatı (mevcut dokümantasyonla uyumlu)

Frontend, **BACKEND_PENDING_UPDATE_DATA.md**’deki gibi **PascalCase** anahtarlar bekliyor (ComName, BannerUrl, LogoUrl, ComAbout, MiniAbout, City, University, ComMail, ComLeadMail, ComCategory vb.). Merge yaparken bu anahtar isimlerini kullanmanız, liste ve detay endpoint’lerinde `pendingUpdateData` string’ini aynı formatta döndürmeniz yeterli.

---

## 5. Özet checklist (backend ekibi için)

| #   | Yapılacak                                                                            | Açıklama                                                                                              |
| --- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 1   | ComConfirm = 4 iken **POST /{id}/banner** reddedilmesin                              | Gelen BannerUrl, mevcut PendingUpdateData ile merge edilip kaydedilsin.                               |
| 2   | ComConfirm = 4 iken **POST /{id}/logo** reddedilmesin                                | Gelen LogoUrl, mevcut PendingUpdateData ile merge edilip kaydedilsin.                                 |
| 3   | ComConfirm = 4 iken **PUT /update/{id}** (X-Submit-For-Approval: true) reddedilmesin | Gönderilen DTO alanları mevcut PendingUpdateData ile merge edilip kaydedilsin; ComConfirm = 4 kalsın. |

---

## 6. Topluluk kaydı: Banner/Logo 403 (X-Setup-Token)

**Durum:** Topluluk kaydı 3. adımda `POST /api/Auth/complete-community-setup` başarılı (200) dönüyor; ardından frontend `POST /api/Communities/{id}/banner` ve `POST /api/Communities/{id}/logo` ile görsel yüklüyor. Backend bazen complete-community-setup yanıtında **JWT (accessToken) döndürmüyor** (örn. topluluk onay bekliyor). Bu durumda frontend bu iki istekte **Authorization** yerine **`X-Setup-Token`** header'ı ile (e-posta doğrulama sonrası verilen setup token) istek atıyor. Backend 403 "Kullanıcı bilgisi bulunamadı." dönüyorsa banner/logo yüklenemiyor.

**Yapılacak:**

- **`POST /api/Communities/{id}/banner`** ve **`POST /api/Communities/{id}/logo`** endpoint'lerinde:
  - İstekte **`X-Setup-Token`** header'ı varsa, bu token'ı doğrulayın (complete-community-setup ile aynı token; süresi dolmamış olmalı).
  - Token geçerliyse ve ilgili topluluk bu kuruluma aitse, **Authorization Bearer zorunlu olmasın**; X-Setup-Token ile yükleme yapılabilsin.
  - Böylece topluluk kaydı tamamlandıktan hemen sonra (JWT dönmeden) logo ve banner yüklenebilir.

Alternatif: complete-community-setup yanıtında her durumda (onay bekleyen dahil) kısa süreli bir **accessToken** döndürürseniz, frontend bunu kullanır ve X-Setup-Token'a gerek kalmaz.

**Güvenlik notu:** Verify-email sonrası topluluk başkanı için bilerek User/JWT üretilmiyor; kullanıcı sadece setup linkine (e-posta doğrulamış) sahip. Bu durumda **JWT yerine SetupToken ile yetkilendirme** güvenli kabul edilir: SetupToken da bir kimlik kanıtıdır (uzun-rastgele, süreli, tek kişiye mail ile gidiyor). Endpoint JWT'siz ama açık değildir: setupToken zorunlu, PendingEmailVerification üzerinde token + expiry doğrulanıyor, sadece RoleId == 3, dosya limiti ve extension kontrolü var. Yani "Bu linki kim aldıysa (mail sahibi), o upload yapabilir" mantığı.

Bu üç madde uygulandığında frontend’in “tüm fotoğraflar sunucuda, önce upload’lar sonra PUT” akışı backend ile uyumlu çalışır.
