# Sistem Açığı: Özel Dedektif

Köhne bir iş hanında başlayıp şehrin gölgelerindeki örgütlere uzanan, sonu olmayan bir dedektiflik RPG'si. Oyun tamamen çevrimdışı çalışır: vakalar, şüpheliler, ipuçları ve diyaloglar cihazda prosedürel olarak üretilir. Yapay zekâ ya da dış servis kullanılmaz.

## Proje yapısı

| Yol | Ne işe yarar |
| --- | --- |
| `www/index.html` | Oyunun tamamı (tek dosya: arayüz, vaka motoru, hikâye) |
| `www/icerik-paketi.json` | Örnek içerik paketi (yeni vaka türleri, hikâye bölümleri) |
| `capacitor.config.json` | Mobil uygulama ayarları (uygulama kimliği, adı) |
| `package.json` | Capacitor bağımlılıkları |

## Tarayıcıda deneme

`www/index.html` dosyasını tarayıcıda açman yeterli.

## iOS uygulaması oluşturma (Mac gerekir)

Gerekenler: macOS, Xcode, Node.js ve bir Apple Developer hesabı.

```bash
npm install
npx cap add ios
npm run ios
```

Xcode açılınca:

1. Sol menüden **App** hedefini seç, **Signing & Capabilities** sekmesinde kendi Apple Developer takımını seç.
2. Uygulama simgesini **App/Assets.xcassets/AppIcon** içine ekle (1024×1024 PNG).
3. Üst menüden **Product → Archive** ile arşiv oluştur.
4. Açılan pencerede **Distribute App → App Store Connect** ile yükle.
5. [App Store Connect](https://appstoreconnect.apple.com) üzerinden önce TestFlight ile dene, sonra incelemeye gönder.

Oyunda her değişiklikten sonra `npm run ios` komutunu tekrar çalıştır.

## Otomatik TestFlight yüklemesi (Mac gerekmez)

`.github/workflows/ios-testflight.yml` oyunu GitHub'ın bulut Mac'lerinde derleyip TestFlight'a yükler.

Bir kez yapılacaklar:

1. [App Store Connect](https://appstoreconnect.apple.com) > **Uygulamalar** > **+** ile yeni uygulama oluştur. Paket kimliği (Bundle ID) olarak `com.bolatemre.sistemacigi` seç; yoksa önce [Developer hesabında](https://developer.apple.com/account/resources/identifiers/list) oluştur.
2. App Store Connect > **Kullanıcılar ve Erişim** > **Entegrasyonlar** > **App Store Connect API** bölümünden **Admin** yetkili bir anahtar oluştur. `.p8` dosyasını indir (yalnızca bir kez indirilebilir), **Key ID** ve **Issuer ID** değerlerini not al.
3. GitHub deposunda **Settings > Secrets and variables > Actions** bölümüne şu dört gizli anahtarı ekle: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (.p8 dosyasının içeriğinin tamamı).

Yüklemek için: **Actions > iOS TestFlight > Run workflow**. Her çalıştırmada yapı numarası otomatik artar. Sürüm numarası `package.json` içindeki `version` alanından gelir.

Uygulama simgesi ve açılış ekranı `assets/` klasöründen otomatik üretilir.

## Android uygulaması

```bash
npx cap add android
npm run android
```

Android Studio'da **Build → Generate Signed Bundle** ile `.aab` dosyası oluşturup Google Play Console'a yükle.

## Yeni senaryo eklemek (güncelleme gerektirmez)

`www/index.html` içindeki `CONTENT_URL` satırına kendi sunucundaki JSON dosyasının adresini yaz. Oyun açılışta bu dosyayı kontrol eder ve `version` numarası artmışsa yeni paketi indirir. Paket biçimi için `www/icerik-paketi.json` dosyasına bak.

## Yayın öncesi yapılacaklar

- [ ] Uygulama simgesi ve açılış ekranı
- [ ] Gizlilik politikası sayfası (App Store bunu zorunlu tutar)
- [ ] Reklamlar şu an örnek: gerçek reklam için AdMob eklentisi bağlanacak
- [ ] Reklamsız paket şu an örnek: gerçek satın alma için uygulama içi satın alma eklentisi bağlanacak
- [ ] Kayıtlar şu an tarayıcı hafızasında: kalıcı olması için Capacitor Preferences eklentisine taşınacak
- [ ] App Store ekran görüntüleri ve açıklama metni
