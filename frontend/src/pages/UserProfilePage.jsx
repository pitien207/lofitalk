import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import {
  cancelFriendRequest,
  getUserProfile,
  removeFriend,
  sendFriendRequest,
} from "../lib/api";
import { useTranslation } from "../languages/useTranslation";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  MapPinIcon,
  QuoteIcon,
  BookOpenIcon,
  PawPrintIcon,
  LoaderIcon,
  MessageSquareIcon,
  UserMinusIcon,
  UserPlusIcon,
  XCircleIcon,
} from "lucide-react";
import { getCountryFlag } from "../utils/flags";

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-base-300 bg-base-100">
      <div className="mt-0.5">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <p className="text-xs uppercase opacity-60 tracking-wide">{label}</p>
        <p className="font-medium text-sm">{value}</p>
      </div>
    </div>
  );
};

const UserProfilePage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: () => getUserProfile(id),
  });

  const { mutate: sendRequest, isPending: sending } = useMutation({
    mutationFn: (targetId) => sendFriendRequest(targetId),
    onSuccess: () => {
      toast.success(t("profile.requestSentToast"));
      queryClient.invalidateQueries({ queryKey: ["user-profile", id] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("profile.requestError"));
    },
  });

  const { mutate: cancelRequest, isPending: cancelling } = useMutation({
    mutationFn: (targetId) => cancelFriendRequest(targetId),
    onSuccess: () => {
      toast.success(t("profile.requestCancelToast"));
      queryClient.invalidateQueries({ queryKey: ["user-profile", id] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || t("profile.requestCancelError")
      );
    },
  });

  const { mutate: unfriend, isPending: removing } = useMutation({
    mutationFn: (targetId) => removeFriend(targetId),
    onSuccess: () => {
      toast.success(t("profile.unfriendSuccess"));
      queryClient.invalidateQueries({ queryKey: ["user-profile", id] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t("profile.unfriendError"));
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoaderIcon className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="alert alert-error max-w-md">
          <span>{error?.response?.data?.message || "User not found."}</span>
        </div>
      </div>
    );
  }

  const age = user.birthDate
    ? Math.max(
        18,
        new Date(Date.now() - new Date(user.birthDate)).getUTCFullYear() - 1970
      )
    : null;

  const locationText =
    [user.city, user.country].filter(Boolean).join(", ") || user.location || "";
  const birthPlace =
    user.birthLocation ||
    [user.birthCity, user.birthCountry].filter(Boolean).join(", ");
  const showActions = !user.isSelf && authUser?._id !== user._id;
  const profileFlag = getCountryFlag(user.country, user.city, locationText);

  const renderActions = () => {
    if (!showActions) return null;

    if (user.isFriend) {
      return (
        <div className="flex flex-wrap gap-3">
          <Link to={`/chat/${user._id}`} className="btn btn-primary">
            <MessageSquareIcon className="size-4 mr-2" />
            {t("profile.message")}
          </Link>
          <button
            className="btn btn-outline btn-error"
            onClick={() => unfriend(user._id)}
            disabled={removing}
          >
            {removing ? (
              <LoaderIcon className="size-4 mr-2 animate-spin" />
            ) : (
              <UserMinusIcon className="size-4 mr-2" />
            )}
            {removing ? t("profile.saving") : t("profile.removeFriend")}
          </button>
        </div>
      );
    }

    let label = t("profile.addFriend");
    let disabled = sending || cancelling;
    let onClick = () => sendRequest(user._id);
    let icon = <UserPlusIcon className="size-4 mr-2" />;

    if (user.pendingRequestSent) {
      label = cancelling ? t("profile.saving") : t("profile.cancelRequest");
      icon = cancelling ? (
        <LoaderIcon className="size-4 mr-2 animate-spin" />
      ) : (
        <XCircleIcon className="size-4 mr-2" />
      );
      onClick = () => cancelRequest(user._id);
    } else if (user.pendingRequestReceived) {
      label = t("profile.respondRequest");
      disabled = true;
      icon = <UserPlusIcon className="size-4 mr-2" />;
    } else if (sending) {
      icon = <LoaderIcon className="size-4 mr-2 animate-spin" />;
    }

    const buttonClass = `btn ${
      user.pendingRequestSent ? "btn-outline" : "btn-primary"
    }`;

    return (
      <button
        className={buttonClass}
        onClick={onClick}
        disabled={disabled}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="avatar">
                <div className="w-32 h-32 rounded-2xl ring ring-primary/40 ring-offset-2">
                  <img src={user.profilePic} alt={user.fullName} />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold">{user.fullName}</h1>
                  {age && (
                    <span className="badge badge-primary badge-outline text-sm">
                      {age} {t("profile.yearsOld")}
                    </span>
                  )}
                </div>
                {locationText && (
                  <div className="flex items-center gap-2 text-base-content/70">
                    {profileFlag ? (
                      <div className="w-8 h-5 overflow-hidden rounded-md border border-base-200 shadow ring-1 ring-primary/30 ring-offset-2 ring-offset-base-100">
                        <img
                          src={profileFlag}
                          alt={user.country}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <MapPinIcon className="size-4" />
                    )}
                    <span>{locationText}</span>
                  </div>
                )}
                {user.bio && (
                  <p className="text-base-content/80 italic">“{user.bio}”</p>
                )}
                {renderActions()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow
            icon={CalendarIcon}
            label={t("profile.birthDate")}
            value={
              user.birthDate
                ? new Date(user.birthDate).toLocaleDateString()
                : null
            }
          />
          <InfoRow
            icon={MapPinIcon}
            label={t("profile.birthPlace")}
            value={birthPlace}
          />
          <InfoRow
            icon={BookOpenIcon}
            label={t("profile.education")}
            value={user.education}
          />
          <InfoRow icon={QuoteIcon} label={t("profile.hobbies")} value={user.hobbies} />
          <InfoRow icon={PawPrintIcon} label={t("profile.pets")} value={user.pets} />
          <InfoRow icon={MapPinIcon} label={t("profile.height")} value={user.height} />
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
