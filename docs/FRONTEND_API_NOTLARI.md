# Genel Notlar (Frontend Ekibi İçin)

- **Base URL:** Örn. `https://api.unidesportal.org` (localde `https://localhost:7069`). Frontend’de `environment.apiUrl` (dev’de `/api`, proxy ile backend’e gider).
- **Auth route prefix:** `api/Auth/...`
- **Communities route prefix:** `api/Communities/...`
- **Origin kontrolü:** Tarayıcı zaten `Origin` gönderir. Canlıda API tarafındaki allowlist’te frontend domain’in olması gerekir (`Cors:AllowedOrigins`).
- **CSRF:**
  - İsteklerde `Authorization: Bearer <accessToken>` kullanırsanız CSRF kontrolü bypass olur.
  - Sadece cookie ile çalışacaksanız (`access_token` cookie’si), PUT/POST/... isteklerinde (Auth hariç) `X-CSRF-Token` header’ı cookie’deki `XSRF-TOKEN` ile aynı olmalı.

---

## GSB giriş (RoleId=2) — OTP zorunlu login akışı

1. **OTP başlat (token vermez)**  
   `POST /api/Auth/login`  
   Body: `{ "email": "...", "password": "...", "roleId": 2 }`  
   Cevap (tipik): `requiresOtp=true`, `otpRequestId=<GUID>`, `accessToken=null`, `refreshToken=null`.  
   OTP mail ile gelir (6 hane, 5 dk).  
   *Not:* Cihaz “remember device” ile hatırlanmışsa endpoint bazen direkt token döndürebilir (`requiresOtp=false`).

2. **OTP doğrula (token burada üretilir)**  
   `POST /api/Auth/login-otp`  
   Body: `{ "otpRequestId": "GUID", "code": "123456", "rememberDevice": true }`  
   Cevap: `accessToken` + `refreshToken` (body’de). Ayrıca cookie: `access_token`, `refresh_token`, `XSRF-TOKEN`, (opsiyonel) `mfa_device`.

3. **OTP yeniden gönder (opsiyonel)**  
   `POST /api/Auth/login-otp/resend`  
   Body: `{ "otpRequestId": "GUID" }`

---

## GSB ile topluluk onayı (approve/reject) akışı

Bu endpoint’ler login sonrası token ister. En kolayı: `Authorization: Bearer <accessToken>` ile çağırın.

1. **Onay bekleyen toplulukları çek**  
   `GET /api/Communities?status=pending`  
   Header: `Authorization: Bearer <accessToken>`  
   Not: `status` sadece GSB tarafından görülebilir (aksi halde 403). GSB’de `status` parametresi varsa backend otomatik şehir filtresi uygular.

2. **Topluluk onayla / reddet**  
   `PUT /api/Communities/{communityId}/review`  
   Header: `Authorization: Bearer <accessToken>`  
   Body (onay): `{ "confirm": 1, "confirmAbout": "Onaylandı" }`  
   Body (red): `{ "confirm": 2, "confirmAbout": "Eksik evrak" }`  
   Olası hatalar: 401 (token yok/yanlış), 403 (GSB değil veya şehir yetkisi yok), 400 (silinmiş topluluk vb.).

---

## Topluluk başkanı (edu.tr) kayıt + topluluk kaydı akışı (RoleId=3)

1. **Kayıt başlat (doğrulama maili gönderir)**  
   `POST /api/Auth/register`  
   Body: `{ "fullName": "...", "email": "...@uni.edu.tr", "password": "...", "roleId": 3 }`  
   Cevap: `redirectUrl`, `message`.  
   Bu register akışı edu.tr için; backend rolü pratikte Topluluk Başkanı akışına sokar.

2. **E-postayı doğrula (token ile)**  
   Frontend, maildeki linkten token’ı alıp:  
   `POST /api/Auth/verify-email`  
   Body: `{ "token": "MAIL_TOKEN" }`  
   Cevap: `requiresCommunitySetup=true`, `setupToken=<string>`, `setupTokenExpiresAt=<timestamp>`.  
   Token’lar (access/refresh) burada verilmez.  
   *Alternatif:* `GET /api/Auth/verify-email?token=...` (redirect yapar). SPA için en temizi POST.

3. **(Opsiyonel) Setup sırasında logo/banner yükle**  
   JWT olmadan, sadece `setupToken` ile:  
   `POST /api/Auth/community-setup/logo`  
   `POST /api/Auth/community-setup/banner`  
   `multipart/form-data`: `file` (IFormFile), `setupToken` (form field veya header `X-Setup-Token`).  
   Cevap: logo için `{ "logoUrl": "..." }`, banner için `{ "bannerUrl": "..." }`.

4. **Topluluk kaydını tamamla (asıl topluluk oluşturma)**  
   `POST /api/Auth/complete-community-setup`  
   Body:  
   `{ "setupToken": "SETUP_TOKEN", "community": { "comName": "...", "city": "...", "university": "...", "miniAbout": "...", "logoUrl": "...", "bannerUrl": "..." } }`  
   Cevap: `CompleteCommunitySetupResponse`; `community` objesi döner. `accessToken`/`refreshToken` null olabilir (topluluk onay bekliyor).

---

## Topluluk başkanı giriş (OTP’li)

1. **Login (OTP başlatır)**  
   `POST /api/Auth/login`  
   Body: `{ "email": "...", "password": "...", "roleId": 3 }`  
   `requiresOtp=true` ise `otpRequestId` gelir ve OTP maili gelir.  
   Topluluk onay bekliyorsa / reddedildiyse / silindiyse backend bu adımda hata mesajı ile girişe izin vermez.

2. **OTP doğrula**  
   `POST /api/Auth/login-otp`  
   Body: `{ "otpRequestId": "GUID", "code": "123456", "rememberDevice": true }`  
   Cevap: `accessToken`/`refreshToken` + cookie’ler (opsiyonel).

---

## Ek (gerekirse)

- **Doğrulama mailini tekrar gönder:** `POST /api/Auth/resend-verification` Body: `{ "email": "..." }`
- **Token yenileme:** `POST /api/Auth/refresh` (body’de refresh token veya cookie’den alır)

Frontend bu endpoint’lere bu sırayla istek atacak şekilde bağlanmalıdır.
