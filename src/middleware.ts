import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/", "/stock/:path*", "/mouvements", "/rapports", "/parametres", "/demandes", "/mes-demandes", "/mon-equipement"],
};
