
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/business(.*)",
  "/customer(.*)",
  "/cb(.*)",
]);

const isAuthRoute = createRouteMatcher([
  "/sign-in",
  "/sign-up",
]);

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    const isAuthenticated = await convexAuth.isAuthenticated();

    // Protect private routes
    if (isProtectedRoute(request) && !isAuthenticated) {
      return nextjsMiddlewareRedirect(request, "/sign-in");
    }

    // Redirect signed-in users away from login/signup
    if (isAuthRoute(request) && isAuthenticated) {
      return nextjsMiddlewareRedirect(request, "/customer");
    }
  },
  {
    verbose: true,
  },
);

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
