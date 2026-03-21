import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    status?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    status?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
  }
}
