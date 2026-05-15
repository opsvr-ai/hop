import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    username?: string;
    displayName?: string;
    isAdmin?: boolean;
    personalSpaceId?: string;
  }
  interface Session {
    user: {
      id?: string;
      username?: string;
      displayName?: string;
      isAdmin?: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    currentSpaceId?: string;
    personalSpaceId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    username?: string;
    displayName?: string;
    isAdmin?: boolean;
    personalSpaceId?: string;
    currentSpaceId?: string;
  }
}
