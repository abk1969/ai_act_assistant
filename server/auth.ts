import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { SafeUser, LoginUser, RegisterUser } from "@shared/schema";

// Session configuration
export function getSession() {
  // Require SESSION_SECRET in non-test environments
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV !== 'test') {
    throw new Error('SESSION_SECRET environment variable is required');
  }
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "test-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

// Password utilities
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// User authentication utilities
export class AuthService {
  // Normalize email to lowercase for consistency
  private static normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  static async registerUser(userData: RegisterUser): Promise<SafeUser> {
    // Normalize email and hash the password before storing
    const normalizedEmail = this.normalizeEmail(userData.email);
    const passwordHash = await PasswordUtils.hash(userData.password);
    
    try {
      const { password, ...userDataWithoutPassword } = userData;
      const newUser = await storage.upsertUser({
        ...userDataWithoutPassword,
        email: normalizedEmail,
        passwordHash,
      });

      // Return user without password hash
      const { passwordHash: _, ...safeUser } = newUser;
      return safeUser;
    } catch (error: any) {
      // Handle unique constraint violation for email
      if (error.code === '23505' || error.message?.includes('unique')) {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  static async authenticateUser(email: string, password: string): Promise<SafeUser | null> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await storage.getUserByEmail(normalizedEmail);
    if (!user) {
      return null;
    }

    const isValidPassword = await PasswordUtils.verify(password, user.passwordHash);
    if (!isValidPassword) {
      return null;
    }

    // Return user without password hash
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

// Passport configuration
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await AuthService.authenticateUser(email, password);
        if (user) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid email or password' });
        }
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        const { passwordHash: _, ...safeUser } = user;
        done(null, safeUser);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error);
    }
  });
}

// Test mode middleware for Playwright tests
const testModeUser: SafeUser = {
  id: "test-user-id",
  email: "test@test.com",
  firstName: "Test",
  lastName: "User",
  profileImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // TEST MODE: Skip authentication entirely when TEST_MODE=true
  if (process.env.TEST_MODE === 'true') {
    // SECURITY: Only allow in development, never in production
    if (process.env.NODE_ENV === 'production') {
      console.error('SECURITY ERROR: TEST_MODE cannot be enabled in production!');
      return res.status(500).json({ message: "Internal server error" });
    }
    
    console.log('TEST_MODE enabled: injecting mock user for testing');
    req.user = testModeUser;
    return next();
  }

  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};