// Kök dizindeki oyun dosyalarını Capacitor'ün beklediği klasörlere kopyalar.
// www/    -> uygulamanın içine gömülen oyun (index.html, style.css, icerik.js, oyun-*.js, native.js)
// assets/ -> simge ve açılış ekranı kaynakları
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const need = file => {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) { console.error(`Eksik dosya: ${file}`); process.exit(1); }
  return p;
};
const copy = (file, dir) => {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.copyFileSync(need(file), path.join(root, dir, path.basename(file)));
};

// Oyun dosyaları: index.html zorunlu, parçalı dosyalar varsa onlar da kopyalanır
copy("index.html", "www");
const parts = fs.readdirSync(root).filter(f => f === "style.css" || f === "icerik.js" || /^oyun-.*\.js$/.test(f));
parts.forEach(f => copy(f, "www"));

// index.html'in istediği her dosya gerçekten var mı?
const html = fs.readFileSync(need("index.html"), "utf8");
const wanted = [...html.matchAll(/(?:src|href)="([^":]+\.(?:js|css))"/g)].map(m => m[1]).filter(f => f !== "native.js");
const missing = wanted.filter(f => !fs.existsSync(path.join(root, f)));
if (missing.length) { console.error("index.html şu dosyaları istiyor ama depoda yok: " + missing.join(", ")); process.exit(1); }

["icon.png", "splash.png", "splash-dark.png"].forEach(f => copy(f, "assets"));

// native.js'i reklam ayarlarıyla birlikte yaz
const ads = JSON.parse(fs.readFileSync(need("ads.config.json"), "utf8"));
delete ads._not;
const native = fs.readFileSync(need("native.js"), "utf8");
fs.writeFileSync(path.join(root, "www", "native.js"), `window.ADS_CONFIG = ${JSON.stringify(ads)};\n${native}`);

console.log(`www/ hazırlandı (${parts.length + 1} oyun dosyası), assets/ hazırlandı.`);
