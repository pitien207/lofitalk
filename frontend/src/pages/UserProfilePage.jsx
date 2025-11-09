import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { getUserProfile } from "../lib/api";
import { useTranslation } from "../languages/useTranslation";
import {
  CalendarIcon,
  MapPinIcon,
  HeartIcon,
  QuoteIcon,
  BookOpenIcon,
  PawPrintIcon,
  LoaderIcon,
} from "lucide-react";

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

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-profile", id],
    queryFn: () => getUserProfile(id),
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
                <div className="flex items-center gap-2 text-base-content/70">
                  <MapPinIcon className="size-4" />
                  <span>
                    {[user.city, user.country].filter(Boolean).join(", ")}
                  </span>
                </div>
                {user.bio && (
                  <p className="text-base-content/80 italic">
                    “{user.bio}”
                  </p>
                )}
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
            icon={HeartIcon}
            label={t("profile.datingGoal")}
            value={user.datingGoal}
          />
          <InfoRow
            icon={BookOpenIcon}
            label={t("profile.education")}
            value={user.education}
          />
          <InfoRow
            icon={QuoteIcon}
            label={t("profile.hobbies")}
            value={user.hobbies}
          />
          <InfoRow
            icon={PawPrintIcon}
            label={t("profile.pets")}
            value={user.pets}
          />
          <InfoRow
            icon={MapPinIcon}
            label={t("profile.height")}
            value={user.height}
          />
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="font-semibold text-lg">
              {t("profile.connections", { count: user.friendsCount || 0 })}
            </h2>
            <p className="text-sm opacity-70">
              {t("profile.connectionHint")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
