# Güncelleme Reddi vs Topluluk Reddi – Onay/Red Davranışı

## Sorun
GSB, "Onay Bekleyen (Güncelleme)" topluluğunda **Güncellemeyi Reddet**e bastığında backend topluluğu **Reddedilen** (comConfirm=2) yapıyor. Olması gereken: sadece **güncelleme talebi** reddedilsin, topluluk **aktif** kalsın ve **güncelleme öncesi (eski) bilgilerle** listelenmeye devam etsin.

## Beklenen davranış

### 1. Güncellemeyi Reddet (comConfirm = 4 iken review confirm=2)
- **Yapılacak:** PendingUpdateData = null, **comConfirm = 1** (onaylı). Ana kayıtta **hiçbir alan değiştirilmesin** (isim, logo, banner, açıklama vb. eski haliyle kalsın).
- **Sonuç:** Topluluk **Aktif** durumda, **güncelleme öncesi bilgileriyle** hem Kurumsal listede hem communities-page / detay sayfasında görünsün.

### 2. Güncellemeyi Onayla (comConfirm = 4 iken review confirm=1)
- **Yapılacak:** PendingUpdateData içeriğini ana kayda uygula (ComName, BannerUrl, LogoUrl, ComAbout, MiniAbout, City, University, ComMail, ComLeadMail, ComCategory vb.). Sonra PendingUpdateData = null, **comConfirm = 1**.
- **Sonuç:** Topluluk **Aktif**, **yeni bilgilerle** listelenir (communities-page ve detay sayfasında güncel bilgiler görünsün).

### 3. Topluluk Reddi (comConfirm = 0 iken review confirm=2 – yeni kayıt)
- **Yapılacak:** comConfirm = 2 (Reddedilen). Mevcut davranış aynen kalsın.

## Public list / detay (communities-page, community-detail)
- Bu sayfalar **her zaman mevcut (yayındaki) kayıt verisini** kullanır; PendingUpdateData **hiçbir zaman** public API yanıtında “ana bilgi” olarak dönmemeli.
- **comConfirm = 4** olsa bile public list ve detay için dönen isim, logo, banner, açıklama vb. **ana kayıt (eski bilgiler)** olmalı. Güncelleme onaylanınca ana kayıt yenilendiği için o andan itibaren yeni bilgiler görünür; reddedilirse eski bilgiler görünmeye devam eder.

## Frontend (yapıldı)
- Onay Bekleyen **(Güncelleme)** ve **(Yeni Kayıt)** için detay pop-up’lar ayrı: Güncelleme için sadece "Güncellemeyi Onayla" / "Güncellemeyi Reddet", Topluluğu Sil yok.
- Aynı `reviewCommunity(id, 1)` ve `reviewCommunity(id, 2, reason)` kullanılıyor; ayrım backend’de comConfirm değerine göre yapılmalı.
