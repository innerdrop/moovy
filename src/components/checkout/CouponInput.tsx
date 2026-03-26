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
      <div className="bg-green-50 border-2 border-green-200 rounded-lg lg:rounded-xl p-4 lg:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-700 lg:text-base">
                Cupón aplicado: {appliedCoupon.code}
              </p>
              <p className="text-sm lg:text-base text-green-600">
                Descuento: ${appliedCoupon.discountAmount.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onCouponRemove}
            className="p-2 lg:p-3 hover:bg-green-100 rounded-lg lg:rounded-xl transition text-green-600 flex-shrink-0"
            aria-label="Remover cupón"
          >
            <X className="w-5 h-5 lg:w-6 lg:h-6" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 lg:space-y-3">
      <label className="block text-sm lg:text-base font-semibold text-gray-700">
        Código de cupón
      </label>
      <div className="flex gap-2 lg:gap-3">
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
          className="flex-1 px-4 py-2 lg:px-5 lg:py-3 border-2 border-gray-200 rounded-lg lg:rounded-xl lg:text-base focus:outline-none focus:border-moovy transition disabled:bg-gray-50 disabled:text-gray-400"
          autoComplete="off"
        />
        <button
          onClick={handleValidate}
          disabled={loading || !code.trim()}
          className="px-4 lg:px-6 py-2 lg:py-3 bg-moovy text-white rounded-lg lg:rounded-xl font-medium lg:font-semibold hover:bg-red-700 disabled:bg-gray-300 transition flex items-center gap-2 whitespace-nowrap lg:text-base"
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
        <div className="p-3 lg:p-4 bg-red-50 border border-red-200 rounded-lg lg:rounded-xl text-sm lg:text-base text-red-600 flex items-center gap-2">
          <X className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 lg:p-4 bg-green-50 border border-green-200 rounded-lg lg:rounded-xl text-sm lg:text-base text-green-600 flex items-center gap-2">
          <Check className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
          ¡Cupón aplicado correctamente!
        </div>
      )}
    </div>
  );
}
