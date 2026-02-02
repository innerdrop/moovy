"use client";
import React from 'react';

interface AdBannerProps {
    title: string;
    subtitle: string;
    buttonText?: string;
    variant?: 'primary' | 'secondary' | 'dark';
    className?: string;
    id?: string;
}

export default function AdBanner({
    title,
    subtitle,
    buttonText = "Ver más",
    variant = 'primary',
    className = "",
    id = "ad-banner"
}: AdBannerProps) {

    const variants = {
        primary: "bg-gradient-to-r from-[#e60012] to-[#ff4444] text-white",
        secondary: "bg-gradient-to-r from-blue-600 to-blue-800 text-white",
        dark: "bg-gradient-to-r from-gray-800 to-gray-950 text-white"
    };

    return (
        <div
            id={id}
            className={`relative overflow-hidden rounded-3xl p-8 shadow-lg group hover:shadow-xl transition-all duration-300 ${variants[variant]} ${className}`}
        >
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
                        Publicidad
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black mb-2 leading-tight">
                        {title}
                    </h3>
                    <p className="text-white/80 text-sm md:text-base font-medium max-w-md">
                        {subtitle}
                    </p>
                </div>

                <div className="flex-shrink-0">
                    <button className="bg-white text-gray-900 px-8 py-3 rounded-2xl font-bold hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-md">
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
