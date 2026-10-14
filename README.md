# Yeni Galata Dedektifi

Köhne bir iş hanında başlayıp şehrin gölgelerindeki örgütlere uzanan, sonu olmayan bir dedektiflik RPG'si. Oyun tamamen çevrimdışı çalışır: vakalar, şüpheliler, ipuçları ve diyaloglar cihazda prosedürel olarak üretilir. Yapay zekâ ya da dış servis kullanılmaz.

## Proje yapısı

| Yol | Ne işe yarar |
| --- | --- |
| `index.html` | Oyunun tamamı (arayüz, vaka motoru, hikâye) |
| `icerik-paketi.json` | Örnek içerik paketi (yeni vaka türleri, hikâye bölümleri) |
| `icon.png`, `splash.png`, `splash-dark.png` | Uygulama simgesi ve açılış ekranı |
| `scripts/prepare-web.js` | Dosyaları derleme öncesi `www/` ve `assets/` klasörlerine kopyalar |
| `.github/workflows/ios-testflight.yml` | Bulutta derleyip TestFlight'a yükleyen otomasyon |
| `capacitor.config.json` | Mobil uygulama ayarları (uygulama kimliği, adı) |

`www/` ve `assets/` klasörleri otomatik oluşturulur; depoya eklenmez.

## Tarayıcıda deneme

`index.html` dosyasını tarayıcıda açman yeterli.

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

## Android

```bash
npx cap add android
npm run android
```

## Yeni senaryo eklemek (güncelleme gerektirmez)

`index.html` içindeki `CONTENT_URL` satırına kendi sunucundaki JSON dosyasının adresini yaz. Oyun açılışta bu dosyayı kontrol eder ve `version` numarası artmışsa yeni paketi indirir. Biçim için `icerik-paketi.json` dosyasına bak.

## Yayın öncesi yapılacaklar

- [ ] Gizlilik politikası sayfası (App Store zorunlu tutar)
- [ ] Örnek reklamlar ve "Satın al (deneme)" düğmesi mağaza sürümünden kaldırılacak ya da gerçek AdMob / uygulama içi satın alma bağlanacak
- [ ] Kayıtlar Capacitor Preferences eklentisine taşınacak (iOS tarayıcı hafızasını silebilir)
- [ ] App Store ekran görüntüleri ve açıklama metni
