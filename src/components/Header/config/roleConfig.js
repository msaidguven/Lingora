// src/components/Header/config/roleConfig.js
// Kullanıcı rolleriyle ilgili tüm tanımlar tek yerde toplanır.
// Yeni bir rol eklemek istersen sadece burayı güncelle.

export const ADMIN_ROLES = ["admin", "editor", "moderator"];

export const hasAdminAccess = (role) => ADMIN_ROLES.includes(role);

export const ROLE_LABELS = {
  admin:     "👑 Admin",
  editor:    "✏️ Editör",
  moderator: "🛡️ Moderatör",
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || "";
