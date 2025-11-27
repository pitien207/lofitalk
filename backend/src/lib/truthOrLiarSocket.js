const TRUTH_INVITE_TTL_MS = parseInt(
  process.env.MATCHMIND_INVITE_TTL_MS || "30000",
  10
);
const TRUTH_CANCEL_TTL_MS = 60000;

const truthInvites = new Map();

const buildInviteId = () =>
  `tl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeMode = (mode) => {
  const val = (mode || "").toString().toLowerCase();
  if (val === "long" || val === "5" || val === "5 câu") return "long";
  return "short";
};

const extractQuestions = (payload = {}, fallback = []) =>
  (Array.isArray(payload.questions) && payload.questions) ||
  (Array.isArray(payload.deck) && payload.deck) ||
  (Array.isArray(payload.questionSet) && payload.questionSet) ||
  fallback ||
  [];

const scheduleInviteCleanup = (inviteId, delayMs = TRUTH_CANCEL_TTL_MS) => {
  setTimeout(() => {
    if (truthInvites.get(inviteId)?.status === "canceled") {
      truthInvites.delete(inviteId);
    }
  }, delayMs);
};

const scheduleInviteExpiry = (io, inviteId, toUserRoom) => {
  setTimeout(() => {
    const invite = truthInvites.get(inviteId);
    if (!invite) return;
    if (invite.expiresAt <= Date.now() && invite.status === "pending") {
      truthInvites.delete(inviteId);
      io.to(toUserRoom(invite.hostId)).emit("truthlie:response", {
        inviteId,
        accepted: false,
        reason: "expired",
      });
      io.to(toUserRoom(invite.guestId)).emit("truthlie:expired", { inviteId });
    }
  }, TRUTH_INVITE_TTL_MS + 500);
};

export const attachTruthOrLiarHandlers = (io, socket, user, toUserRoom) => {
  const userId = user._id.toString();

  socket.on("truthlie:invite", async ({ toUserId } = {}, callback = () => {}) => {
    try {
      if (!toUserId) return callback({ error: "toUserId is required" });
      if (toUserId === userId) return callback({ error: "Cannot invite yourself" });

      const isPlusOrAdmin = ["plus", "admin"].includes(
        (user.accountType || "").toString().toLowerCase()
      );
      if (!isPlusOrAdmin) {
        return callback({ error: "Truth or Liar is available for Plus or Admin users only" });
      }

      const inviteId = buildInviteId();
      const expiresAt = Date.now() + TRUTH_INVITE_TTL_MS;

      const invite = {
        inviteId,
        hostId: userId,
        hostName: user.fullName,
        hostPic: user.profilePic,
        guestId: toUserId,
        status: "pending",
        expiresAt,
      };

      truthInvites.set(inviteId, invite);
      scheduleInviteExpiry(io, inviteId, toUserRoom);

      io.to(toUserRoom(toUserId)).emit("truthlie:invite", {
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
      console.error("Error in truthlie:invite", error);
      return callback({ error: "Unable to send invite" });
    }
  });

  socket.on("truthlie:cancel", ({ inviteId } = {}, callback = () => {}) => {
    try {
      const invite = inviteId ? truthInvites.get(inviteId) : null;
      if (!invite) return callback({ error: "Invite not found" });
      if (invite.hostId !== userId) return callback({ error: "Only host can cancel" });
      if (!["pending", "accepted", "started"].includes(invite.status)) {
        return callback({ error: "Cannot cancel at this stage" });
      }

      invite.status = "canceled";
      invite.canceledAt = Date.now();
      truthInvites.set(inviteId, invite);
      scheduleInviteCleanup(inviteId);

      const packet = {
        inviteId,
        hostId: invite.hostId,
        hostName: invite.hostName,
      };

      io.to(toUserRoom(invite.guestId)).emit("truthlie:cancelled", packet);
      io.to(toUserRoom(invite.hostId)).emit("truthlie:cancelled", packet);

      return callback({ ok: true });
    } catch (error) {
      console.error("Error in truthlie:cancel", error);
      return callback({ error: "Unable to cancel invite" });
    }
  });

  socket.on(
    "truthlie:respond",
    async ({ inviteId, accepted } = {}, callback = () => {}) => {
      try {
        const invite = inviteId ? truthInvites.get(inviteId) : null;
        if (!invite) return callback({ error: "Invite not found or expired" });
        if (invite.status === "canceled") {
          return callback({ error: "Invite was canceled by the host" });
        }
        if (invite.guestId !== userId)
          return callback({ error: "You are not the recipient of this invite" });
        if (invite.expiresAt <= Date.now()) {
          truthInvites.delete(inviteId);
          io.to(toUserRoom(invite.hostId)).emit("truthlie:response", {
            inviteId,
            accepted: false,
            reason: "expired",
          });
          return callback({ error: "Invite expired" });
        }

        invite.status = accepted ? "accepted" : "declined";
        invite.guestName = user.fullName;
        invite.guestPic = user.profilePic;
        truthInvites.set(inviteId, invite);

        io.to(toUserRoom(invite.hostId)).emit("truthlie:response", {
          inviteId,
          accepted: Boolean(accepted),
          guestId: userId,
          guestName: user.fullName,
          guestPic: user.profilePic,
        });

        if (!accepted) {
          truthInvites.delete(inviteId);
        }

        return callback({ ok: true });
      } catch (error) {
        console.error("Error in truthlie:respond", error);
        return callback({ error: "Unable to respond to invite" });
      }
    }
  );

  socket.on(
    "truthlie:deck",
    ({ inviteId, questions, deck, questionSet, mode } = {}, callback = () => {}) => {
      try {
        const invite = inviteId ? truthInvites.get(inviteId) : null;
        if (!invite) return callback({ error: "Invite not found" });
        if (invite.hostId !== userId) return callback({ error: "Only host can send deck" });

        const payloadQuestions = extractQuestions({ questions, deck, questionSet });
        invite.deck = payloadQuestions;
        invite.mode = normalizeMode(mode || invite.mode || "short");
        truthInvites.set(inviteId, invite);

        const packet = {
          inviteId,
          mode: invite.mode,
          questions: payloadQuestions,
          deck: payloadQuestions,
          questionSet: payloadQuestions,
          hostId: invite.hostId,
          hostName: invite.hostName,
          hostPic: invite.hostPic,
        };

        io.to(toUserRoom(invite.guestId)).emit("truthlie:deck", packet);
        io.to(toUserRoom(invite.hostId)).emit("truthlie:deck", packet);

        return callback({ ok: true });
      } catch (error) {
        console.error("Error in truthlie:deck", error);
        return callback({ error: "Unable to send deck" });
      }
    }
  );

  socket.on(
    "truthlie:start",
    ({ inviteId, mode, questions, deck, questionSet } = {}, callback = () => {}) => {
      try {
        const invite = inviteId ? truthInvites.get(inviteId) : null;
        if (!invite) return callback({ error: "Invite not found" });
        if (invite.hostId !== userId)
          return callback({ error: "Only the host can start the game" });
        if (invite.status !== "accepted")
          return callback({ error: "Invite not accepted yet" });

        const normalizedMode = normalizeMode(mode || invite.mode || "short");
        const payloadQuestions = extractQuestions({ questions, deck, questionSet }, invite.deck);

        invite.status = "started";
        invite.mode = normalizedMode;
        invite.deck = payloadQuestions;
        truthInvites.set(inviteId, invite);

        const packet = {
          inviteId,
          hostId: invite.hostId,
          hostName: invite.hostName,
          hostPic: invite.hostPic,
          mode: normalizedMode,
          questions: payloadQuestions,
          deck: payloadQuestions,
          questionSet: payloadQuestions,
        };

        io.to(toUserRoom(invite.guestId)).emit("truthlie:start", packet);
        io.to(toUserRoom(invite.hostId)).emit("truthlie:start", packet);

        return callback({ ok: true });
      } catch (error) {
        console.error("Error in truthlie:start", error);
        return callback({ error: "Unable to start game" });
      }
    }
  );

  socket.on(
    "truthlie:answer",
    ({ inviteId, questionId, answer, choice } = {}, callback = () => {}) => {
      try {
        const invite = inviteId ? truthInvites.get(inviteId) : null;
        if (!invite) return callback({ error: "Invite not found" });
        if (invite.status !== "started")
          return callback({ error: "Game not started for this invite" });
        const isHost = invite.hostId === userId;
        const partnerId = isHost ? invite.guestId : invite.hostId;
        if (!partnerId) return callback({ error: "Partner not found" });

        io.to(toUserRoom(partnerId)).emit("truthlie:answer", {
          inviteId,
          questionId,
          choice: answer ?? choice,
          userId,
        });

        return callback({ ok: true });
      } catch (error) {
        console.error("Error in truthlie:answer", error);
        return callback({ error: "Unable to send answer" });
      }
    }
  );

  socket.on("truthlie:exit", ({ inviteId } = {}, callback = () => {}) => {
    try {
      const invite = inviteId ? truthInvites.get(inviteId) : null;
      if (!invite) return callback({ error: "Invite not found" });
      if (!invite.hostId || !invite.guestId) return callback({ error: "Invalid invite" });

      truthInvites.delete(inviteId);
      const packet = { inviteId, userId };
      io.to(toUserRoom(invite.hostId)).emit("truthlie:exit", packet);
      io.to(toUserRoom(invite.guestId)).emit("truthlie:exit", packet);
      return callback({ ok: true });
    } catch (error) {
      console.error("Error in truthlie:exit", error);
      return callback({ error: "Unable to exit game" });
    }
  });
};
