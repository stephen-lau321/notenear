// Full location picker: Province→City→District→Street/Town→Community/Village + free text
// Uses AMap autocomplete for street/community. Used by all three roles.

import { useEffect, useState } from "react";
import apiClient from "../../api/client";

interface Props {
  province: string; city: string; district: string;
  street: string; community: string; extra: string;
  onStreetChange: (s: string) => void;
  onCommunityChange: (c: string) => void;
  onExtraChange: (e: string) => void;
  required?: boolean;
}

export default function StreetCommunityPicker({
  province, city, district, street, community, extra,
  onStreetChange, onCommunityChange, onExtraChange, required
}: Props) {
  const [streetOptions, setStreetOptions] = useState<{ name: string }[]>([]);
  const [communityOptions, setCommunityOptions] = useState<{ name: string }[]>([]);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  // Load street/town suggestions when district changes
  useEffect(() => {
    if (!district) { setStreetOptions([]); return; }
    setLoadingStreets(true);
    apiClient.get("/map/autocomplete", { params: { keyword: district } })
      .then((res: any) => {
        const data = res?.data || res || [];
        // Filter for streets, roads, towns
        const filtered = data.filter((s: any) =>
          s.name.includes("路") || s.name.includes("街") || s.name.includes("道") ||
          s.name.includes("镇") || s.name.includes("街道") || s.name.includes("大道") ||
          s.name.includes("巷") || s.name.includes("弄")
        );
        setStreetOptions(filtered.length > 0 ? filtered : data.slice(0, 20));
      }).catch(() => {}).finally(() => setLoadingStreets(false));
  }, [district]);

  // Load community/village suggestions when street changes
  useEffect(() => {
    if (!street) { setCommunityOptions([]); return; }
    setLoadingCommunities(true);
    apiClient.get("/map/autocomplete", { params: { keyword: street } })
      .then((res: any) => {
        const data = res?.data || res || [];
        const filtered = data.filter((c: any) =>
          c.name.includes("小区") || c.name.includes("花园") || c.name.includes("苑") ||
          c.name.includes("城") || c.name.includes("园") || c.name.includes("公寓") ||
          c.name.includes("里") || c.name.includes("村") || c.name.includes("社区") ||
          c.name.includes("新村") || c.name.includes("家园") || c.name.includes("嘉园")
        );
        setCommunityOptions(filtered.length > 0 ? filtered : [
          { name: street + "小区" }, { name: street + "花园" }, { name: street + "社区" }, { name: street + "村" }
        ]);
      }).catch(() => setCommunityOptions([
        { name: street + "小区" }, { name: street + "花园" }, { name: street + "社区" }
      ])).finally(() => setLoadingCommunities(false));
  }, [street]);

  return (
    <div className="space-y-2">
      {/* Street/Town */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">镇/街道{required ? " *" : ""}</label>
        {loadingStreets ? (
          <div className="input-field text-gray-400 text-sm">加载中...</div>
        ) : streetOptions.length > 0 ? (
          <select value={street} onChange={(e) => { onStreetChange(e.target.value); onCommunityChange(""); }}
            className="input-field text-sm">
            <option value="">选择镇/街道</option>
            {streetOptions.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        ) : (
          <input type="text" value={street} onChange={(e) => onStreetChange(e.target.value)}
            className="input-field text-sm" placeholder={district ? `输入${district}的镇/街道名称` : "请先选择区县"} />
        )}
      </div>

      {/* Community/Village */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">村/小区{required ? " *" : ""}</label>
        {loadingCommunities ? (
          <div className="input-field text-gray-400 text-sm">加载中...</div>
        ) : communityOptions.length > 0 ? (
          <select value={community} onChange={(e) => onCommunityChange(e.target.value)}
            className="input-field text-sm">
            <option value="">选择村/小区</option>
            {communityOptions.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        ) : (
          <input type="text" value={community} onChange={(e) => onCommunityChange(e.target.value)}
            className="input-field text-sm" placeholder={street ? `输入${street}附近的村/小区` : "请先选择街道"} />
        )}
      </div>

      {/* Free text for non-administrative locations */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">补充地址（非行政区域，如：创意园、商业楼）</label>
        <input type="text" value={extra} onChange={(e) => onExtraChange(e.target.value)}
          className="input-field text-sm" placeholder="如：3栋502、创意园区A座…" />
      </div>
    </div>
  );
}
