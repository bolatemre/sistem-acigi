// "npx cap sync ios" sonrasında otomatik çalışır (package.json > capacitor:sync:after).
// iOS Info.plist dosyasına AdMob ve gizlilik ayarlarını ekler, ana ekran adını yazar, uygulamayı yalnızca iPhone ve dikey ekran yapar.
const fs = require("fs");
const path = require("path");

if (process.env.CAPACITOR_PLATFORM_NAME && process.env.CAPACITOR_PLATFORM_NAME !== "ios") process.exit(0);
const root = process.env.CAPACITOR_ROOT_DIR || path.join(__dirname, "..");
const plist = path.join(root, "ios", "App", "App", "Info.plist");
if (!fs.existsSync(plist)) { console.log("Info.plist bulunamadı, atlanıyor."); process.exit(0); }

const ads = JSON.parse(fs.readFileSync(path.join(root, "ads.config.json"), "utf8"));
const cap = JSON.parse(fs.readFileSync(path.join(root, "capacitor.config.json"), "utf8"));
let s = fs.readFileSync(plist, "utf8");
const has = key => s.includes(`<key>${key}</key>`);
const add = xml => { s = s.replace(/<\/dict>\s*<\/plist>\s*$/, `${xml}\n</dict>\n</plist>\n`); };
const xmlEsc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Ana ekranda görünen ad
if (cap.appName){
  if (has("CFBundleDisplayName")) s = s.replace(/(<key>CFBundleDisplayName<\/key>\s*<string>)[\s\S]*?(<\/string>)/, `$1${xmlEsc(cap.appName)}$2`);
  else add(`\t<key>CFBundleDisplayName</key>\n\t<string>${xmlEsc(cap.appName)}</string>`);
}

if (!has("GADApplicationIdentifier")) add(`\t<key>GADApplicationIdentifier</key>\n\t<string>${ads.appId}</string>`);
if (!has("SKAdNetworkItems")) add(`\t<key>SKAdNetworkItems</key>\n\t<array>\n\t\t<dict>\n\t\t\t<key>SKAdNetworkIdentifier</key>\n\t\t\t<string>cstr6suwn9.skadnetwork</string>\n\t\t</dict>\n\t</array>`);
if (!has("NSUserTrackingUsageDescription")) add(`\t<key>NSUserTrackingUsageDescription</key>\n\t<string>Bu izin, oyunda sana daha uygun reklamlar gösterilmesi için kullanılır. İzin vermesen de oyun aynı şekilde çalışır.</string>`);
if (!has("ITSAppUsesNonExemptEncryption")) add(`\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>`);

// Yalnızca dikey ekran
const portrait = `<array>\n\t\t<string>UIInterfaceOrientationPortrait</string>\n\t</array>`;
s = s.replace(/(<key>UISupportedInterfaceOrientations<\/key>\s*)<array>[\s\S]*?<\/array>/, `$1${portrait}`);
s = s.replace(/\s*<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>/, "");
if (!has("UISupportedInterfaceOrientations")) add(`\t<key>UISupportedInterfaceOrientations</key>\n\t${portrait}`);
if (!has("UIRequiresFullScreen")) add(`\t<key>UIRequiresFullScreen</key>\n\t<true/>`);

fs.writeFileSync(plist, s);

// Yalnızca iPhone (iPad ekran görüntüsü gerekmez)
const pbx = path.join(root, "ios", "App", "App.xcodeproj", "project.pbxproj");
if (fs.existsSync(pbx)){
  const p = fs.readFileSync(pbx, "utf8").replace(/TARGETED_DEVICE_FAMILY = "?1,2"?;/g, "TARGETED_DEVICE_FAMILY = 1;");
  fs.writeFileSync(pbx, p);
}
console.log(`Info.plist ve proje güncellendi (ad: ${cap.appName}, AdMob, takip izni, şifreleme beyanı, yalnızca iPhone, dikey ekran).`);
