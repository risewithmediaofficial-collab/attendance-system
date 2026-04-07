import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    memberId?: string;
    role?: string;
    user?: {
      userId?: string;
      memberId?: string;
      role?: string;
    };
  }
}

