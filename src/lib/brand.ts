export const BRAND = "Coltrane Air";
export const BRAND_SHORT = "Coltrane Air";
export const BRAND_TAGLINE = "Luxury in Perfect Harmony.";
export const ADMIN_EMAIL = "blackhatterxvi@gmail.com";
export const OWNER_EMAIL = "dejuanetimmes@gmail.com";
export const LAUNCH_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
})();