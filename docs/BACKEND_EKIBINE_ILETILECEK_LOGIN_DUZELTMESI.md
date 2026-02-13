# Backend Ekibine İletilecek: “Topluluğunuz Silinmiştir” Giriş Hatası Düzeltmesi

**Dosya:** `Unides.API.New/Application/Features/Auth/Commands/LoginCommand.cs`

---

## Sorun

Kullanıcı eski topluluğu sildirdi, yeni topluluk oluşturdu ve GSB onayı aldı. Buna rağmen girişte **"Topluluğunuz silinmiştir"** hatası alınıyor.

**Sebep:** `GetAllByLeadMailAsync` ile kullanıcının **tüm** toplulukları (silinmiş dahil) alınıyor; **herhangi bir** topluluğun silinmiş olması yeterli görülüp hemen hata fırlatılıyor. Kullanıcının **silinmemiş (onaylı veya bekleyen) bir topluluğu** olup olmadığı kontrol edilmiyor.

---

## Yapılacak Değişiklik (Sadece bu düzeltme uygulanacak)

**Kural:** Sadece kullanıcının **tüm** toplulukları silinmişse giriş engellensin; **en az bir tane silinmemiş** (aktif/bekleyen) topluluk varsa girişe izin verilsin.

### 1) RoleId == 5 bloğu (yaklaşık satır 70–86)

**Mevcut (yanlış):**
```csharp
if (user.RoleId == 5)
{
    // Önce tüm toplulukları getir (silinmiş dahil)
    var allCommunities = await _communityRepo.GetAllByLeadMailAsync(user.Email);
    var deletedCommunity = allCommunities.FirstOrDefault(c => c.DeletedAt.HasValue);

    if (deletedCommunity != null)
    {
        var reasonText = ...
        throw new InvalidOperationException($"Topluluğunuz silinmiştir.{reasonText}");
    }
    throw new InvalidOperationException("Topluluğunuz silinmiştir. ...");
}
```

**Olması gereken:**
```csharp
if (user.RoleId == 5)
{
    var allCommunities = await _communityRepo.GetAllByLeadMailAsync(user.Email);
    var deletedCommunity = allCommunities.FirstOrDefault(c => c.DeletedAt.HasValue);
    var hasNonDeleted = allCommunities.Any(c => !c.DeletedAt.HasValue);

    if (deletedCommunity != null && !hasNonDeleted)
    {
        var reasonText = !string.IsNullOrWhiteSpace(deletedCommunity.DeleteReason)
            ? " Lütfen mailinize gelen gerekçedeki hatanızı düzelterek tekrardan topluluk kaydı oluşturup GSB'ye yollayınız."
            : " Lütfen mailinize gelen gerekçeyi kontrol ederek tekrardan topluluk kaydı oluşturup GSB'ye yollayınız.";
        throw new InvalidOperationException($"Topluluğunuz silinmiştir.{reasonText}");
    }
    if (!hasNonDeleted)
        throw new InvalidOperationException("Topluluğunuz silinmiştir. Lütfen mailinize gelen gerekçeyi kontrol ederek tekrardan topluluk kaydı oluşturup GSB'ye yollayınız.");
}
```

Özet: `hasNonDeleted` ekleyin; hata sadece `deletedCommunity != null && !hasNonDeleted` iken (yani hiç silinmemiş topluluk yokken) fırlatılsın.

---

### 2) RoleId == 3 bloğu — silinmiş topluluk kontrolü (yaklaşık satır 93–121)

**Mevcut (yanlış):**
```csharp
var deletedCommunity = allCommunities.FirstOrDefault(c => c.DeletedAt.HasValue);

if (deletedCommunity != null)
{
    // ... throw silinmiştir / önce reddedilmiş sonra silinmiş ...
}
```

**Olması gereken:**
```csharp
var deletedCommunity = allCommunities.FirstOrDefault(c => c.DeletedAt.HasValue);
var hasNonDeleted = allCommunities.Any(c => !c.DeletedAt.HasValue);

if (deletedCommunity != null && !hasNonDeleted)
{
    // ... aynı throw blokları (önce reddedilmiş sonra silinmiş / sadece silinmiş) ...
}
```

Özet: `hasNonDeleted` ekleyin; `if (deletedCommunity != null)` yerine `if (deletedCommunity != null && !hasNonDeleted)` kullanın.

---

### 3) İsteğe bağlı: RoleId 5 kullanıcıların girişi

Eski topluluk silindikten sonra kullanıcı **RoleId = 5** (Silinmiş Topluluk Başkanı) yapılmış olabilir. Yeni topluluk onaylandığında RoleId tekrar 3 yapılıyor; bazen bu güncelleme gecikebiliyor. Bu yüzden **RoleId 5** olan kullanıcının **en az bir silinmemiş topluluğu varsa** giriş yapabilmesi için:

- `if (user.RoleId != 3)` yerine: **`if (user.RoleId != 3 && user.RoleId != 5)`**
- `if (user.RoleId == 3)` yerine: **`if (user.RoleId == 3 || user.RoleId == 5)`**

yapılabilir. Böylece RoleId 5 olup silinmemiş topluluğu olan kullanıcı da aynı topluluk onay kontrollerinden geçip giriş yapabilir.

---

## Özet

| Yer | Değişiklik |
|-----|------------|
| RoleId == 5 | `hasNonDeleted` ekle; sadece `deletedCommunity != null && !hasNonDeleted` iken "silinmiştir" fırlat. |
| RoleId == 3 | Aynı mantık: `hasNonDeleted` ekle; `if (deletedCommunity != null && !hasNonDeleted)` kullan. |
| İsteğe bağlı | RoleId 5 için de topluluk başkanı girişine izin ver (yukarıdaki 3. madde). |

Bu değişiklikler uygulandıktan sonra: eski topluluk silinip yeni topluluk oluşturulup onaylandığında kullanıcı giriş yapabilecek.
