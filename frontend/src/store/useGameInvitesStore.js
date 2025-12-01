import { create } from "zustand";
import { persist } from "zustand/middleware";

const INITIAL_INVITES = () => ({
  matchmind: [],
  truthlie: [],
});

const normalizeGameKey = (game) => {
  if (!game) return null;
  if (game === "matchmind") return "matchmind";
  if (game === "truthlie" || game === "truth-or-lie") return "truthlie";
  return null;
};

const upsertInvite = (list = [], invite) => {
  if (!invite || !invite.inviteId) {
    return { list, added: false };
  }

  const index = list.findIndex((item) => item.inviteId === invite.inviteId);
  if (index >= 0) {
    const next = [...list];
    next[index] = { ...next[index], ...invite };
    return { list: next, added: false };
  }

  return {
    list: [...list, invite],
    added: true,
  };
};

const removeInviteFromList = (list = [], inviteId) => {
  if (!inviteId) return list;
  return list.filter((item) => item.inviteId !== inviteId);
};

const pruneExpiredFromList = (list = [], now = Date.now()) =>
  list.filter((invite) => {
    if (!invite?.expiresAt) return true;
    return invite.expiresAt > now;
  });

export const useGameInvitesStore = create(
  persist(
    (set) => ({
      invites: INITIAL_INVITES(),
      addInvite: (game, invite) => {
        const key = normalizeGameKey(game);
        if (!key) return false;
        let added = false;
        set((state) => {
          const result = upsertInvite(state.invites[key], invite);
          added = result.added;
          return {
            invites: {
              ...state.invites,
              [key]: result.list,
            },
          };
        });
        return added;
      },
      removeInvite: (game, inviteId) => {
        const key = normalizeGameKey(game);
        if (!key) return;
        set((state) => ({
          invites: {
            ...state.invites,
            [key]: removeInviteFromList(state.invites[key], inviteId),
          },
        }));
      },
      clearInvites: (game) => {
        const key = normalizeGameKey(game);
        if (!key) return;
        set((state) => ({
          invites: {
            ...state.invites,
            [key]: [],
          },
        }));
      },
      pruneExpiredInvites: (game, now = Date.now()) => {
        const key = normalizeGameKey(game);
        if (!key) return;
        set((state) => ({
          invites: {
            ...state.invites,
            [key]: pruneExpiredFromList(state.invites[key], now),
          },
        }));
      },
      reset: () => set({ invites: INITIAL_INVITES() }),
    }),
    {
      name: "game-invites-store",
      partialize: (state) => ({
        invites: state.invites,
      }),
    }
  )
);
