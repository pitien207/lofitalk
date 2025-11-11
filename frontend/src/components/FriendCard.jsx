import { Link } from "react-router";
import { MapPinIcon } from "lucide-react";
import { getCountryFlag } from "../utils/flags";

const FriendCard = ({ friend }) => {
  const locationText =
    [friend.city, friend.country].filter(Boolean).join(", ") ||
    friend.location ||
    "";
  const flagSrc = getCountryFlag(friend.country, friend.city, friend.location);

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <Link
          to={`/profile/${friend._id}`}
          className="flex items-center gap-3 mb-3 hover:text-primary transition-colors"
        >
          <div className="avatar size-12">
            <img src={friend.profilePic} alt={friend.fullName} />
          </div>
          <h3 className="font-semibold truncate">{friend.fullName}</h3>
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
