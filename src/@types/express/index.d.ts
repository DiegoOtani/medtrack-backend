declare global {
  namespace Express {
    interface Request {
      user: Partial<User>;
    }
  }
}

export {};
