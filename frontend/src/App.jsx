import { Navigate, Route, Routes } from "react-router";

import HomePage from "./pages/HomePage.jsx";
import FriendsPage from "./pages/FriendsPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ChatHomePage from "./pages/ChatHomePage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import TarotPage from "./pages/TarotPage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import FortuneCookiePage from "./pages/FortuneCookiePage.jsx";
import MobileAppPage from "./pages/MobileAppPage.jsx";
import MatchMindPage from "./pages/MatchMindPage.jsx";
import TruthOrLiePage from "./pages/TruthOrLiePage.jsx";

import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

import PageLoader from "./components/PageLoader.jsx";
import useAuthUser from "./hooks/useAuthUser.js";
import Layout from "./components/Layout.jsx";
import GameInviteListener from "./components/GameInviteListener.jsx";
import { useThemeStore } from "./store/useThemeStore.js";

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
    <div className="min-h-screen bg-base-100" data-theme={theme}>
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
          path="/call/:id"
          element={
            isAuthenticated && isOnboarded ? (
              <CallPage />
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
      </Routes>

      {isAuthenticated && isOnboarded && <GameInviteListener />}

      <Toaster />
    </div>
  );
};
export default App;
