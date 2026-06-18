export const BRAND = "Air 5 Wing Pilots USA";
export const BRAND_SHORT = "Air 5 Wing";
export const BRAND_TAGLINE = "Private aviation, redefined.";
export const ADMIN_EMAIL = "blackhatterxvi@gmail.com";
export const LAUNCH_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
})();
