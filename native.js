/* Yeni Galata Dedektifi: telefona özel özellikler.
 * Bu dosya yalnızca mobil uygulamada (Capacitor) çalışır. Tarayıcıda oyun kendi örnek reklamlarını kullanır.
 * Reklam kimlikleri ads.config.json dosyasından gelir (derleme sırasında window.ADS_CONFIG olarak eklenir). */
(function () {
  const C = window.Capacitor;
  const isNative = !!(C && typeof C.isNativePlatform === "function" && C.isNativePlatform());
  const P = isNative ? C.Plugins : {};
  const CFG = window.ADS_CONFIG || {};
  const AdMob = P.AdMob, Prefs = P.Preferences;

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
    if (!AdMob || !CFG.rewarded) return;
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
      if (!ready) return resolve(false);
      let earned = false, done = false;
      const finish = ok => { if (done) return; done = true; prepRewarded(); resolve(ok); };
      const hs = [];
      try {
        hs.push(await AdMob.addListener("onRewardedVideoAdReward", () => { earned = true; }));
        hs.push(await AdMob.addListener("onRewardedVideoAdDismissed", () => { hs.forEach(h => h && h.remove && h.remove()); finish(earned); }));
        hs.push(await AdMob.addListener("onRewardedVideoAdFailedToShow", () => { hs.forEach(h => h && h.remove && h.remove()); finish(false); }));
        if (!rewardedLoaded) await prepRewarded();
        rewardedLoaded = false;
        await AdMob.showRewardVideoAd();
      } catch (e) { hs.forEach(h => h && h.remove && h.remove()); finish(false); }
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

  window.Native = {
    isNative,
    storage,
    ads: { get ready() { return ready; }, showRewarded, showInterstitial, showBanner, hideBanner },
    init
  };
  if (isNative) init();
})();
