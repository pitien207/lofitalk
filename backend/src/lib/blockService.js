import User from "../models/User.js";

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.toString();
};

export const hasBlockedUser = (userDoc, targetId) => {
  if (!userDoc?.blockedUsers) return false;
  const targetStr = toIdString(targetId);
  return (userDoc.blockedUsers || []).some(
    (blockedId) => toIdString(blockedId) === targetStr
  );
};

const maybeLean = (query, lean = true) => {
  if (!query) return query;
  return lean ? query.lean() : query;
};

export const loadBlockStatus = async (
  viewerId,
  targetId,
  {
    viewerSelect = "blockedUsers",
    targetSelect = "blockedUsers",
    lean = true,
  } = {}
) => {
  if (!viewerId || !targetId) {
    return {
      viewer: null,
      target: null,
      userBlockedTarget: false,
      targetBlockedUser: false,
      targetExists: false,
    };
  }

  const viewerQuery = maybeLean(
    User.findById(viewerId).select(viewerSelect),
    lean
  );
  const targetQuery = maybeLean(
    User.findById(targetId).select(targetSelect),
    lean
  );

  const [viewer, target] = await Promise.all([viewerQuery, targetQuery]);

  return {
    viewer,
    target,
    targetExists: Boolean(target),
    userBlockedTarget: hasBlockedUser(viewer, targetId),
    targetBlockedUser: hasBlockedUser(target, viewerId),
  };
};
