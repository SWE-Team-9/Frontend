"use client";

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

function normalizeUrl(url: string) {
    if (url.startsWith("http")) return url;
    return `https://${url}`;
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function MessageText({
    text,
    hiddenUrls = [],
}: {
    text: string;
    hiddenUrls?: string[];
}) {
    let visibleText = text;

    hiddenUrls.forEach((url) => {
        if (!url) return;

        const normalizedHidden = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

        visibleText = visibleText
            .split(/\s+/)
            .filter((word) => {
                const normalizedWord = word
                    .replace(/^https?:\/\//, "")
                    .replace(/\/$/, "")
                    .replace(/[.,!?)]$/, "");

                return normalizedWord !== normalizedHidden;
            })
            .join(" ")
            .trim();
    });

    const parts = visibleText.split(URL_REGEX);

    if (!visibleText) return null;

    return (
        <p className="whitespace-pre-wrap text-sm text-zinc-300">
            {parts.map((part, index) => {
                if (!part) return null;

                const isUrl =
                    part.startsWith("http://") ||
                    part.startsWith("https://") ||
                    part.startsWith("www.");

                if (isUrl) {
                    return (
                        <a
                            key={index}
                            href={normalizeUrl(part)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline hover:text-blue-400"
                        >
                            {part}
                        </a>
                    );
                }

                return <span key={index}>{part}</span>;
            })}
        </p>
    );
}