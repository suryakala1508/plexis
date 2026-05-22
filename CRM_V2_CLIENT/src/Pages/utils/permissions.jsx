import React from "react";

/* ---------------- ROUTE RESOLUTION ---------------- */

// Ordered list of pages matching the sidebar definition (pageid -> path)
const PAGE_ROUTE_MAP = [
  { pageid: "1",  path: "/dashboard" },
  { pageid: "2",  path: "/calendar" },
  { pageid: "3",  path: "/leads" },
  { pageid: "10", path: "/templates" },
  { pageid: "11", path: "/pricing" },
  { pageid: "4",  path: "/project" },
  { pageid: "5",  path: "/clients" },
  { pageid: "6",  path: "/accounts/overview" },
  { pageid: "7",  path: "/crew" },
  { pageid: "8",  path: "/inventory" },
  { pageid: "9",  path: "/studio/profile" },
];

/**
 * Returns the first route path the user has access to based on their session.
 * Admins (role === "1") always go to /dashboard.
 * RBA users go to the first page where pages[pageid] === true.
 * Fallback: "/studio/profile" (pageid 9 — always accessible for staff).
 */
export const getFirstAccessiblePath = (session) => {
  const user = session?.data || session;
  if (!user) return "/login";
  if (String(user.role) === "1") return "/dashboard";

  for (const { pageid, path } of PAGE_ROUTE_MAP) {
    if (user.pages?.[pageid] === true) return path;
  }

  // Absolute fallback
  return "/studio/profile";
};
import { useSession } from "@/contexts/SessionContext";
import { useUser } from "@/contexts/UserContext";

/* ---------------- CORE CHECKS ---------------- */

const getComp = (user, componentId) =>
  user?.components?.[String(componentId)];

export const canView = (user, pageId, componentId) => {
  if (!user) return false;
  if (String(user.role) === "1") return true;

  if (!user.pages?.[String(pageId)]) return false;
  if (!componentId) return true;

  const comp = getComp(user, componentId);
  return comp?.view === true || comp?.edit === true;
};

export const canEdit = (user, pageId, componentId) => {
  if (!user) return false;
  if (String(user.role) === "1") return true;

  if (!user.pages?.[String(pageId)]) return false;
  if (!componentId) return false;

  const comp = getComp(user, componentId);
  return comp?.edit === true;
};

export const canDeny = (user, pageId, componentId) => {
  if (!user) return false;   // ✅ CRITICAL FIX

  if (String(user.role) === "1") return false;

  if (!user.pages?.[String(pageId)]) return true;

  if (!componentId) return false;

  const comp = user.components?.[String(componentId)];
  return comp?.deny === true;
};


/* ---------------- PERMISSION GATE ---------------- */

export const PermissionGate = ({
  page,
  component,
  action = "view", // view | edit
  children,
  fallback = null,
  mode = "hide",
}) => {
  const { session, loadingSession } = useSession();
  const { user: contextUser, loading: loadingUser } = useUser();

  // Robustly resolve the user object
  // session = JWT payload (has role/pages/components), set by SessionContext after /auth/verify
  // session?.data handles the case where session is still a wrapped object
  const rawUser = session?.data || session;
  const activeUser = (rawUser?.role ? rawUser : null) || contextUser;

  // We only show the fallback if BOTH are loading and we don't have a user yet
  if ((loadingSession || loadingUser) && !activeUser) {
    return fallback;
  }

  if (!activeUser) return fallback;

  const denied = canDeny(activeUser, page, component);
  const canSee = canView(activeUser, page, component);
  const canModify = canEdit(activeUser, page, component);

  let allowed = false;

  // 🔥 DENY ALWAYS FIRST
  if (denied) {
    allowed = false;
  } else if (action === "edit") {
    allowed = canModify;
  } else {
    allowed = canSee;
  }

  if (allowed) return children;

  if (mode === "disable" && React.isValidElement(children)) {
    return React.cloneElement(children, { disabled: true });
  }

  return fallback;
};

/* ---------------- PAGE GUARD ---------------- */

export const PageGuard = ({ page, children }) => {
  return (
    <PermissionGate page={page} action="view" fallback={<div className="h-screen w-full flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div></div>}>
      {children}
    </PermissionGate>
  );
};
