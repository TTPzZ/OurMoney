export interface PublicUser {
  _id: string;
  name: string;
  image?: string;
  email?: string;
  customName?: string;
  customImage?: string;
  googleName?: string;
  googleImage?: string;
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
  googleName?: string | null;
  googleImage?: string | null;
  customName?: string | null;
  customImage?: string | null;
}

export interface PublicUserDocument {
  _id: { toString(): string } | string;
  name?: string | null;
  image?: string | null;
  email?: string | null;
  googleName?: string | null;
  googleImage?: string | null;
  customName?: string | null;
  customImage?: string | null;
  updatedAt?: Date | string | number | null;
  createdAt?: Date | string | number | null;
}

export const USER_PUBLIC_SELECT = "name image googleName googleImage customName customImage createdAt updatedAt";

export function buildExistingGoogleUserPatch(
  existingUser: StoredGoogleUserFields,
  googleProfile: GoogleProfileFields,
) {
  const patch: {
    email?: string;
    googleId?: string;
    googleName?: string;
    googleImage?: string;
    customName?: string;
    customImage?: string;
  } = {};

  if (!existingUser.email && googleProfile.email) {
    patch.email = googleProfile.email;
  }

  if (!existingUser.googleId && googleProfile.googleId) {
    patch.googleId = googleProfile.googleId;
  }

  if (googleProfile.name && existingUser.googleName !== googleProfile.name) {
    patch.googleName = googleProfile.name;
  }

  if (googleProfile.image && existingUser.googleImage !== googleProfile.image) {
    patch.googleImage = googleProfile.image;
  }

  if (!existingUser.customName && existingUser.name && googleProfile.name && existingUser.name !== googleProfile.name) {
    patch.customName = existingUser.name;
  }

  if (
    !existingUser.customImage &&
    existingUser.image &&
    existingUser.image.startsWith("data:image/") &&
    existingUser.image !== googleProfile.image
  ) {
    patch.customImage = existingUser.image;
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
  const versionValue = version instanceof Date ? version.getTime() : version ?? undefined;
  const customImage = getPublicUserImage(id, user.customImage, versionValue);
  const displayImage = customImage || getPublicUserImage(id, user.googleImage || user.image, versionValue);
  const displayName = user.customName || user.googleName || user.name || user.email || "User";

  return {
    _id: id,
    name: displayName,
    image: displayImage,
    email: user.email ?? undefined,
    customName: user.customName || undefined,
    customImage,
    googleName: user.googleName || undefined,
    googleImage: user.googleImage || undefined,
  };
}

export function getGroupDetailCachePredicate() {
  return (key: unknown) => typeof key === "string" && key.startsWith("/api/groups/");
}
