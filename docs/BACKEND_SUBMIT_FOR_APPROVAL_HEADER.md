# Profil Güncellemesi Onaya Gönder – X-Submit-For-Approval

## Sorun
Topluluk panelinde "Güncelle ve Onaya Gönder" tıklandığında:
- **İstek geçersiz** hatası alınıyordu (topluluk rolü `isActivity` alanını gönderemiyor olabilir).
- Güncelleme bazen anında uygulanıp topluluk Kurumsal Dashboard’da **Aktif** görünüyordu; **Onay Bekleyen (Profil Güncellemesi)** yerine.

Beklenen: Güncelleme onay kuyruğuna alınmalı; Kurumsal’da "Onay Bekleyen (Güncelleme)" tag’i ile listelenmeli; topluluk panelinde "Henüz Onay aşamasında" görünmeli.

## Frontend değişikliği
1. **Topluluk paneli** "Güncelle ve Onaya Gönder" akışında artık **`isActivity` alanı gönderilmiyor** (sadece profil alanları: comName, comAbout, logo, banner, vb.).
2. Aynı istekte **`X-Submit-For-Approval: true`** HTTP header’ı gönderiliyor. Böylece backend bu isteği “onaya gönderilen profil güncellemesi” olarak ayırt edebilir.

## Backend’de yapılması gerekenler

**PUT** `/api/Communities/update/{id}` içinde:

1. **Header kontrolü:** `X-Submit-For-Approval: true` (case-insensitive) geliyorsa bu isteği **“profil güncellemesi onaya gönder”** kabul edin.
2. **Bu durumda:**
   - Gönderilen profil alanlarını (comName, comAbout, logoUrl, bannerUrl, vb.) **onay bekleyen güncelleme** olarak kaydedin (anında ana kayda yazmayın).
   - Topluluğu “onay bekleyen” durumuna alın: liste tarafında **Onay Bekleyen** filtresinde görünmeli (`comConfirm = 0` veya ilgili alanlarla; `hasEverBeenApproved: true` dönün ki etiket "(Güncelleme)" olsun).
   - **GET** `/api/Communities/lead-by-me` bu topluluk için `isActivity: false` ve `hasEverBeenApproved: true` dönsün ki topluluk panelinde “Henüz Onay aşamasında” görünsün.
3. **Header yoksa:** Mevcut mantığınız aynen kalsın (ör. topluluk başkanı doğrudan güncelleme yapamıyorsa onay bekleyene alıyorsanız, yine aynı şekilde davranın; ancak `isActivity` topluluk rolü tarafından gönderilmemeli, sadece sizin “onaya gönder” akışınızda backend tarafında set edilmeli).

## Özet
| Header                      | Anlamı                          | Backend davranışı                                                |
|----------------------------|----------------------------------|------------------------------------------------------------------|
| `X-Submit-For-Approval: true` | Topluluk “Güncelle ve Onaya Gönder” | Güncellemeyi onay bekleyene al; listede Onay Bekleyen (Güncelleme); lead-by-me’de isActivity: false, hasEverBeenApproved: true |
| Yok                       | Normal güncelleme / GSB          | Mevcut kurallar (X-From-GSB varsa anında uygula vb.)             |

Bu sayede "Güncelle ve Onaya Gönder" sonrası ne "istek geçersiz" hatası alınır ne de güncelleme anında onaylanmış gibi görünür; Kurumsal Dashboard’da **Onay Bekleyen (Profil Güncellemesi)** doğru şekilde listelenir.
