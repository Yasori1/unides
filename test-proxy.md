# Proxy Test ve Sorun Giderme Rehberi

## Adım 1: Dev Server'ı Tamamen Yeniden Başlat

```bash
# Terminal'de Ctrl+C ile durdur
# Sonra tekrar başlat:
npm start
# veya
ng serve
```

## Adım 2: Proxy Loglarını Kontrol Et

Dev server başladıktan sonra terminal'de şu logları ara:

```
[proxy] /api/Events/upcoming/home -> https://unidesportal.org/api/Events/upcoming/home
```

Eğer bu logları görüyorsan → Proxy çalışıyor ✅
Eğer görmüyorsan → Proxy çalışmıyor ❌

## Adım 3: Browser Console'da Test Et

Browser'da F12 → Network tab → Sayfayı yenile

İsteklerin şu şekilde görünmesi gerekir:
- **Request URL**: `http://localhost:4200/api/Events/upcoming/home`
- **Status**: 200 (veya backend'den gelen gerçek status)

## Adım 4: Backend Endpoint'ini Doğrudan Test Et

Tarayıcıda şu URL'yi aç:
```
https://unidesportal.org/api/Events/upcoming/home
```

Eğer 404 alıyorsan → Backend sorunu
Eğer 200 alıyorsan → Proxy sorunu olabilir

## Adım 5: Backend Loglarını Kontrol Et

Backend sunucusunun (unidesportal.org) loglarında şunu ara:
- `GET /api/Events/upcoming/home` isteği geliyor mu?
- Hata mesajı var mı?

## Sorun Giderme Checklist

- [ ] Dev server tamamen yeniden başlatıldı
- [ ] Proxy logları terminal'de görünüyor
- [ ] Browser Network tab'ında istekler localhost:4200'den gidiyor
- [ ] Backend endpoint'i doğrudan çalışıyor
- [ ] Backend loglarında istek görünüyor
