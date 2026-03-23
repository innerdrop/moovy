// Custom chat bubble icon for support widget
export function ChatBubbleIcon({ className = "" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Main speech bubble */}
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l6.29-.97C9.5 21.61 10.96 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.41 0-2.73-.35-3.88-.96l-.28-.15-2.89.44.44-2.89-.15-.28C3.35 14.73 3 13.41 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z" />
        </svg>
    );
}
