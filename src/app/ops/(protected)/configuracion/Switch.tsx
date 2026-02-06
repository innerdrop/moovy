"use client";

import { useState } from "react";

interface SwitchProps {
    name: string;
    defaultChecked: boolean;
    activeColor?: string;
}

export function Switch({ name, defaultChecked, activeColor = "bg-moovy" }: SwitchProps) {
    const [checked, setChecked] = useState(defaultChecked);

    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="sr-only peer"
                name={name}
            />
            <div className={`w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:${activeColor.replace('bg-', '') === 'moovy' ? 'bg-moovy' : activeColor}`}></div>
            {/* Hidden field to ensure data is sent even when off if needed, but for standard FormData, absence is enough */}
        </label>
    );
}
