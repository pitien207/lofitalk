import { Link } from "react-router";
import { MapPinIcon } from "lucide-react";
import { getCountryFlag } from "../utils/flags";
import { useTranslation } from "../languages/useTranslation";
import { formatRelativeTimeFromNow } from "../utils/time";

const FriendCard = ({ friend }) => {
  const { t, language } = useTranslation();
  const locationText =
    [friend.city, friend.country].filter(Boolean).join(", ") ||
    friend.location ||
    "";
  const flagSrc = getCountryFlag(friend.country, friend.city, friend.location);

  let presenceLabel = t("common.presence.offlineUnknown");
  if (friend?.isOnline) {
    presenceLabel = t("common.presence.online");
  } else if (friend?.lastActiveAt) {
    const relative = formatRelativeTimeFromNow(friend.lastActiveAt, language);
    presenceLabel = relative
      ? t("common.presence.offline", { timeAgo: relative })
      : t("common.presence.offlineUnknown");
  }

  const presenceDotClass = friend?.isOnline ? "bg-success" : "bg-base-300";

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <Link
          to={`/profile/${friend._id}`}
          className="flex items-center gap-3 mb-3 hover:text-primary transition-colors"
        >
          <div className="relative avatar size-12">
            <img src={friend.profilePic} alt={friend.fullName} />
            <span
              className={`absolute bottom-0 right-0 block size-3 rounded-full border-2 border-base-200 ${presenceDotClass}`}
            />
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold truncate">{friend.fullName}</h3>
            <p className="text-xs text-base-content/70">{presenceLabel}</p>
          </div>
        </Link>

        {locationText && (
          <div className="flex items-center gap-2 text-xs text-base-content/70 mb-3">
            {flagSrc ? (
              <div className="w-5 h-3 overflow-hidden rounded-[4px] border border-base-300 shadow-sm">
                <img
                  src={flagSrc}
                  alt={friend.country}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <MapPinIcon className="size-3" />
            )}
            <span>{locationText}</span>
          </div>
        )}

        <Link to={`/chat/${friend._id}`} className="btn btn-outline w-full">
          Message
        </Link>
      </div>
    </div>
  );
};
export default FriendCard;
