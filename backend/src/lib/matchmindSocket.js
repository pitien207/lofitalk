const MATCHMIND_INVITE_TTL_MS = parseInt(
  process.env.MATCHMIND_INVITE_TTL_MS || "30000",
  10
);
const MATCHMIND_CANCEL_TTL_MS = 60000;

const matchMindInvites = new Map();

const buildInviteId = () =>
  `mm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const scheduleInviteCleanup = (inviteId, delayMs = MATCHMIND_CANCEL_TTL_MS) => {
  setTimeout(() => {
    if (matchMindInvites.get(inviteId)?.status === "canceled") {
      matchMindInvites.delete(inviteId);
    }
  }, delayMs);
};

const scheduleInviteExpiry = (io, inviteId, toUserRoom) => {
  setTimeout(() => {
    const invite = matchMindInvites.get(inviteId);
    if (!invite) return;
    if (invite.expiresAt <= Date.now() && invite.status === "pending") {
      matchMindInvites.delete(inviteId);
      io.to(toUserRoom(invite.hostId)).emit("matchmind:response", {
        inviteId,
        accepted: false,
        reason: "expired",
      });
      io.to(toUserRoom(invite.guestId)).emit("matchmind:expired", { inviteId });
    }
  }, MATCHMIND_INVITE_TTL_MS + 500);
};

const normalizeDifficulty = (difficulty, mode) => {
  const value = (difficulty || mode || "").toString().toLowerCase();
  if (["easy", "hard"].includes(value)) return value;
  if (value === "short" || value === "3" || value === "3 câu") return "short";
  if (value === "long" || value === "5" || value === "5 câu") return "long";
  return "easy";
};

const extractQuestions = (payload = {}, fallback = []) =>
  (Array.isArray(payload.questions) && payload.questions) ||
  (Array.isArray(payload.deck) && payload.deck) ||
  (Array.isArray(payload.questionSet) && payload.questionSet) ||
  fallback ||
  [];

export const attachMatchMindHandlers = (io, socket, user, toUserRoom) => {
  const userId = user._id.toString();

  socket.on("matchmind:invite", async ({ toUserId } = {}, callback = () => {}) => {
    try {
      if (!toUserId) return callback({ error: "toUserId is required" });
      if (toUserId === userId) return callback({ error: "Cannot invite yourself" });

      const isPlusOrAdmin = ["plus", "admin"].includes(
        (user.accountType || "").toString().toLowerCase()
      );
      if (!isPlusOrAdmin) {
        return callback({ error: "MatchMind is available for Plus or Admin users only" });
      }

      const inviteId = buildInviteId();
      const expiresAt = Date.now() + MATCHMIND_INVITE_TTL_MS;

      const invite = {
        inviteId,
        hostId: userId,
        hostName: user.fullName,
        hostPic: user.profilePic,
        guestId: toUserId,
        status: "pending",
        expiresAt,
      };

      matchMindInvites.set(inviteId, invite);
      scheduleInviteExpiry(io, inviteId, toUserRoom);

      io.to(toUserRoom(toUserId)).emit("matchmind:invite", {
        inviteId,
        expiresAt,
        fromUser: {
          id: userId,
          fullName: user.fullName,
          profilePic: user.profilePic,
        },
      });

      return callback({ ok: true, inviteId, expiresAt });
    } catch (error) {
      console.error("Error in matchmind:invite", error);
      return callback({ error: "Unable to send invite" });
    }
  });

  socket.on("matchmind:cancel", ({ inviteId } = {}, callback = () => {}) => {
    try {
      const invite = inviteId ? matchMindInvites.get(inviteId) : null;
      if (!invite) return callback({ error: "Invite not found" });
      if (invite.hostId !== userId) return callback({ error: "Only host can cancel" });
      if (!["pending", "accepted", "started"].includes(invite.status)) {
        return callback({ error: "Cannot cancel at this stage" });
      }

      invite.status = "canceled";
      invite.canceledAt = Date.now();
      matchMindInvites.set(inviteId, invite);
      scheduleInviteCleanup(inviteId);

      const packet = {
        inviteId,
        hostId: invite.hostId,
        hostName: invite.hostName,
      };

      io.to(toUserRoom(invite.guestId)).emit("matchmind:cancelled", packet);
      io.to(toUserRoom(invite.hostId)).emit("matchmind:cancelled", packet);

      return callback({ ok: true });
    } catch (error) {
      console.error("Error in matchmind:cancel", error);
      return callback({ error: "Unable to cancel invite" });
    }
  });

  socket.on(
    "matchmind:deck",
    ({ inviteId, questions, deck, questionSet, mode, difficulty } = {}, callback = () => {}) => {
      try {
        const invite = inviteId ? matchMindInvites.get(inviteId) : null;
        if (!invite) return callback({ error: "Invite not found" });
        if (invite.hostId !== userId) return callback({ error: "Only host can send deck" });

        const payloadQuestions = extractQuestions({ questions, deck, questionSet });
        invite.deck = payloadQuestions;
        invite.difficulty = normalizeDifficulty(difficulty, mode) || invite.difficulty || "easy";
        matchMindInvites.set(inviteId, invite);

        const packet = {
          inviteId,
          questions: payloadQuestions,
          deck: payloadQuestions,
          questionSet: payloadQuestions,
          difficulty: invite.difficulty,
          hostId: invite.hostId,
          hostName: invite.hostName,
          hostPic: invite.hostPic,
        };

        io.to(toUserRoom(invite.guestId)).emit("matchmind:deck", packet);
        io.to(toUserRoom(invite.hostId)).emit("matchmind:deck", packet);

        return callback({ ok: true });
      } catch (error) {
        console.error("Error in matchmind:deck", error);
        return callback({ error: "Unable to send deck" });
      }
    }
  );

  socket.on(
    "matchmind:respond",
    async ({ inviteId, accepted } = {}, callback = () => {}) => {
      try {
        const invite = inviteId ? matchMindInvites.get(inviteId) : null;
        if (!invite) return callback({ error: "Invite not found or expired" });
        if (invite.status === "canceled") {
          return callback({ error: "Invite was canceled by the host" });
        }
        if (invite.guestId !== userId)
          return callback({ error: "You are not the recipient of this invite" });
        if (invite.expiresAt <= Date.now()) {
          matchMindInvites.delete(inviteId);
          io.to(toUserRoom(invite.hostId)).emit("matchmind:response", {
            inviteId,
            accepted: false,
            reason: "expired",
          });
          return callback({ error: "Invite expired" });
        }

        invite.status = accepted ? "accepted" : "declined";
        invite.guestName = user.fullName;
        invite.guestPic = user.profilePic;
        matchMindInvites.set(inviteId, invite);

        io.to(toUserRoom(invite.hostId)).emit("matchmind:response", {
          inviteId,
          accepted: Boolean(accepted),
          guestId: userId,
          guestName: user.fullName,
          guestPic: user.profilePic,
        });

        if (!accepted) {
          matchMindInvites.delete(inviteId);
        }

        return callback({ ok: true });
      } catch (error) {
        console.error("Error in matchmind:respond", error);
        return callback({ error: "Unable to respond to invite" });
      }
    }
  );

  socket.on(
    "matchmind:start",
    ({ inviteId, difficulty, mode, questions, deck, questionSet } = {}, callback = () => {}) => {
      try {
        const invite = inviteId ? matchMindInvites.get(inviteId) : null;
        if (!invite) return callback({ error: "Invite not found" });
        if (invite.hostId !== userId)
          return callback({ error: "Only the host can start the game" });
        if (invite.status !== "accepted")
          return callback({ error: "Invite not accepted yet" });

        const normalizedDifficulty = normalizeDifficulty(difficulty, mode);
        const payloadQuestions = extractQuestions({ questions, deck, questionSet }, invite.deck);

        invite.status = "started";
        invite.difficulty = normalizedDifficulty;
        invite.deck = payloadQuestions;
        matchMindInvites.set(inviteId, invite);

        const packet = {
          inviteId,
          hostId: invite.hostId,
          hostName: invite.hostName,
          hostPic: invite.hostPic,
          difficulty: normalizedDifficulty,
          mode: normalizedDifficulty,
          questions: payloadQuestions,
          deck: payloadQuestions,
          questionSet: payloadQuestions,
        };

        io.to(toUserRoom(invite.guestId)).emit("matchmind:start", packet);
        io.to(toUserRoom(invite.hostId)).emit("matchmind:start", packet);

        return callback({ ok: true });
      } catch (error) {
        console.error("Error in matchmind:start", error);
        return callback({ error: "Unable to start game" });
      }
    }
  );

  socket.on(
    "matchmind:answer",
    ({ inviteId, questionId, answer } = {}, callback = () => {}) => {
      try {
        const invite = inviteId ? matchMindInvites.get(inviteId) : null;
        if (!invite) return callback({ error: "Invite not found" });
        if (invite.status !== "started")
          return callback({ error: "Game not started for this invite" });
        const isHost = invite.hostId === userId;
        const partnerId = isHost ? invite.guestId : invite.hostId;
        if (!partnerId) return callback({ error: "Partner not found" });

        io.to(toUserRoom(partnerId)).emit("matchmind:answer", {
          inviteId,
          questionId,
          answer,
          userId,
        });

        return callback({ ok: true });
      } catch (error) {
        console.error("Error in matchmind:answer", error);
        return callback({ error: "Unable to send answer" });
      }
    }
  );

  socket.on("matchmind:exit", ({ inviteId } = {}, callback = () => {}) => {
    try {
      const invite = inviteId ? matchMindInvites.get(inviteId) : null;
      if (!invite) return callback({ error: "Invite not found" });
      if (!invite.hostId || !invite.guestId) return callback({ error: "Invalid invite" });

      matchMindInvites.delete(inviteId);
      const packet = { inviteId, userId };
      io.to(toUserRoom(invite.hostId)).emit("matchmind:exit", packet);
      io.to(toUserRoom(invite.guestId)).emit("matchmind:exit", packet);
      return callback({ ok: true });
    } catch (error) {
      console.error("Error in matchmind:exit", error);
      return callback({ error: "Unable to exit game" });
    }
  });
};
