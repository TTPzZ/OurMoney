import NextAuth, { type DefaultSession } from "next-auth"
import Facebook from "next-auth/providers/facebook"
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
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "facebook") {
        try {
          await connectDB();
          const facebookId = profile?.id as string;
          
          if (!facebookId) return false;

          const existingUser = await User.findOne({ facebookId });
          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              facebookId,
            });
          } else {
            // Sync latest name and image from Facebook
            existingUser.name = user.name as string;
            existingUser.image = user.image as string;
            if (user.email) existingUser.email = user.email;
            await existingUser.save();
          }
          return true;
        } catch (error) {
          console.error("Error during Facebook sign in sync:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account && profile && account.provider === "facebook") {
        token.sub = profile.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ facebookId: token.sub });
          if (dbUser) {
            session.user.id = dbUser._id.toString();
          }
        } catch (error) {
          console.error("Error fetching session user from DB:", error);
        }
      }
      return session;
    }
  },
})
