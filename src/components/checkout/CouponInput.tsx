"use client";

import { useState } from "react";
import { Loader2, X, Check } from "lucide-react";

interface CouponInputProps {
  orderTotal: number;
  onCouponApply: (
    couponCode: string,
    discountAmount: number,
    couponId: string
  ) => void;
  onCouponRemove: () => void;
  appliedCoupon?: {
    code: string;
    discountAmount: number;
    couponId: string;
  } | null;
}

export default function CouponInput({
  orderTotal,
  onCouponApply,
  onCouponRemove,
  appliedCoupon,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError("Ingresa un código de cupón");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          orderTotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error validando cupón");
        return;
      }

      setSuccess(true);
      setCode("");
      onCouponApply(data.coupon.code, data.discountAmount, data.coupon.id);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleValidate();
    }
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-700">
                Cupón aplicado: {appliedCoupon.code}
              </p>
              <p className="text-sm text-green-600">
                Descuento: ${appliedCoupon.discountAmount.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onCouponRemove}
            className="p-2 hover:bg-green-100 rounded-lg transition text-green-600"
            aria-label="Remover cupón"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        Código de cupón
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
            setSuccess(false);
          }}
          onKeyPress={handleKeyPress}
          placeholder="Ingresa tu código"
          disabled={loading}
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-moovy transition disabled:bg-gray-50 disabled:text-gray-400"
          autoComplete="off"
        />
        <button
          onClick={handleValidate}
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-moovy text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 transition flex items-center gap-2 whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Validando...
            </>
          ) : (
            "Aplicar"
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 flex items-center gap-2">
          <Check className="w-4 h-4" />
          ¡Cupón aplicado correctamente!
        </div>
      )}
    </div>
  );
}
