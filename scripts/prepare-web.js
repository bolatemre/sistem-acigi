// Kök dizindeki oyun dosyalarını Capacitor'ün beklediği klasörlere kopyalar.
// www/    -> uygulamanın içine gömülen oyun (index.html, native.js, içerik paketi)
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

["index.html", "icerik-paketi.json"].forEach(f => copy(f, "www"));
["icon.png", "splash.png", "splash-dark.png"].forEach(f => copy(f, "assets"));

// native.js'i reklam ayarlarıyla birlikte yaz
const ads = JSON.parse(fs.readFileSync(need("ads.config.json"), "utf8"));
delete ads._not;
const native = fs.readFileSync(need("native.js"), "utf8");
fs.writeFileSync(path.join(root, "www", "native.js"), `window.ADS_CONFIG = ${JSON.stringify(ads)};\n${native}`);

console.log("www/ ve assets/ klasörleri hazırlandı.");
