import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptFriendRequest,
  deleteAdminNotification,
  declineFriendRequest,
  deleteFriendRequest,
  getAdminNotifications,
  getFriendRequests,
} from "../lib/api";
import {
  BellIcon,
  MegaphoneIcon,
  MapPinIcon,
  MessageSquareIcon,
  UserCheckIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import NoNotificationsFound from "../components/NoNotificationsFound";
import { useTranslation } from "../languages/useTranslation";

const ADMIN_EXPIRE_DAYS = 3;

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const {
    data: adminNotificationData,
    isLoading: loadingAdminNotifications,
  } = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: async () => {
      try {
        return await getAdminNotifications();
      } catch (error) {
        if (error?.response?.status === 404) {
          return { notifications: [] };
        }
        throw error;
      }
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to load admin notifications"
      );
    },
  });

  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const { mutate: declineRequestMutation, isPending: isDeclining } =
    useMutation({
      mutationFn: declineFriendRequest,
      onSuccess: () => {
        toast.success(t("notifications.declined"));
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || t("notifications.error"));
      },
    });

  const { mutate: deleteNotificationMutation, isPending: isRemoving } =
    useMutation({
      mutationFn: deleteFriendRequest,
      onSuccess: () => {
        toast.success(t("notifications.deleted"));
        queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || t("notifications.error"));
      },
    });

  const { mutate: dismissAdminNotification, isPending: isDismissingAdmin } =
    useMutation({
      mutationFn: deleteAdminNotification,
      onSuccess: () => {
        toast.success(t("notifications.deleted"));
        queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || t("notifications.error")
        );
      },
    });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];
  const declinedRequests = friendRequests?.declinedReqs || [];
  const adminNotifications = Array.isArray(adminNotificationData)
    ? adminNotificationData
    : adminNotificationData?.notifications || [];
  const hasAnyNotifications =
    incomingRequests.length > 0 ||
    acceptedRequests.length > 0 ||
    declinedRequests.length > 0 ||
    adminNotifications.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          {t("notifications.title")}
        </h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {(loadingAdminNotifications || adminNotifications.length > 0) && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <MegaphoneIcon className="h-5 w-5 text-warning" />
                  <h2 className="text-xl font-semibold">{t("notifications.adminTitle")}</h2>
                  {loadingAdminNotifications && (
                    <span className="loading loading-spinner loading-xs"></span>
                  )}
                </div>

                {loadingAdminNotifications ? (
                  <div className="flex justify-center py-6">
                    <span className="loading loading-spinner loading-sm"></span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminNotifications.map((notification) => {
                      const notificationId = notification._id || notification.id;
                      const createdAtDate = notification.createdAt
                        ? new Date(notification.createdAt)
                        : null;
                      const createdAt =
                        createdAtDate && !Number.isNaN(createdAtDate.getTime())
                          ? createdAtDate.toLocaleString()
                          : t("notifications.fromAdmin");

                      const expireAtRaw = notification.expireAt || notification.expiresAt;
                      const expireDate =
                        expireAtRaw && !Number.isNaN(new Date(expireAtRaw).getTime())
                          ? new Date(expireAtRaw)
                          : null;

                      return (
                        <div
                          key={notificationId}
                          className="card bg-base-200 shadow-sm"
                        >
                          <div className="card-body p-4">
                            <div className="flex items-start gap-3">
                              <div className="avatar placeholder mt-1">
                                <div className="w-10 rounded-full bg-warning/20 text-warning flex items-center justify-center">
                                  <MegaphoneIcon className="h-5 w-5" />
                                </div>
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="text-sm text-base-content/60">
                                  {createdAt}
                                </p>
                              <p className="text-sm leading-relaxed">
                                {notification.message}
                              </p>
                              <p className="text-xs text-base-content/60">
                                {t("notifications.adminExpireHint", { days: ADMIN_EXPIRE_DAYS })}
                                {expireDate
                                  ? ` (${t("notifications.expiresOn", {
                                      date: expireDate.toLocaleDateString(),
                                    })})`
                                  : ""}
                              </p>
                            </div>
                            <button
                              className="btn btn-ghost btn-sm"
                                onClick={() =>
                                  notificationId &&
                                  dismissAdminNotification(notificationId)
                              }
                              disabled={isDismissingAdmin || !notificationId}
                              title={t("notifications.delete")}
                            >
                                {isDismissingAdmin ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                  <XIcon className="size-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  {t("notifications.incoming")}
                  <span className="badge badge-primary ml-2">
                    {incomingRequests.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Link
                              to={`/profile/${request.sender._id}`}
                              className="avatar w-14 h-14 rounded-full bg-base-300 ring ring-primary/20"
                            >
                              <img
                                src={request.sender.profilePic}
                                alt={request.sender.fullName}
                              />
                            </Link>
                            <div>
                              <h3 className="font-semibold">
                              {request.sender.fullName}
                            </h3>
                              {([request.sender.city, request.sender.country]
                                .filter(Boolean)
                                .join(", ") ||
                                request.sender.location) && (
                                <div className="flex items-center gap-1 text-xs opacity-70 mt-1">
                                  <MapPinIcon className="h-3 w-3" />
                                  <span>
                                    {[request.sender.city, request.sender.country]
                                      .filter(Boolean)
                                      .join(", ") ||
                                      request.sender.location}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {request.status === "pending" && (
                            <div className="flex gap-2 items-center">
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() =>
                                  declineRequestMutation(request._id)
                                }
                                disabled={isDeclining}
                              >
                                {isDeclining ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : null}
                                {t("notifications.decline")}
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() =>
                                  acceptRequestMutation(request._id)
                                }
                                disabled={isPending}
                              >
                                {isPending ? (
                                  <span className="loading loading-spinner loading-xs"></span>
                                ) : null}
                                {t("notifications.accept")}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ACCEPTED REQS NOTIFICATONS */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  {t("notifications.newConnections")}
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div
                      key={notification._id}
                      className="card bg-base-200 shadow-sm"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <Link
                            to={`/profile/${notification.recipient._id}`}
                            className="avatar mt-1 size-10 rounded-full ring ring-primary/20"
                          >
                            <img
                              src={notification.recipient.profilePic}
                              alt={notification.recipient.fullName}
                            />
                          </Link>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {notification.recipient.fullName}
                            </h3>
                            <p className="text-sm my-1">
                              {t("notifications.acceptedText", {
                                name: notification.recipient.fullName,
                              })}
                            </p>
                          </div>
                          <div className="badge badge-success">
                            <MessageSquareIcon className="h-3 w-3 mr-1" />
                            {t("notifications.newFriend")}
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              deleteNotificationMutation(notification._id)
                            }
                            disabled={isRemoving}
                            title={t("notifications.delete")}
                          >
                            {isRemoving ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <XIcon className="size-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {declinedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5 text-error" />
                  {t("notifications.declinedSection")}
                </h2>

                <div className="space-y-3">
                  {declinedRequests.map((notification) => (
                    <div
                      key={notification._id}
                      className="card bg-base-200 shadow-sm"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <Link
                            to={`/profile/${notification.recipient._id}`}
                            className="avatar mt-1 size-10 rounded-full ring ring-error/20"
                          >
                            <img
                              src={notification.recipient.profilePic}
                              alt={notification.recipient.fullName}
                            />
                          </Link>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {notification.recipient.fullName}
                            </h3>
                            <p className="text-sm my-1">
                              {t("notifications.declinedText", {
                                name: notification.recipient.fullName,
                              })}
                            </p>
                          </div>
                          <div className="badge badge-error">
                            {t("notifications.declined")}
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() =>
                              deleteNotificationMutation(notification._id)
                            }
                            disabled={isRemoving}
                            title={t("notifications.delete")}
                          >
                            {isRemoving ? (
                              <span className="loading loading-spinner loading-xs"></span>
                            ) : (
                              <XIcon className="size-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!loadingAdminNotifications && !hasAnyNotifications && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;
