# Backend Düzeltme: Silinmiş Topluluk Sonrası Yeni Onaylı Topluluk ile Giriş

## Sorun
Kullanıcı eski topluluğu silindi/reddedildi, yeni topluluk kaydı oluşturdu ve onay aldı. Buna rağmen girişte "Topluluğunuz silinmiştir" hatası alınıyor.

## Sebep
`UNIDES.API.New/Application/Features/Auth/Commands/LoginCommand.cs` içinde topluluk başkanı girişinde:
- `GetAllByLeadMailAsync` ile kullanıcının **tüm** toplulukları (silinmiş dahil) alınıyor.
- **Herhangi bir** topluluğun silinmiş olması yeterli görülüp hemen hata fırlatılıyor.
- Kullanıcının **silinmemiş (onaylı veya bekleyen) bir topluluğu** olup olmadığı kontrol edilmiyor.

## Çözüm (Backend’de uygulanacak)
Sadece kullanıcının **tüm** toplulukları silinmişse giriş engellensin; en az bir tane silinmemiş (aktif/bekleyen) topluluk varsa girişe izin verilsin.

**Dosya:** `Application/Features/Auth/Commands/LoginCommand.cs`

**Mevcut (satır 62–84):**
```csharp
// Silinmiş topluluk kontrolü (hem reddedilmiş hem silinmiş durumunu ayırt et)
var deletedCommunity = allCommunities.FirstOrDefault(c => c.DeletedAt.HasValue);

if (deletedCommunity != null)
{
    // ... throw silinmiştir / reddedilmiş sonra silinmiş ...
}
```

**Olması gereken:**
```csharp
// Silinmiş topluluk kontrolü — sadece TÜM toplulukları silinmişse engelle
var deletedCommunity = allCommunities.FirstOrDefault(c => c.DeletedAt.HasValue);
var hasNonDeleted = allCommunities.Any(c => !c.DeletedAt.HasValue);

if (deletedCommunity != null && !hasNonDeleted)
{
    // Eğer topluluk hem reddedilmiş (ComConfirm=2) hem silinmişse özel mesaj
    if (deletedCommunity.ComConfirm.HasValue && deletedCommunity.ComConfirm.Value == 2)
    {
        var reasonText = !string.IsNullOrWhiteSpace(deletedCommunity.DeleteReason)
            ? $" Lütfen mailinize gelen gerekçedeki hatanızı düzelterek tekrardan topluluk kaydı oluşturup GSB'ye yollayınız."
            : " Lütfen mailinize gelen gerekçeyi kontrol ederek tekrardan topluluk kaydı oluşturup GSB'ye yollayınız.";
        throw new InvalidOperationException($"Topluluğunuz önce reddedilmiş, sonra silinmiştir.{reasonText}");
    }
    else
    {
        var reasonText = !string.IsNullOrWhiteSpace(deletedCommunity.DeleteReason)
            ? $" Lütfen mailinize gelen gerekçedeki hatanızı düzelterek tekrardan topluluk kaydı oluşturup GSB'ye yollayınız."
            : " Lütfen mailinize gelen gerekçeyi kontrol ederek tekrardan topluluk kaydı oluşturup GSB'ye yollayınız.";
        throw new InvalidOperationException($"Topluluğunuz silinmiştir.{reasonText}");
    }
}
```

Özet: `if (deletedCommunity != null)` yerine `if (deletedCommunity != null && !hasNonDeleted)` kullanılmalı ve `hasNonDeleted = allCommunities.Any(c => !c.DeletedAt.HasValue);` eklenmeli.

Bu değişiklik backend projesinde (UNIDES.API.New) uygulanmalıdır.
