// Kök dizindeki oyun dosyalarını Capacitor'ün beklediği klasörlere kopyalar.
// www/    -> uygulamanın içine gömülen oyun
// assets/ -> simge ve açılış ekranı kaynakları
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const copy = (file, dir) => {
  const from = path.join(root, file);
  if (!fs.existsSync(from)) { console.error(`Eksik dosya: ${file}`); process.exit(1); }
  fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.copyFileSync(from, path.join(root, dir, path.basename(file)));
};

["index.html", "icerik-paketi.json"].forEach(f => copy(f, "www"));
["icon.png", "splash.png", "splash-dark.png"].forEach(f => copy(f, "assets"));
console.log("www/ ve assets/ klasörleri hazırlandı.");
