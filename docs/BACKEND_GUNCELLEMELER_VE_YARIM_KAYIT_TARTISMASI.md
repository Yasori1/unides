# Backend’de Yapılması Gerekenler

Bu belge backend ekibinin yapması gereken işleri listeler. Sadece backend tarafındaki görevler yer alır.

---

## BÖLÜM 1 – Topluluk “Onay Bekleyen” Akışı

Aşağıdakileri yapın:

1. **Entity:** Topluluk entity’sinde “aktif mi?” bilgisi olsun (örn. `IsActivity`). Topluluk **kayıt süreci** (community register) ile oluşturulduğunda bu alanı **false** atayın (onay bekleyen).

2. **Create (POST topluluk oluşturma):** Topluluk kaydından gelen oluşturma isteğinde `IsActivity = false` (veya eşdeğer “onay bekleyen” durumu) set edin.

3. **Lead-by-me (GET /api/Communities/lead-by-me):** Rolü topluluk (roleId = 3) olan kullanıcının kendi topluluğunu döndürün; **onay bekleyen (pasif) topluluklar da** dönmeli. Response DTO’da `isActivity` / `IsActivity` alanını mutlaka döndürün.

4. **Liste / filtreleme:** Topluluk listesinde “Onay Bekleyen” filtresi için `IsActivity == false` (veya eşdeğer status) ile filtreleme yapılabilsin.

5. **Onaylama:** Kurumsal kullanıcı bir topluluğu onayladığında ilgili topluluğun `IsActivity = true` (veya “Aktif”) yapılmasını sağlayın.

---

## BÖLÜM 2 – Yarım Kalan Topluluk Kaydı (Taslak Sistemi)

Topluluk kaydı yarım kaldığında kullanıcı aynı veya farklı cihazdan devam edebilsin diye backend’de taslak (draft) sistemi kurun. Aşağıdakileri yapın.

### 2.1. Veri modeli

- **Taslak kaydı** için bir entity/tablo ekleyin (örn. `CommunityRegistrationDraft`).
- Şu alanları tutun:
  - **Id** (Guid, primary key)
  - **DraftToken** (string, opsiyonel): E-posta linkinde kullanılacak; tahmin edilmesi zor, uzun rastgele string
  - **Email** (topluluk başkanı e-postası)
  - **CurrentStep** (1, 2 veya 3)
  - **Step1Data** (Adım 1 verisi – JSON veya ayrı kolonlar). **Şifre saklamayın;** sadece ad, e-posta gibi alanlar
  - **Step2Data** (Adım 2 verisi: üniversite, şehir, topluluk adı, kategori vb.)
  - **Step3Data** (Adım 3 verisi: banner/logo path, iletişim bilgileri vb.)
  - **EmailVerifiedAt** (nullable): E-posta doğrulandıysa doldurun
  - **CreatedAt**, **UpdatedAt**
  - **CompletedAt** (nullable): Taslak tamamlanınca doldurun; doluysa bu taslak kullanılmaz
- **Şifreyi taslakta asla saklamayın.** Şifre sadece “kayıt tamamla” isteğinde gönderilir, o anda Auth’ta kullanılır.

### 2.2. Taslak oluşturma / güncelleme

- **POST /api/Communities/registration-draft** (veya Auth altında uygun bir path) endpoint’ini ekleyin.
- Request body’de alın: **email**, **currentStep** (1/2/3), **step1Data**, **step2Data**, **step3Data** (opsiyonel alanlar). **password göndermeyin / saklamayın.**
- Aynı **email** için zaten taslak varsa (CompletedAt boş) kaydı **güncelleyin**; yoksa **yeni taslak oluşturun**.
- Yeni taslak oluşturulduğunda **DraftToken** üretip response’ta döndürün. Güncellemede de mevcut draftToken’ı döndürün.
- Response’ta en az şunları döndürün: **draftId**, **draftToken**, **email**, **currentStep**. İsteğe bağlı: **expiresAt**.
- Hata: **currentStep** 1–3 dışındaysa veya zorunlu alan eksikse **400 Bad Request** dönün.

### 2.3. Taslağı getirme

- **GET /api/Communities/registration-draft** endpoint’ini ekleyin.
- Query parametre: **email** veya **token** (draftToken). Biri zorunlu.
- **CompletedAt** dolu veya süresi dolmuş taslakları **döndürmeyin**; **404 Not Found** dönün.
- Bulunan taslak için response’ta döndürün: **draftId**, **draftToken**, **email**, **currentStep**, **step1Data**, **step2Data**, **step3Data**, **emailVerifiedAt** (nullable). İsteğe bağlı: **expiresAt**.

### 2.4. Taslağı tamamlama (gerçek kayıt)

- **POST /api/Communities/complete-registration-from-draft** (veya uygun bir isim) endpoint’ini ekleyin.
- Request body’de alın: **draftToken** veya **draftId** veya **email** (taslağı tanımlamak için), **password** (zorunlu).
- Taslağı bulun (CompletedAt boş, süresi dolmamış). Bulunamazsa **404** dönün.
- Taslaktaki step1/step2/step3 verilerini kullanarak:
  - Mevcut Auth kayıt akışınızla kullanıcıyı oluşturun (e-posta, ad, password, roleId = 3). E-posta doğrulama gerekiyorsa mevcut akışınızı uygulayın.
  - Topluluk oluşturma (Create Community) akışınızı çalıştırın; **IsActivity = false** (onay bekleyen) set edin.
- Taslağı **CompletedAt = UTC now** ile işaretleyin veya silin.
- E-posta zaten kayıtlıysa **409 Conflict** (veya uygun hata mesajı) dönün.

### 2.5. E-posta doğrulama ile taslak güncellemesi

- Mevcut e-posta doğrulama akışınızda, doğrulama tamamlandığında: doğrulanan e-posta için `CommunityRegistrationDraft` tablosunda kayıt var mı kontrol edin; varsa bu taslağın **EmailVerifiedAt** alanını güncelleyin (örn. UTC now). Böylece taslak “e-posta doğrulanmış” olarak işaretlenir.

### 2.6. Güvenlik ve KVKK

- Taslak kayıtlarını belirli süre sonra silin (örn. 30 gün). **UpdatedAt** veya **CreatedAt**’a göre periyodik job ile **CompletedAt** boş ve süresi geçmiş kayıtları silin.
- **DraftToken** tahmin edilmesi zor ve yeterince uzun (örn. 64+ karakter rastgele) üretilsin.
- Bir e-posta için aynı anda yalnızca bir aktif taslak (CompletedAt boş) tutulsun; yeni POST geldiğinde mevcut taslak güncellensin.
- Taslak süresi dolmuşsa GET veya complete-registration’da 404 (veya 410 Gone) dönün; isteğe bağlı olarak bu taslakları silebilirsiniz.
