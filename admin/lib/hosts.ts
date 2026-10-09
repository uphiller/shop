export function getShopHostname(): string {
  return (
    process.env.SHOP_HOSTNAME ??
    process.env.NEXT_PUBLIC_SHOP_HOSTNAME ??
    "shop.bettercodelab.com"
  );
}

export function getAdminHostname(): string {
  return (
    process.env.ADMIN_HOSTNAME ??
    process.env.NEXT_PUBLIC_ADMIN_HOSTNAME ??
    "admin.bettercodelab.com"
  );
}

export function shopOrigin(): string {
  return `https://${getShopHostname()}`;
}

export function adminOrigin(): string {
  return `https://${getAdminHostname()}`;
}
