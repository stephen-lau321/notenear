import { useNavigate } from "react-router-dom";
import type { StreetClaim } from "../../types";
import { getTeacherAvatar } from "../../utils/avatar";

interface Props {
  claim: StreetClaim;
}

export default function TeacherCard({ claim }: Props) {
  const navigate = useNavigate();
  const userId = claim.teacher?.user.id || "";
  const avatarUrl = getTeacherAvatar(userId, claim.teacher?.user.avatar);

  return (
    <div
      onClick={() => navigate(`/teacher/${claim.id}`)}
      className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
    >
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-primary-100">
        <img
          src={avatarUrl}
          alt={claim.teacher?.user.nickname || "艺术主理人"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 text-sm">
          {claim.teacher?.user.nickname || "艺术主理人"}
        </h3>
        <p className="text-xs text-primary-600 mt-0.5">
          {claim.instrument.name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          📍 {claim.streetName}{claim.district ? ` · ${claim.district}` : ""}
        </p>
      </div>
      <div className="flex-shrink-0">
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
