export type MoneyShellView = "dashboard" | "group";

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

  return {
    view: "dashboard",
    selectedGroupId: null,
  };
}

export function getDashboardPath() {
  return "/dashboard";
}

export function getGroupPath(groupId: string) {
  return `/group/${encodeURIComponent(groupId)}`;
}
