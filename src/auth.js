import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Re-use our adapter logic for the database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // Find the user in the database
        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email } 
        });
        
        if (!user || !user.hashedPassword) return null;
        
        // Compare the submitted password with the hashed one
        const passwordsMatch = await bcrypt.compare(credentials.password, user.hashedPassword);
        
        if (passwordsMatch) return user;
        
        return null; // Login failed
      }
    })
  ],
  callbacks: {
    // Attach the user's role and ID to the token so we can use it for routing
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Redirect here if not logged in
  },
  session: { strategy: "jwt" },
});