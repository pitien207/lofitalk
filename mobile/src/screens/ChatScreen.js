import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Logo from "../../assets/LofiTalk_logo.png";
import { BRAND_COLORS } from "../theme/colors";

const formatRelativeTime = (date) => {
  if (!date) return "";
  const target = new Date(date);
  const now = new Date();
  const diffMs = now - target;
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) {
    return target.toLocaleDateString("en-US", { weekday: "short" });
  }
  return target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const buildChannelMeta = (channel, currentUserId) => {
  const members = Object.values(channel.state?.members || {});
  const otherMember =
    members.find((member) => member.user?.id !== currentUserId)?.user ||
    channel.data?.created_by ||
    {};

  const validMessages =
    channel.state?.messages?.filter(
      (msg) => !msg.deleted_at && msg.type !== "system"
    ) || [];
  const lastMessage = validMessages[validMessages.length - 1];

  const readState = channel.state?.read;
  let lastReadDate = null;
  if (readState) {
    if (Array.isArray(readState)) {
      const ownRead = readState.find(
        (read) =>
          read?.user?.id === currentUserId || read?.user_id === currentUserId
      );
      lastReadDate = ownRead?.last_read;
    } else {
      lastReadDate = readState?.[currentUserId]?.last_read;
    }
  }

  const unread =
    lastMessage && lastMessage.created_at
      ? !lastReadDate ||
        new Date(lastMessage.created_at) > new Date(lastReadDate)
      : false;

  const lastMessageText =
    lastMessage?.text ||
    (lastMessage?.attachments?.length ? "Sent an attachment" : "Say hello 👋");

  return {
    id: channel.id,
    cid: channel.cid,
    name: otherMember?.name || channel.data?.name || "Conversation",
    avatar: otherMember?.image,
    online: Boolean(otherMember?.online),
    lastMessageText,
    lastMessageTime: formatRelativeTime(
      lastMessage?.created_at || channel.state?.last_message_at
    ),
    unread,
  };
};

const filterMessages = (messages) =>
  (messages || []).filter(
    (msg) =>
      !msg.deleted_at &&
      (msg.type === "regular" ||
        msg.type === "reply" ||
        msg.type === "message.read" ||
        !msg.type)
  );

const ChatScreen = ({
  user,
  chatLoading,
  chatError,
  channels,
  activeChannel,
  messages,
  selectingChannel,
  onRefresh,
  onChannelSelect,
  onBackToList,
  onSendMessage,
}) => {
  const [messageText, setMessageText] = useState("");

  const renderChannelItem = ({ item }) => {
    const meta = buildChannelMeta(item, user?._id);
    return (
      <TouchableOpacity
        style={styles.threadRow}
        activeOpacity={0.85}
        onPress={() => onChannelSelect(meta.id)}
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={
              typeof meta.avatar === "string" ? { uri: meta.avatar } : Logo
            }
            style={styles.threadAvatar}
          />
          {meta.online && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={styles.threadName}>{meta.name}</Text>
            <Text style={styles.threadTime}>{meta.lastMessageTime}</Text>
          </View>
          <Text style={styles.threadPreview} numberOfLines={1}>
            {meta.lastMessageText}
          </Text>
        </View>
        {meta.unread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const conversationMeta = useMemo(() => {
    if (!activeChannel) return null;
    return buildChannelMeta(activeChannel, user?._id);
  }, [activeChannel, user?._id]);

  const conversationMessages = useMemo(() => {
    const normalized = filterMessages(messages).map((msg, index) => ({
      id: msg.id || `${msg.cid || "msg"}-${msg.created_at || index}`,
      text: msg.text || (msg.attachments?.length ? "Shared attachment" : ""),
      createdAt: msg.created_at,
      isOwn: msg.user?.id === user?._id,
      name: msg.user?.name || "Friend",
    }));

    return normalized.reverse();
  }, [messages, user?._id]);

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText.trim());
    setMessageText("");
  };

  if (activeChannel && conversationMeta) {
    return (
      <KeyboardAvoidingView
        style={styles.chatWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity style={styles.backButton} onPress={onBackToList}>
            <Text style={styles.backButtonText}>◀</Text>
          </TouchableOpacity>
          <Image
            source={
              typeof conversationMeta.avatar === "string"
                ? { uri: conversationMeta.avatar }
                : Logo
            }
            style={styles.chatAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.chatName}>{conversationMeta.name}</Text>
            <Text style={styles.chatStatus}>
              {conversationMeta.online ? "Online now" : "Offline"}
            </Text>
          </View>
        </View>

        <FlatList
          data={conversationMessages}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          inverted
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.isOwn ? styles.messageOwn : styles.messageRemote,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.isOwn && styles.messageTextOwn,
                ]}
              >
                {item.text || "..."}
              </Text>
              <Text style={styles.messageTime}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>
          )}
        />

        <View style={styles.messageInputRow}>
          <TextInput
            placeholder="Message..."
            placeholderTextColor="#A0A6B7"
            value={messageText}
            onChangeText={setMessageText}
            style={styles.messageInput}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !messageText.trim() && { opacity: 0.5 },
            ]}
            disabled={!messageText.trim()}
            onPress={handleSend}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.listWrapper}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Messages</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {chatError && <Text style={styles.errorText}>{chatError}</Text>}

      {(chatLoading || selectingChannel) && (
        <View style={styles.loaderRow}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.loaderText}>
            {selectingChannel ? "Loading chat..." : "Connecting to Stream..."}
          </Text>
        </View>
      )}

      {channels.length === 0 && !chatLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a chat from the friends page to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.cid || item.id}
          renderItem={renderChannelItem}
          refreshing={chatLoading}
          onRefresh={onRefresh}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  listWrapper: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 32,
  },
  listTitle: {
    color: BRAND_COLORS.text,
    fontSize: 28,
    fontWeight: "700",
  },
  refreshText: {
    color: BRAND_COLORS.secondary,
    fontWeight: "600",
  },
  threadRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  threadAvatar: {
    width: 58,
    height: 58,
    borderRadius: 24,
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: BRAND_COLORS.background,
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  threadName: {
    color: BRAND_COLORS.text,
    fontWeight: "700",
    fontSize: 16,
  },
  threadTime: {
    color: BRAND_COLORS.muted,
    fontSize: 12,
  },
  threadPreview: {
    color: BRAND_COLORS.muted,
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4DA6FF",
    marginLeft: 12,
  },
  errorText: {
    color: "#FEB2B2",
    marginBottom: 8,
  },
  loaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  loaderText: {
    color: BRAND_COLORS.muted,
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
  },
  emptyTitle: {
    color: BRAND_COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: BRAND_COLORS.muted,
    marginTop: 6,
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  chatWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: BRAND_COLORS.text,
    fontWeight: "700",
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 20,
  },
  chatName: {
    color: BRAND_COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  chatStatus: {
    color: BRAND_COLORS.muted,
    fontSize: 13,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 12,
  },
  messageOwn: {
    alignSelf: "flex-end",
    backgroundColor: BRAND_COLORS.secondary,
  },
  messageRemote: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  messageText: {
    color: BRAND_COLORS.text,
    fontSize: 15,
  },
  messageTextOwn: {
    color: "#1F1F1F",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    color: "rgba(255,255,255,0.6)",
  },
  messageInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(16,15,26,0.85)",
  },
  messageInput: {
    flex: 1,
    color: BRAND_COLORS.text,
    maxHeight: 96,
  },
  sendButton: {
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default ChatScreen;
