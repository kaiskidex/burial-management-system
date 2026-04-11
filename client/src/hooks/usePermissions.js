import { useAuth } from "../contexts/AuthContexts";


const rolePermissions = {
  public: [
    "view_dashboard",
    "view_cemetery_map",
    "submit_permits",
  ],
  staff: [
    "view_dashboard",
    "view_cemetery_map",
    "view_burial_records",
    "add_burial_records",
    "edit_burial_records",
    "view_leases",
    "manage_leases",
    "view_permits",
    "manage_permits",
    "view_reports",
    "generate_reports",
  ],
  admin: [
    "view_dashboard",
    "view_cemetery_map",
    "view_burial_records",
    "add_burial_records",
    "edit_burial_records",
    "delete_burial_records",
    "view_leases",
    "manage_leases",
    "view_permits",
    "manage_permits",
    "submit_permits",
    "view_reports",
    "generate_reports",
    "view_settings",
    "manage_users",
    "change_verification_code",
  ],
};

export function usePermissions() {
  const { user, isPublic, isStaff, isAdmin } = useAuth();

  const hasPermission = (permission) => {
    if (!user) return false;
    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    return permissions.every((permission) => hasPermission(permission));
  };

  const canViewPage = (page) => {
    switch (page) {
      case "dashboard":
        return hasPermission("view_dashboard");
      case "cemetery-map":
        return hasPermission("view_cemetery_map");
      case "burial-records":
        return hasPermission("view_burial_records");
      case "leases":
        return hasPermission("view_leases");
      case "permits":
        return hasPermission("view_permits") || hasPermission("submit_permits");
      case "reports":
        return hasPermission("view_reports");
      case "settings":
        return hasPermission("view_settings");
      default:
        return false;
    }
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewPage,
    isPublic,
    isStaff,
    isAdmin,
  };
}