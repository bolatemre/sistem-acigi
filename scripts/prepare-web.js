// Derleme öncesi oyunu Capacitor'ün beklediği klasörlere hazırlar.
// www/    -> uygulamanın içine gömülen oyun
// assets/ -> simge ve açılış ekranı kaynakları
//
// yamalar.json ve yamalar-ek.json: index.html'e derleme sırasında sırayla uygulanan değişiklikler. Her yama:
//   {"find": "eski metin"}                 -> bu metin (dosyada tam bir kez geçmeli) değiştirilir
//   {"from": "başlangıç", "to": "bitiş"}   -> başlangıçtan bitişe kadar olan kısım değiştirilir (bitiş korunur)
//   ve yeni metin {"replace": "..."} ya da {"block": "NN"} ile verilir.
// yamalar.txt: büyük yeni kod parçaları; her biri "@@@@ NN" satırıyla başlar.
// kuzgun-piramidi.json: yerleşik içerik paketi; www/icerik.js olarak gömülür.
// vakalar/vaka-XX.json: elle yazılmış hikâye dosyaları; sırayla www/vakalar.js olarak gömülür.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const www = path.join(root, "www");
const fail = msg => { console.error("HATA: " + msg); process.exit(1); };
const need = file => { const p = path.join(root, file); if (!fs.existsSync(p)) fail(`Eksik dosya: ${file}`); return p; };
const count = (s, x) => s.split(x).length - 1;
fs.mkdirSync(www, { recursive: true });

// 1) index.html + yamalar (önce yamalar.json, sonra varsa yamalar-ek.json)
let html = fs.readFileSync(need("index.html"), "utf8").replace(/\r\n/g, "\n");
const blocks = {};
const bp = path.join(root, "yamalar.txt");
if (fs.existsSync(bp)){
  const parts = fs.readFileSync(bp, "utf8").replace(/\r\n/g, "\n").split(/^@@@@ (\w+)\n/m);
  for (let i = 1; i < parts.length; i += 2) blocks[parts[i]] = parts[i + 1];
}
["yamalar.json", "yamalar-ek.json"].forEach(file => {
  const yp = path.join(root, file);
  if (!fs.existsSync(yp)) return;
  const patches = JSON.parse(fs.readFileSync(yp, "utf8"));
  patches.forEach((p, i) => {
    const where = `${file} yama ${i + 1}`;
    const rep = p.block != null ? blocks[p.block] : p.replace;
    if (rep == null) fail(`${where}: yeni metin yok (blok ${p.block}).`);
    if (p.find != null){
      const n = count(html, p.find);
      if (n !== 1) fail(`${where} index.html içinde ${n} kez bulundu (1 olmalı). Başlangıcı: ${JSON.stringify(p.find.slice(0, 60))}`);
      html = html.replace(p.find, () => rep);
    } else {
      if (count(html, p.from) !== 1 || count(html, p.to) !== 1) fail(`${where}: başlangıç ya da bitiş çapası tek değil. ${JSON.stringify(p.from.slice(0, 50))}`);
      const a = html.indexOf(p.from), b = html.indexOf(p.to, a);
      if (b < 0) fail(`${where}: bitiş çapası başlangıçtan sonra yok.`);
      html = html.slice(0, a) + rep + html.slice(b);
    }
  });
  console.log(`${file}: ${patches.length} yama uygulandı.`);
});
fs.writeFileSync(path.join(www, "index.html"), html);

// 2) parçalı dosyalar (varsa)
fs.readdirSync(root).filter(f => f === "style.css" || /^oyun-.*\.js$/.test(f)).forEach(f => fs.copyFileSync(path.join(root, f), path.join(www, f)));

// 3) yerleşik içerik paketi
if (fs.existsSync(path.join(root, "kuzgun-piramidi.json"))){
  const pack = JSON.parse(fs.readFileSync(path.join(root, "kuzgun-piramidi.json"), "utf8"));
  fs.writeFileSync(path.join(www, "icerik.js"), `const DEFAULT_PACK = ${JSON.stringify(pack)};\n`);
  console.log(`İçerik paketi gömüldü: ${pack.id} sürüm ${pack.version}.`);
}

// 4) elle yazılmış hikâye dosyaları
const vdir = path.join(root, "vakalar");
if (fs.existsSync(vdir)){
  const files = fs.readdirSync(vdir).filter(f => /^vaka-\d+\.json$/.test(f)).sort();
  const cases = files.map(f => {
    let d;
    try { d = JSON.parse(fs.readFileSync(path.join(vdir, f), "utf8")); } catch (e) { fail(`${f} okunamadı: ${e.message}`); }
    const ids = new Set(d.suspects.map(s => s.id));
    if (!ids.has(d.culprit)) fail(`${f}: suçlu (${d.culprit}) şüpheliler arasında yok.`);
    d.clues.forEach(c => { if (c.points && !ids.has(c.points)) fail(`${f}: ${c.id} ipucu olmayan bir şüpheliyi gösteriyor.`); });
    return d;
  });
  fs.writeFileSync(path.join(www, "vakalar.js"), `const STORY_CASES = ${JSON.stringify(cases)};\n`);
  console.log(`${cases.length} hikâye dosyası gömüldü.`);
}

// 5) native.js + reklam ayarları
const ads = JSON.parse(fs.readFileSync(need("ads.config.json"), "utf8"));
delete ads._not;
fs.writeFileSync(path.join(www, "native.js"), `window.ADS_CONFIG = ${JSON.stringify(ads)};\n${fs.readFileSync(need("native.js"), "utf8")}`);

// 6) index.html'in istediği her dosya www içinde var mı?
const wanted = [...html.matchAll(/(?:src|href)="([^":]+\.(?:js|css))"/g)].map(m => m[1]);
const missing = wanted.filter(f => !fs.existsSync(path.join(www, f)));
if (missing.length) fail("index.html şu dosyaları istiyor ama bulunamadı: " + missing.join(", "));

// 7) simge ve açılış ekranı
fs.mkdirSync(path.join(root, "assets"), { recursive: true });
["icon.png", "splash.png", "splash-dark.png"].forEach(f => fs.copyFileSync(need(f), path.join(root, "assets", f)));

console.log("www/ ve assets/ hazırlandı.");
