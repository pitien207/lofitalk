import { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import FriendsScreen from "./screens/FriendsScreen";
import ChatScreen from "./screens/ChatScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import BottomNav from "./components/navigation/BottomNav";
import AppBackground from "./components/layout/AppBackground";
import useAuth from "./hooks/useAuth";
import useFriends from "./hooks/useFriends";
import useChat from "./hooks/useChat";
import { MENU_ITEMS } from "./constants";
import { BRAND_COLORS } from "./theme/colors";
import Logo from "../assets/LofiTalk_logo.png";

const AppContainer = () => {
  const {
    email,
    password,
    loading,
    error,
    user,
    isHydrating,
    login,
    signOut,
    handleEmailChange,
    handlePasswordChange,
    updateUserProfile,
  } = useAuth();
  const {
    friends,
    selectedFriend,
    friendProfile,
    profileLoading,
    profileError,
    loadFriends,
    setInitialFriends,
    selectFriend,
    resetSelection,
    resetAllFriends,
  } = useFriends();
  const {
    channels,
    chatLoading,
    chatError,
    activeChannel,
    messages,
    selectingChannel,
    connectChat,
    disconnectChat,
    refreshChannels,
    openChannel,
    closeChannel,
    sendMessage,
  } = useChat();
  const [activePage, setActivePage] = useState("home");
  const [showIntro, setShowIntro] = useState(true);
  const introOpacity = useRef(new Animated.Value(1)).current;

  const handleLogin = async () => {
    const data = await login();
    if (!data) return;

    setInitialFriends(data.user?.friends);

    if (data.token) {
      try {
        await loadFriends();
      } catch (_error) {
        // Swallow error and keep local fallback friends
      }
    }

    setActivePage("home");
  };

  const handleSignOut = () => {
    signOut();
    resetAllFriends();
    disconnectChat();
    setActivePage("home");
  };

  const handleNavChange = (page) => {
    resetSelection();
    setActivePage(page);
  };

  useEffect(() => {
    const animation = Animated.timing(introOpacity, {
      toValue: 0,
      duration: 500,
      delay: 900,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => finished && setShowIntro(false));
    return () => animation.stop();
  }, [introOpacity]);

  useEffect(() => {
    if (user) {
      connectChat(user);
    } else {
      disconnectChat();
    }
  }, [connectChat, disconnectChat, user]);

  useEffect(() => {
    if (user && friends.length === 0) {
      loadFriends().catch(() => null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, friends.length]);

  if (isHydrating) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <AppBackground />
      </View>
    );
  }

  if (showIntro) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <AppBackground />
        <Animated.View style={[styles.introContent, { opacity: introOpacity }]}>
          <View style={styles.introGlowOne} />
          <View style={styles.introGlowTwo} />
          <Image source={Logo} style={styles.introLogo} />
          <Text style={styles.introTagline}>LofiTalk</Text>
          <Text style={styles.introTaglineSub}>Cozy chats • Calm company</Text>
        </Animated.View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <AppBackground />
        <AuthScreen
          email={email}
          password={password}
          loading={loading}
          error={error}
          onEmailChange={handleEmailChange}
          onPasswordChange={handlePasswordChange}
          onLogin={handleLogin}
        />
      </View>
    );
  }

  if (user && !user.isOnboarded) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <AppBackground />
        <OnboardingScreen
          user={user}
          onComplete={(updatedUser) => updateUserProfile(updatedUser)}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <AppBackground />
      <View style={styles.mainArea}>
        {activePage === "home" && (
          <HomeScreen
            user={user}
            onSignOut={handleSignOut}
            onProfileUpdate={updateUserProfile}
          />
        )}
        {activePage === "friends" && (
          <FriendsScreen
            friends={friends}
            selectedFriend={selectedFriend}
            friendProfile={friendProfile}
            profileLoading={profileLoading}
            profileError={profileError}
            onFriendSelect={selectFriend}
            onResetFriendSelection={resetSelection}
            onNavigateHome={() => handleNavChange("home")}
          />
        )}
        {activePage === "chat" && (
          <ChatScreen
            user={user}
            chatLoading={chatLoading}
            chatError={chatError}
            channels={channels}
            activeChannel={activeChannel}
            messages={messages}
            selectingChannel={selectingChannel}
            onRefresh={refreshChannels}
            onChannelSelect={openChannel}
            onBackToList={closeChannel}
            onSendMessage={sendMessage}
          />
        )}
      </View>
      <BottomNav
        items={MENU_ITEMS}
        activeItem={activePage}
        onChange={handleNavChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  mainArea: {
    flex: 1,
    paddingTop: 32,
    paddingBottom: 120,
  },
  introContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    position: "relative",
  },
  introLogo: {
    width: 96,
    height: 96,
    borderRadius: 32,
  },
  introTagline: {
    fontSize: 24,
    fontWeight: "700",
    color: BRAND_COLORS.text,
    letterSpacing: 1,
  },
  introTaglineSub: {
    fontSize: 14,
    color: BRAND_COLORS.muted,
    letterSpacing: 1,
  },
  introGlowOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: "25%",
  },
  introGlowTwo: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,200,150,0.08)",
    bottom: "30%",
  },
});

export default AppContainer;
