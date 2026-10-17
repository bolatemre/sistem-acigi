// Android derlemesinden önce çalışır (cap sync android sonrası).
// Uygulama adını yazar, AdMob uygulama kimliğini ekler, ekranı dikey kilitler, kesin alarm iznini kaldırır.
const fs = require("fs");
const path = require("path");

// Ana ekranda görünen ad. Türkçe karakter içerebilir; iç proje adı (capacitor.config.json > appName) ASCII kalmalı.
const DISPLAY_NAME = "Şüphe Ağı";

const root = path.join(__dirname, "..");
const main = path.join(root, "android", "app", "src", "main");
if (!fs.existsSync(main)) { console.log("Android projesi yok, atlanıyor."); process.exit(0); }
const fail = msg => { console.error("HATA: " + msg); process.exit(1); };

const ads = JSON.parse(fs.readFileSync(path.join(root, "ads.config.json"), "utf8"));
const appId = (ads.android && ads.android.appId) || "";
if (!/^ca-app-pub-\d+~\d+$/.test(appId)) fail("ads.config.json içinde android.appId eksik ya da hatalı.");

// 1) Uygulama adı
const strings = path.join(main, "res", "values", "strings.xml");
let st = fs.readFileSync(strings, "utf8");
const xmlEsc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "\\'");
st = st.replace(/(<string name="app_name">)[\s\S]*?(<\/string>)/, `$1${xmlEsc(DISPLAY_NAME)}$2`)
       .replace(/(<string name="title_activity_main">)[\s\S]*?(<\/string>)/, `$1${xmlEsc(DISPLAY_NAME)}$2`);
fs.writeFileSync(strings, st);

// 2) Manifest
const mf = path.join(main, "AndroidManifest.xml");
let m = fs.readFileSync(mf, "utf8");
if (!m.includes("xmlns:tools=")) m = m.replace("<manifest ", '<manifest xmlns:tools="http://schemas.android.com/tools" ');
if (!m.includes("com.google.android.gms.ads.APPLICATION_ID"))
  m = m.replace(/(<application[^>]*>)/, `$1\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${appId}"/>`);
else
  m = m.replace(/(android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value=")[^"]*"/, `$1${appId}"`);
if (!m.includes('android:screenOrientation='))
  m = m.replace(/(<activity\b)/, '$1\n            android:screenOrientation="portrait"');
// Bildirimler için kesin alarm gerekmiyor; Play Console'daki ek beyan formundan kurtarır.
if (!m.includes('SCHEDULE_EXACT_ALARM'))
  m = m.replace(/(<\/manifest>)/, '    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" tools:node="remove"/>\n$1');
fs.writeFileSync(mf, m);

console.log(`Android projesi güncellendi (ad: ${DISPLAY_NAME}, AdMob: ${appId}, dikey ekran).`);
