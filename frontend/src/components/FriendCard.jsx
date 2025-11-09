import { Link } from "react-router";
import { MapPinIcon } from "lucide-react";

const FriendCard = ({ friend }) => {
  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12">
            <img src={friend.profilePic} alt={friend.fullName} />
          </div>
          <h3 className="font-semibold truncate">{friend.fullName}</h3>
        </div>

        {(friend.city || friend.country) && (
          <div className="flex items-center gap-2 text-xs text-base-content/70 mb-3">
            <MapPinIcon className="size-3" />
            <span>
              {[friend.city, friend.country].filter(Boolean).join(", ")}
            </span>
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
