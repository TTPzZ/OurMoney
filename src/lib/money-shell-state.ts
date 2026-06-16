export type MoneyShellView = "dashboard" | "group" | "profile";

export interface MoneyShellState {
  view: MoneyShellView;
  selectedGroupId: string | null;
}

export function getMoneyViewFromPathname(pathname: string): MoneyShellState {
  const [, firstSegment, secondSegment] = pathname.split("/");

  if (firstSegment === "group" && secondSegment) {
    return {
      view: "group",
      selectedGroupId: decodeURIComponent(secondSegment),
    };
  }

  if (firstSegment === "profile") {
    return {
      view: "profile",
      selectedGroupId: null,
    };
  }

  return {
    view: "dashboard",
    selectedGroupId: null,
  };
}

export function getDashboardPath() {
  return "/dashboard";
}

export function getProfilePath() {
  return "/profile";
}

export function getGroupPath(groupId: string) {
  return `/group/${encodeURIComponent(groupId)}`;
}
