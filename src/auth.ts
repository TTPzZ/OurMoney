import NextAuth, { type DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import connectDB from "./lib/db"
import {
  buildExistingGoogleUserPatch,
  toPublicUser,
  USER_PUBLIC_SELECT,
  type PublicUserDocument,
} from "./lib/current-user"
import { GOOGLE_AUTHORIZATION_PARAMS } from "./lib/google-auth"
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
      authorization: {
        params: GOOGLE_AUTHORIZATION_PARAMS,
      },
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
            const googleName = user.name || user.email || "User";
            await User.create({
              name: googleName,
              email: user.email,
              image: user.image,
              googleId,
              googleName,
              googleImage: user.image,
              customName: null,
              customImage: null,
            });
          } else {
            const patch = buildExistingGoogleUserPatch(existingUser, {
              email: user.email,
              googleId,
              name: user.name,
              image: user.image,
            });

            if (Object.keys(patch).length > 0) {
              existingUser.set(patch);
              await existingUser.save();
            }
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
        
        try {
          await connectDB();
          const dbUser = await User.findOne({ googleId: token.sub })
            .select(USER_PUBLIC_SELECT)
            .lean();
          if (dbUser) {
            const publicUser = toPublicUser(dbUser as unknown as PublicUserDocument);
            token.userId = publicUser._id;
            token.name = publicUser.name;
            token.picture = publicUser.image;
          }
        } catch (error) {
          console.error("Error fetching user in jwt:", error);
        }
      }
      
      if (trigger === "update" && session) {
        token.name = session.name;
        // Don't save base64 to token
        if (session.image && session.image.startsWith('data:image/')) {
           token.picture = `/api/user/avatar?userId=${token.userId || token.sub}&t=${Date.now()}`;
        } else {
           token.picture = session.image;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.userId) {
          session.user.id = token.userId as string;
        } else if (token.sub) {
          // Fallback if userId wasn't fetched
          session.user.id = token.sub as string;
        }
        
        if (token.name) {
          session.user.name = token.name;
        }
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    }
  },
})
