/** Shared sort helpers for BD / agency host tables (admin + BD portal). */

export type HostCountSortOption = 'default' | 'hosts_desc' | 'hosts_asc' | 'name_asc';

export const HOST_COUNT_SORT_OPTIONS: { value: HostCountSortOption; label: string }[] = [
  { value: 'default', label: 'Recently added' },
  { value: 'hosts_desc', label: 'Most hosts → fewest' },
  { value: 'hosts_asc', label: 'Fewest hosts → most' },
  { value: 'name_asc', label: 'Name (A–Z)' },
];

export function agencyRowLabel(displayName: string | null | undefined, email: string): string {
  return (displayName && displayName.trim()) || email;
}

export function sortByHostCount<T extends { hostCount: number; createdAt?: string }>(
  rows: T[],
  sort: HostCountSortOption,
  label: (row: T) => string
): T[] {
  const copy = [...rows];
  switch (sort) {
    case 'hosts_desc':
      return copy.sort(
        (a, b) => b.hostCount - a.hostCount || label(a).localeCompare(label(b))
      );
    case 'hosts_asc':
      return copy.sort(
        (a, b) => a.hostCount - b.hostCount || label(a).localeCompare(label(b))
      );
    case 'name_asc':
      return copy.sort((a, b) =>
        label(a).localeCompare(label(b), undefined, { sensitivity: 'base' })
      );
    default:
      if (copy[0]?.createdAt) {
        return copy.sort(
          (a, b) =>
            new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        );
      }
      return copy;
  }
}

export type BdListSortOption = 'default' | 'hosts_desc' | 'hosts_asc' | 'agencies_desc' | 'name_asc';

export const BD_LIST_SORT_OPTIONS: { value: BdListSortOption; label: string }[] = [
  { value: 'default', label: 'Recently added' },
  { value: 'hosts_desc', label: 'Most hosts (all agencies) → fewest' },
  { value: 'hosts_asc', label: 'Fewest hosts → most' },
  { value: 'agencies_desc', label: 'Most agencies → fewest' },
  { value: 'name_asc', label: 'BD name (A–Z)' },
];

export function bdDisplayName(
  displayName: string | null | undefined,
  email: string
): string {
  return (displayName && displayName.trim()) || email;
}

export function sortBdRows<
  T extends {
    totalHostCount: number;
    agencyCount: number;
    createdAt: string;
    displayName: string | null;
    email: string;
  },
>(rows: T[], sort: BdListSortOption): T[] {
  const copy = [...rows];
  switch (sort) {
    case 'hosts_desc':
      return copy.sort(
        (a, b) =>
          b.totalHostCount - a.totalHostCount ||
          bdDisplayName(a.displayName, a.email).localeCompare(
            bdDisplayName(b.displayName, b.email)
          )
      );
    case 'hosts_asc':
      return copy.sort(
        (a, b) =>
          a.totalHostCount - b.totalHostCount ||
          bdDisplayName(a.displayName, a.email).localeCompare(
            bdDisplayName(b.displayName, b.email)
          )
      );
    case 'agencies_desc':
      return copy.sort(
        (a, b) =>
          b.agencyCount - a.agencyCount ||
          b.totalHostCount - a.totalHostCount
      );
    case 'name_asc':
      return copy.sort((a, b) =>
        bdDisplayName(a.displayName, a.email).localeCompare(
          bdDisplayName(b.displayName, b.email),
          undefined,
          { sensitivity: 'base' }
        )
      );
    default:
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}
