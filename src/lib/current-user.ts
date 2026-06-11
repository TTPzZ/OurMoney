export interface PublicUser {
  _id: string;
  name: string;
  image?: string;
  email?: string;
}

export interface GoogleProfileFields {
  email?: string | null;
  googleId?: string | null;
  name?: string | null;
  image?: string | null;
}

export interface StoredGoogleUserFields extends GoogleProfileFields {
  email?: string | null;
  googleId?: string | null;
}

export interface PublicUserDocument {
  _id: { toString(): string } | string;
  name: string;
  image?: string | null;
  email?: string | null;
  updatedAt?: Date | string | null;
  createdAt?: Date | string | null;
}

export function buildExistingGoogleUserPatch(
  existingUser: StoredGoogleUserFields,
  googleProfile: GoogleProfileFields,
) {
  const patch: { email?: string; googleId?: string } = {};

  if (!existingUser.email && googleProfile.email) {
    patch.email = googleProfile.email;
  }

  if (!existingUser.googleId && googleProfile.googleId) {
    patch.googleId = googleProfile.googleId;
  }

  return patch;
}

export function getPublicUserImage(userId: string, image?: string | null, version?: string | number | Date) {
  if (!image) return undefined;

  if (image.startsWith("data:image/")) {
    const value = version instanceof Date ? version.getTime() : version;
    const cacheKey = value ?? Date.now();
    return `/api/user/avatar?userId=${encodeURIComponent(userId)}&v=${encodeURIComponent(String(cacheKey))}`;
  }

  return image;
}

export function toPublicUser(user: PublicUserDocument): PublicUser {
  const id = user._id.toString();
  const version = user.updatedAt ?? user.createdAt;

  return {
    _id: id,
    name: user.name,
    image: getPublicUserImage(id, user.image, version instanceof Date ? version.getTime() : version ?? undefined),
    email: user.email ?? undefined,
  };
}

export function getGroupDetailCachePredicate() {
  return (key: unknown) => typeof key === "string" && key.startsWith("/api/groups/");
}
