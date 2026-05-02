"use client";

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

function normalizeUrl(url: string) {
    if (url.startsWith("http")) return url;
    return `https://${url}`;
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getHiddenUrlVariants(url: string) {
    const clean = url.trim().replace(/\/$/, "");
    const withoutProtocol = clean.replace(/^https?:\/\//, "");

    const variants = new Set<string>([
        clean,
        withoutProtocol,
        `https://${withoutProtocol}`,
        `http://${withoutProtocol}`,
    ]);

    try {
        const parsed = new URL(clean.startsWith("http") ? clean : `https://${clean}`);
        variants.add(parsed.pathname.replace(/\/$/, ""));
    } catch {
        // ignore invalid URL parsing
    }

    return [...variants].filter(Boolean);
}

function removeHiddenUrls(text: string, hiddenUrls: string[]) {
    let nextText = text;

    hiddenUrls.forEach((url) => {
        if (!url) return;

        getHiddenUrlVariants(url).forEach((variant) => {
            const pattern = new RegExp(
                `(^|\\s)${escapeRegExp(variant)}(?=\\s|[.,!?)]|$)`,
                "g",
            );

            nextText = nextText.replace(pattern, "$1");
        });
    });

    return nextText
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export default function MessageText({
    text,
    hiddenUrls = [],
}: {
    text: string;
    hiddenUrls?: string[];
}) {
    const visibleText = removeHiddenUrls(text, hiddenUrls);

    if (!visibleText) return null;

    const parts = visibleText.split(URL_REGEX);

    return (
        <p className="whitespace-pre-wrap break-words text-sm text-zinc-300">
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