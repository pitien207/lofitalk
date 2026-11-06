import { Navigate, Route, Routes } from "react-router";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy, useEffect } from "react";

import PageLoader from "./components/PageLoader.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ConnectionStatus from "./components/ConnectionStatus.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import GameInviteListener from "./components/GameInviteListener.jsx";
import MatchMindSocketBridge from "./components/MatchMindSocketBridge.jsx";
import RealtimeIdleManager from "./components/RealtimeIdleManager.jsx";
import RealtimeNotificationsBridge from "./components/RealtimeNotificationsBridge.jsx";
import { useThemeStore } from "./store/useThemeStore.js";
import { MatchMindGameProvider } from "./hooks/useMatchMindGame.jsx";

// Each page is its own chunk, downloaded the first time it is opened.
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const FriendsPage = lazy(() => import("./pages/FriendsPage.jsx"));
const SignUpPage = lazy(() => import("./pages/SignUpPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage.jsx"));
const ChatPage = lazy(() => import("./pages/ChatPage.jsx"));
const ChatHomePage = lazy(() => import("./pages/ChatHomePage.jsx"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage.jsx"));
const TarotPage = lazy(() => import("./pages/TarotPage.jsx"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));
const FortuneCookiePage = lazy(() => import("./pages/FortuneCookiePage.jsx"));
const MobileAppPage = lazy(() => import("./pages/MobileAppPage.jsx"));
const MatchMindPage = lazy(() => import("./pages/MatchMindPage.jsx"));
const TruthOrLiePage = lazy(() => import("./pages/TruthOrLiePage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

const App = () => {
  const { isLoading, authUser } = useAuthUser();
  const { theme } = useThemeStore();

  useEffect(() => {
    if (!theme) return;
    document.documentElement?.setAttribute("data-theme", theme);
    document.body?.setAttribute("data-theme", theme);
  }, [theme]);

  const isAuthenticated = Boolean(authUser);
  const isOnboarded = authUser?.isOnboarded;
  const isAdmin = authUser?.accountType === "admin";

  if (isLoading) return <PageLoader />;

  return (
    <ErrorBoundary>
    <MatchMindGameProvider>
      <div className="min-h-screen bg-base-100" data-theme={theme}>
        <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route
          path="/"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <HomePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            !isAuthenticated ? (
              <SignUpPage />
            ) : (
              <Navigate to={isOnboarded ? "/" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage />
            ) : (
              <Navigate to={isOnboarded ? "/" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/notifications"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <NotificationsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/friends"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <FriendsPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/chats"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <ChatHomePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/profile/:id"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <UserProfilePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/tarot"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <TarotPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/fortune"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <FortuneCookiePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/match-mind"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <MatchMindPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/truth-or-liar"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <TruthOrLiePage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/mobile-app"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <MobileAppPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/chat/:id"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <ChatPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated && isOnboarded && isAdmin ? (
              <Layout showSidebar={true}>
                <AdminPage />
              </Layout>
            ) : (
              <Navigate to={!isAuthenticated ? "/login" : isOnboarded ? "/" : "/onboarding"} />
            )
          }
        />

        <Route
          path="/onboarding"
          element={
            isAuthenticated ? (
              !isOnboarded ? (
                <OnboardingPage />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="*"
          element={
            isAuthenticated && isOnboarded ? (
              <Layout showSidebar={true}>
                <NotFoundPage />
              </Layout>
            ) : (
              <NotFoundPage />
            )
          }
        />
      </Routes>
        </Suspense>

      {isAuthenticated && <RealtimeIdleManager />}
      {isAuthenticated && isOnboarded && <ConnectionStatus />}

      {isAuthenticated && isOnboarded && (
        <>
          <GameInviteListener />
          <MatchMindSocketBridge />
          <RealtimeNotificationsBridge />
        </>
      )}

      <Toaster />
    </div>
    </MatchMindGameProvider>
    </ErrorBoundary>
  );
};
export default App;
