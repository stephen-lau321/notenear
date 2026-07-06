import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../api/client";
import type { Product } from "../types";
import { SkeletonProductGrid } from "../components/common/Skeleton";
import EmptyState, { EmptyStates } from "../components/common/EmptyState";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi.list().then((res: any) => {
      setProducts(Array.isArray(res) ? res : res?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  function parseImages(images: string): string[] {
    try { return JSON.parse(images); } catch { return []; }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">艺术商城</h1>
          <p className="text-sm text-gray-500 mt-0.5">艺术主理人自营好物</p>
        </div>
        <Link to="/" className="text-xs text-primary-600 underline">回首页</Link>
      </div>

      {loading ? (
        <SkeletonProductGrid count={4} />
      ) : products.length === 0 ? (
        EmptyStates.noProducts
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((p) => {
            const imgs = parseImages(p.images);
            return (
              <Link
                key={p.id}
                to={`/shop/${p.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center text-4xl overflow-hidden">
                  {imgs.length > 0 ? (
                    <img src={imgs[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>🎹</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-800 truncate">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{p.instrument?.name} · {p.teacher?.user?.nickname || "未知"}</p>
                  <p className="text-primary-700 font-bold text-sm mt-1">¥{(p.price / 100).toFixed(2)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
