import { lazy } from "react";
import { ROUTES } from "../constants/routes";

const VideoEditorApp = lazy(() => import("../pages/VideoEditorAppPage"));
const TermsOfUsePage = lazy(() => import("../pages/TermsOfUsePage"));
const PrivacyPolicyPage = lazy(() => import("../pages/PrivacyPolicyPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const HelpCenter = lazy(() => import("../pages/HelpCenter"));
const AboutUs = lazy(() => import("../pages/AboutUs"));
const TubifyLanding = lazy(() => import("../pages/TubifyLanding"));

export const useAppRoutes = () => {
  return [
    {
      path: ROUTES.HOME,
      element: TubifyLanding,
      title: "Tubify - AI Video Creator",
      requiresAuth: false,
    },
    {
      path: ROUTES.VIDEO_MAKER,
      element: VideoEditorApp,
      title: "Video Maker - Tubify",
      requiresAuth: true,
    },
    {
      path: ROUTES.TERMS_OF_USE,
      element: TermsOfUsePage,
      title: "Terms of Use - Tubify",
      requiresAuth: false,
    },
    {
      path: ROUTES.PRIVACY_POLICY,
      element: PrivacyPolicyPage,
      title: "Privacy Policy - Tubify",
      requiresAuth: false,
    },
    {
      path: ROUTES.HELP_CENTER,
      element: HelpCenter,
      title: "Help Center",
      requiresAuth: false,
    },
    {
      path: ROUTES.ABOUT_US,
      element: AboutUs,
      title: "About Us",
      requiresAuth: false,
    },
    {
      path: ROUTES.NOT_FOUND,
      element: NotFoundPage,
      title: "Page Not Found - Tubify",
      requiresAuth: false,
    },
  ];
};
