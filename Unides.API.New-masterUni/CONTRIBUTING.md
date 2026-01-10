# 🚀 Pull Request (PR) Süreci – Unides.API.New

* Bu projede her geliştirici yalnızca kendi yaptığı değişiklikleri push eder.
* Gereksiz dosyalar, build klasörleri ve dokunulmayan dosyalar kesinlikle push’lanmaz.
* Tüm geliştirmeler master branch’i üzerinden oluşturulan yeni branch’lerde yapılır.

* ✔️ 1. Issue Seçin veya Oluşturun
  * • Üzerinde çalışacağınız konuyla ilgili mevcut bir issue varsa → kendinize atayın.
  * • Yoksa → yeni bir issue açıp yapılacak işi özetleyin.
  * • Bu süreç, aynı iş üzerinde birden fazla kişinin çalışmasını engeller.

* ✔️ 2. Repoyu Klonlayın  
  * • Projeyi yerel ortamınıza klonlayın:
```sh
git clone https://github.com/emircansazli/Unides.API.New.git
cd Unides.API.New
```

* ✔️ 3. Master’ı Güncelleyin & Yeni Branch Açın  
  * • Her işe başlamadan önce:
```sh
git checkout master
git pull origin master
```
  * Yeni branch oluşturun:
  ```sh
git checkout -b feature/ozellik-adi/tarih
# veya
git checkout -b fix/hata-adi/tarih
```
* ✔️ 4. Sadece Değiştirdiğiniz Dosyaları Commit Edin
  * • Bu projede politika şudur: *"Yalnızca üzerinde değişiklik yaptığınız dosyaları commit & push edin.
Kesinlikle tüm projeyi git add . ile eklemeyin."*
    *❌ Yanlış:
```sh
git add .
```
    *✅ Doğru (örnek: sadece 2 dosya değiştiyse):
```sh
git add src/Controllers/UserController.cs
git add src/Services/UserService.cs
```

* ✔️ 5. Commit Mesajınızı Yazın
  * • Commit mesajı Conventional Commits formatında yazılmalıdır.
    
    *Örnek:
```sh
git commit -m "feat(auth): login endpoint eklendi"
```

* ✔️ 6. Branch’i Push’layın
  * • Sadece commit ettiğiniz dosyaları push edin:
    
    *Örnek:
```sh
git push origin feature/ozellik-adi
```

* ✔️ 7. PR Açın (Hedef: master)
  * • GitHub’da yeni Pull Request açarken:
     * • Target branch: master
        * • Reviewer: emircansazli (zorunlu)
           * • Kendiniz merge ETMEYİN.

 * • PR açıklamasında mutlaka olsun:
     * • Yaptığınız değişikliklerin özeti
        * • Test notları → dotnet build OK, dotnet test OK
           * • Varsa ekran görüntüleri

* ✔️ 8. Kod İncelemesi (Code Review)
  * • Reviewer tarafından yorum veya düzeltme isteği gelebilir.
  * • Gerekirse aynı branch’e, sadece ilgili dosyaları push ederek düzeltmeleri gönderin.

* ✔️ . Kod İncelemesi (Code Review)
  * • Sadece reviewer (emircansazli) merge edebilir.
  * • Geliştiriciler kendi PR’larını merge etmez.
    


