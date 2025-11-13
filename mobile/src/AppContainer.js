import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
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

const AppContainer = () => {
  const {
    email,
    password,
    loading,
    error,
    user,
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
    if (user) {
      connectChat(user);
    } else {
      disconnectChat();
    }
  }, [connectChat, disconnectChat, user]);

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
          <HomeScreen user={user} onSignOut={handleSignOut} />
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
});

export default AppContainer;
