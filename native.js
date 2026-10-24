/* Yeni Galata Dedektifi: telefona özel özellikler.
 * Bu dosya yalnızca mobil uygulamada (Capacitor) çalışır. Tarayıcıda oyun kendi örnek reklamlarını kullanır.
 * Reklam kimlikleri ads.config.json dosyasından gelir (derleme sırasında window.ADS_CONFIG olarak eklenir).
 * showRewarded: true = ödül kazanıldı, false = reklam erken kapatıldı, "nofill" = gösterilecek reklam yoktu. */
(function () {
  const C = window.Capacitor;
  const isNative = !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
  const P = isNative ? C.Plugins : {};
  // Android kendi reklam kimliklerini ads.config.json > android bölümünden alır.
  const PLAT = isNative && typeof C.getPlatform === "function" ? C.getPlatform() : "web";
  const BASE = window.ADS_CONFIG || {};
  const pick = src => PLAT === "android" ? Object.assign({}, src, src.android || {}) : Object.assign({}, src);
  const CFG = pick(BASE);

  // Reklam birimleri ve deneme/canlı modu açılışta depodan okunur; böylece değiştirmek için güncelleme gerekmez.
  // Uygulama kimliği (appId) pakete gömülüdür ve buradan değişmez.
  const REMOTE = "https://raw.githubusercontent.com/bolatemre/sistem-acigi/main/ads.config.json";
  const UNIT = /^ca-app-pub-\d+\/\d+$/;
  function applyRemote(j) {
    if (!j || typeof j !== "object") return;
    const p = pick(j);
    ["rewarded", "interstitial", "banner"].forEach(k => { if (UNIT.test(String(p[k] || ""))) CFG[k] = p[k]; });
    if (typeof p.testing === "boolean") CFG.testing = p.testing;
  }
  async function loadRemote() {
    try { const c = localStorage.getItem("ads-remote"); if (c) applyRemote(JSON.parse(c)); } catch (e) {}
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(REMOTE + "?t=" + Date.now(), { signal: ctl.signal, cache: "no-store" });
      clearTimeout(t);
      if (r.ok) { const j = await r.json(); applyRemote(j); localStorage.setItem("ads-remote", JSON.stringify(j)); }
    } catch (e) {}
  }
  const AdMob = P.AdMob, Prefs = P.Preferences, LN = P.LocalNotifications;

  /* ---------- kalıcı kayıt ---------- */
  // Oyun localStorage kullanır; burada her kaydı uygulamanın kalıcı hafızasına da yazarız.
  // iOS localStorage'ı silerse, açılışta kalıcı hafızadan geri yüklenir.
  const storage = {
    mirror(key, value) { if (Prefs) Prefs.set({ key, value: String(value) }).catch(() => {}); },
    remove(key) { if (Prefs) Prefs.remove({ key }).catch(() => {}); },
    async restore(keys) {
      if (!Prefs) return false;
      let restored = false;
      for (const key of keys) {
        try {
          if (localStorage.getItem(key)) continue;
          const r = await Prefs.get({ key });
          if (r && r.value){ localStorage.setItem(key, r.value); restored = true; }
        } catch (e) {}
      }
      return restored;
    }
  };

  /* ---------- reklamlar ---------- */
  let ready = false, rewardedLoaded = false, interLoaded = false, bannerOn = false;
  const prepRewarded = () => AdMob.prepareRewardVideoAd({ adId: CFG.rewarded, isTesting: !!CFG.testing }).then(() => { rewardedLoaded = true; }).catch(() => { rewardedLoaded = false; });
  const prepInter = () => AdMob.prepareInterstitial({ adId: CFG.interstitial, isTesting: !!CFG.testing }).then(() => { interLoaded = true; }).catch(() => { interLoaded = false; });

  async function init() {
    if (!AdMob) return;
    await loadRemote();
    if (!CFG.rewarded) return;
    try {
      await AdMob.initialize({ initializeForTesting: !!CFG.testing });
      // iOS takip izni (App Tracking Transparency)
      try { const t = await AdMob.trackingAuthorizationStatus(); if (t && t.status === "notDetermined") await AdMob.requestTrackingAuthorization(); } catch (e) {}
      // AB kullanıcıları için Google rıza formu
      try { const c = await AdMob.requestConsentInfo(); if (c && c.isConsentFormAvailable && c.status === "REQUIRED") await AdMob.showConsentForm(); } catch (e) {}
      ready = true;
      prepRewarded(); prepInter();
    } catch (e) { ready = false; }
  }

  function showRewarded() {
    return new Promise(async resolve => {
      if (!ready) return resolve("nofill");
      let earned = false, done = false;
      const finish = ok => { if (done) return; done = true; prepRewarded(); resolve(ok); };
      const hs = [];
      try {
        hs.push(await AdMob.addListener("onRewardedVideoAdReward", () => { earned = true; }));
        hs.push(await AdMob.addListener("onRewardedVideoAdDismissed", () => { hs.forEach(h => h && h.remove && h.remove()); finish(earned); }));
        hs.push(await AdMob.addListener("onRewardedVideoAdFailedToShow", () => { hs.forEach(h => h && h.remove && h.remove()); finish("nofill"); }));
        if (!rewardedLoaded) await prepRewarded();
        rewardedLoaded = false;
        await AdMob.showRewardVideoAd();
      } catch (e) { hs.forEach(h => h && h.remove && h.remove()); finish("nofill"); }
    });
  }

  async function showInterstitial() {
    if (!ready) return;
    try { if (!interLoaded) await prepInter(); interLoaded = false; await AdMob.showInterstitial(); } catch (e) {}
    prepInter();
  }

  function showBanner(marginBottom) {
    if (!ready || !CFG.banner || bannerOn) return;
    bannerOn = true;
    AdMob.showBanner({ adId: CFG.banner, position: "BOTTOM_CENTER", margin: Math.round(marginBottom || 0), isTesting: !!CFG.testing }).catch(() => { bannerOn = false; });
  }
  function hideBanner() {
    if (!bannerOn) return;
    bannerOn = false;
    AdMob.removeBanner().catch(() => {});
  }

  /* ---------- yerel bildirimler ---------- */
  // Takip bittiğinde, laboratuvar sonucu geldiğinde ve yeni dosya açıldığında haber verir.
  let notifPerm = null;
  async function notifReady() {
    if (!LN) return false;
    if (notifPerm !== null) return notifPerm;
    try {
      let p = await LN.checkPermissions();
      if (p.display !== "granted") p = await LN.requestPermissions();
      notifPerm = p.display === "granted";
    } catch (e) { notifPerm = false; }
    return notifPerm;
  }
  const notify = {
    async schedule(id, title, body, at) {
      if (!(await notifReady())) return;
      try {
        await LN.cancel({ notifications: [{ id }] }).catch(() => {});
        // isExactNotification:false -> Android "Alarmlar ve hatırlatıcılar" iznini istemez; birkaç dakikalık gecikme sorun değil.
        await LN.schedule({ notifications: [{ id, title, body, schedule: { at: new Date(at), allowWhileIdle: true }, isExactNotification: false }] });
      } catch (e) {}
    },
    cancel(id) { if (LN) LN.cancel({ notifications: [{ id }] }).catch(() => {}); }
  };

  window.Native = {
    isNative,
    storage,
    ads: { get ready() { return ready; }, showRewarded, showInterstitial, showBanner, hideBanner },
    notify,
    init
  };
  if (isNative) init();
})();
