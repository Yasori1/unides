# Backend: Onay Bekleyen Ayrımı — HasEverBeenApproved

Frontend, **ilk topluluk kaydı onayı** ile **profil güncellemesi onayı**nı ayırt etmek için backend’den tek bir alan bekliyor.

## Gerekli alan

- **İsim:** `hasEverBeenApproved` (camelCase) veya `HasEverBeenApproved` (PascalCase)
- **Tip:** `boolean`
- **Anlam:**
  - `true` → Topluluk daha önce en az bir kez onaylanmış; şu anki bekleme **profil güncellemesi onayı**. Topluluk başkanı panele girebilir, Profilim salt okunur.
  - `false` veya alan yok → Şu anki bekleme **yeni kayıt onayı**. Topluluk başkanı panele giremez, sadece “Topluluğunuz onay aşamasındadır” ekranı gösterilir.

## Hangi endpoint’lerde dönmeli?

1. **GET /api/Communities/lead-by-me**  
   Topluluk başkanı girişinde kendi topluluğunu almak için kullanılıyor.  
   `isActivity: false` (onay bekliyor) döndüğünde:
   - Profil güncellemesi bekliyorsa: `hasEverBeenApproved: true` → Frontend panele erişim verir.
   - Yeni kayıt bekliyorsa: `hasEverBeenApproved: false` veya alan yok → Frontend panele erişim vermez.

2. **Topluluk listesi (Kurumsal Dashboard)**  
   Kurumsal kullanıcı “Onay Bekleyen” toplulukları listelerken her topluluk için:
   - `hasEverBeenApproved: true` → Etiket: “Onay Bekleyen (Profil günc.)”
   - `hasEverBeenApproved: false` veya yok → Etiket: “Onay Bekleyen (Yeni kayıt)”

3. **GET /api/Communities/{id}** (detay)  
   Kurumsal detay modalında aynı ayrım için aynı alan kullanılıyor.

## Özet

| Durum                         | hasEverBeenApproved | Frontend davranışı                                      |
|------------------------------|---------------------|---------------------------------------------------------|
| Yeni kayıt, onay bekliyor    | `false` veya yok    | Panele giriş yok, “Topluluğunuz onay aşamasındadır”     |
| Profil güncellemesi bekliyor | `true`              | Panele giriş var, Profilim salt okunur, “Henüz Onay aşamasında” |

Backend bu alanı bu endpoint’lerde döndürdüğünde frontend tarafında ek geliştirme gerekmez; mevcut kod bu alanı kullanıyor.
