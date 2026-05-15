import { db } from "@/lib/db";

const PERMISSION_CACHE = new Map<string, Set<string>>();

export async function resolvePermissions(roleNames: string[]): Promise<string[]> {
  const key = [...roleNames].sort().join(",");
  if (PERMISSION_CACHE.has(key)) {
    return [...PERMISSION_CACHE.get(key)!];
  }

  const permissions = await db.permission.findMany({
    where: {
      rolePermissions: {
        some: { role: { name: { in: roleNames } } },
      },
    },
    select: { key: true },
  });

  const set = new Set(permissions.map((p) => p.key));
  PERMISSION_CACHE.set(key, set);
  return [...set];
}

export function clearPermissionCache() {
  PERMISSION_CACHE.clear();
}

export function hasPermission(
  userPermissions: string[] | undefined,
  required: string,
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;

  return userPermissions.some((p) => {
    if (p.endsWith(":*")) {
      const prefix = p.slice(0, -2);
      return required === prefix || required.startsWith(prefix + ":");
    }
    return p === required;
  });
}
