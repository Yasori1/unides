# GSB Güncellemesi – X-From-GSB Header

## Sorun
Kurumsal Dashboard’dan (GSB) bir topluluğu Pasif → Aktif (veya herhangi bir alan) güncellediğimizde backend şu hatayı dönüyordu:
- *"Topluluğunuz için zaten bir güncelleme isteği onay bekliyor. Lütfen GSB onayını bekleyin."*

Sebep: PUT `/api/Communities/update/{id}` isteği topluluk başkanı güncellemesi gibi işlenip “onay bekleyen güncelleme” kontrolüne takılıyordu. GSB’nin yaptığı değişikliklerin onay kuyruğuna alınmadan **anında uygulanması** gerekiyor.

## Frontend değişikliği
- Kurumsal Dashboard’dan yapılan tüm topluluk ekleme/güncelleme çağrılarında artık **`X-From-GSB: true`** HTTP header’ı gönderiliyor.
- Bu header sadece `community.services.ts` içinde `addOrUpdateCommunity(..., { fromGSB: true })` ve dolayısıyla `updateCommunity(id, dto, { fromGSB: true })` kullanıldığında ekleniyor (yani sadece Kurumsal panelden yapılan isteklerde).

## Backend’de yapılması gerekenler
PUT `/api/Communities/update/{id}` (ve varsa benzeri update endpoint’leri) içinde:

1. **Request header kontrolü:** `X-From-GSB` (veya eşdeğer bir header) **"true"** (case-insensitive) ise bu isteği **GSB güncellemesi** kabul edin.
2. **GSB güncellemesi ise:**
   - “Zaten onay bekleyen güncelleme var” kontrolünü **atlayın** (bu hatayı döndürmeyin).
   - Güncellemeyi **doğrudan uygulayın** (pending update oluşturmayın, mevcut pending’i de bekletmeyin).
3. **Header yoksa veya GSB değilse:** Mevcut mantık aynen kalsın (topluluk başkanı güncellemesi → onay bekleyen güncelleme vb.).

İsteğe bağlı ek güvenlik: Sadece GSB/kurumsal rolüne sahip kullanıcıların `X-From-GSB: true` göndermesine izin verip, diğer rollerde bu header gelse bile “topluluk başkanı” akışında işleyebilirsiniz.

## Özet
| Header           | Anlamı              | Backend davranışı                          |
|------------------|---------------------|--------------------------------------------|
| `X-From-GSB: true` | İstek GSB’den       | Anında uygula, “onay bekliyor” hatası verme |
| Yok / farklı     | Topluluk tarafı vb. | Mevcut kurallar (onay bekleyen güncelleme) |

Bu sayede GSB panelden Pasif → Aktif (veya diğer alanlar) kaydedildiğinde hata alınmayacak ve değişiklik anında yansıyacak.
