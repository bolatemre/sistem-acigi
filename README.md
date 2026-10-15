# Yeni Galata Dedektifi

Köhne bir iş hanında başlayıp şehrin gölgelerindeki örgütlere uzanan, sonu olmayan bir dedektiflik RPG'si. Oyun tamamen çevrimdışı çalışır: vakalar, şüpheliler, ipuçları ve diyaloglar cihazda prosedürel olarak üretilir. Yapay zekâ ya da dış servis kullanılmaz.

## Proje yapısı

| Yol | Ne işe yarar |
| --- | --- |
| `index.html` | Oyunun tamamı (arayüz, vaka motoru, hikâye) |
| `native.js` | Telefona özel özellikler: AdMob reklamları ve kalıcı kayıt |
| `ads.config.json` | AdMob uygulama ve reklam birimi kimlikleri |
| `icerik-paketi.json` | Örnek içerik paketi (yeni vaka türleri, hikâye bölümleri) |
| `icon.png`, `splash.png`, `splash-dark.png` | Uygulama simgesi ve açılış ekranı |
| `scripts/prepare-web.js` | Dosyaları derleme öncesi `www/` ve `assets/` klasörlerine hazırlar |
| `scripts/patch-ios.js` | iOS ayarlarına AdMob kimliğini ve takip izni metnini ekler (otomatik çalışır) |
| `.github/workflows/ios-testflight.yml` | Bulutta derleyip TestFlight'a yükleyen otomasyon |
| `capacitor.config.json` | Mobil uygulama ayarları (uygulama kimliği, adı) |

`www/`, `assets/` ve `ios/` klasörleri otomatik oluşturulur; depoya eklenmez.

## Tarayıcıda deneme

`index.html` dosyasını tarayıcıda açman yeterli. Tarayıcıda örnek reklamlar gösterilir; gerçek AdMob reklamları yalnızca telefon uygulamasında çalışır.

## AdMob

`ads.config.json` şu an Google'ın test kimliklerini içerir; test reklamları gösterilir ve gelir oluşmaz. Yayından önce:

1. [AdMob](https://admob.google.com) hesabında iOS uygulamasını ekle.
2. Üç reklam birimi oluştur: **Ödüllü**, **Geçiş (Interstitial)** ve **Banner**.
3. `ads.config.json` içindeki `appId` ve üç reklam birimi kimliğini gerçekleriyle değiştir, `testing` değerini `false` yap.

Reklam yerleşimi:

- **Ödüllü:** soru, hamle ve para bitince oyuncu kendisi seçer (günde en fazla 5).
- **Geçiş:** her iki dosya kapatıldığında bir kez.
- **Banner:** yalnızca Ofis ve Arşiv ekranlarında, sekme çubuğunun üstünde. Sorgu ve vaka ekranlarında gösterilmez.

İlk açılışta iOS takip izni sorulur; AB'deki oyunculara Google'ın rıza formu gösterilir.

## Otomatik TestFlight yüklemesi (Mac gerekmez)

Bir kez yapılacaklar:

1. [App Store Connect](https://appstoreconnect.apple.com) > **Uygulamalar** > **+** ile yeni uygulama oluştur. Ad olarak **Yeni Galata Dedektifi**, paket kimliği (Bundle ID) olarak `com.bolatemre.sistemacigi` seç; listede yoksa önce [Developer hesabında](https://developer.apple.com/account/resources/identifiers/list) oluştur.
2. App Store Connect > **Kullanıcılar ve Erişim** > **Entegrasyonlar** > **App Store Connect API** bölümünden **Admin** yetkili bir anahtar oluştur. `.p8` dosyasını indir (yalnızca bir kez indirilebilir), **Key ID** ve **Issuer ID** değerlerini not al.
3. Bu depoda **Settings > Secrets and variables > Actions** bölümüne dört gizli anahtar ekle: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (.p8 dosyasının içeriğinin tamamı).

Yüklemek için: **Actions > iOS TestFlight > Run workflow**. Her çalıştırmada yapı numarası otomatik artar; sürüm numarası `package.json` içindeki `version` alanından gelir.

## Mac'te elle derleme (isteğe bağlı)

```bash
npm install
npx cap add ios
npm run ios
```

## Yeni senaryo eklemek (güncelleme gerektirmez)

`index.html` içindeki `CONTENT_URL` satırına kendi sunucundaki JSON dosyasının adresini yaz. Oyun açılışta bu dosyayı kontrol eder ve `version` numarası artmışsa yeni paketi indirir. Biçim için `icerik-paketi.json` dosyasına bak.

## Yayın öncesi yapılacaklar

- [x] Uygulama içi satın alma kaldırıldı
- [x] AdMob entegrasyonu (test kimlikleriyle)
- [x] Kalıcı kayıt (Capacitor Preferences)
- [x] iOS takip izni metni ve şifreleme beyanı
- [ ] Gerçek AdMob kimlikleri (`ads.config.json`)
- [ ] Gizlilik politikası sayfası (App Store zorunlu tutar)
- [ ] App Store ekran görüntüleri ve açıklama metni
