import NextAuth, { type DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import connectDB from "./lib/db"
import User from "./models/User"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"]
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const googleId = profile?.sub as string;
          
          if (!googleId) return false;

          const existingUser = await User.findOne({ googleId });
          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              googleId,
            });
          } else {
            // Sync latest name and image from Google
            existingUser.name = user.name as string;
            existingUser.image = user.image as string;
            if (user.email) existingUser.email = user.email;
            await existingUser.save();
          }
          return true;
        } catch (error) {
          console.error("Error during Google sign in sync:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile, trigger, session }) {
      if (account && profile && account.provider === "google") {
        token.sub = profile.sub as string;
      }
      
      if (trigger === "update" && session) {
        token.name = session.name;
        token.picture = session.image;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        try {
          await connectDB();
          const dbUser = (await User.findOne({ googleId: token.sub }).lean()) as any;
          if (dbUser) {
            session.user.id = dbUser._id.toString();
            session.user.name = dbUser.name as string;
            session.user.image = dbUser.image as string;
          }
        } catch (error) {
          console.error("Error fetching session user from DB:", error);
        }
      }
      return session;
    }
  },
})
