import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { productApi, orderApi } from "../api/client";
import type { Product } from "../types";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    productApi.getById(id).then((res: any) => {
      setProduct(res?.data || res);
    }).catch(() => setMsg("商品不存在")).finally(() => setLoading(false));
  }, [id]);

  function handleBuy() {
    const token = localStorage.getItem("access_token");
    if (!token) { setMsg("请先登录"); return; }
    if (!product) return;
    orderApi.create({ productId: product.id, quantity: 1 })
      .then(() => setMsg("下单成功！体验导师会尽快联系你"))
      .catch((e: any) => setMsg(e?.message || "下单失败"));
  }

  function parseImages(images: string): string[] {
    try { return JSON.parse(images); } catch { return []; }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      <div className="aspect-video bg-gray-100 rounded-xl mb-4" />
      <div className="h-6 bg-gray-100 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="h-20 bg-gray-100 rounded" />
    </div>
  );

  if (!product) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">
      <p className="text-lg mb-2">😕</p>
      <p className="text-sm">{msg || "商品不存在"}</p>
      <Link to="/shop" className="text-primary-600 text-xs underline mt-2 inline-block">返回商城</Link>
    </div>
  );

  const imgs = parseImages(product.images);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/shop" className="text-xs text-gray-400 hover:text-primary-600 mb-4 inline-block">
        ← 返回商城
      </Link>

      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        <div className="aspect-video bg-gray-50 flex items-center justify-center text-6xl">
          {imgs.length > 0 ? (
            <img src={imgs[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span>🎸</span>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-800">{product.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {product.instrument?.name} · {product.teacher?.user?.nickname || "未知"}
              </p>
            </div>
            <p className="text-xl font-bold text-primary-700">
              ¥{(product.price / 100).toFixed(2)}
            </p>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-5 whitespace-pre-wrap">
              {product.description}
            </p>
          )}

          {product.stock >= 0 && (
            <p className="text-xs text-gray-400 mb-4">库存: {product.stock > 0 ? product.stock + " 件" : "已售罄"}</p>
          )}

          <button
            onClick={handleBuy}
            className="w-full py-3 bg-primary-700 text-white rounded-xl font-medium hover:bg-primary-800 transition-colors"
          >
            {localStorage.getItem("access_token") ? "立即购买" : "登录后购买"}
          </button>

          {msg && (
            <p className="text-sm text-center mt-3 text-gray-600">{msg}</p>
          )}
        </div>
      </div>
    </div>
  );
}