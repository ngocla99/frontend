import Image, { type ImageProps } from "next/image";
import { memo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Helps prevent flickering from re-rendering
export const BlurImage = memo((props: ImageProps) => {
	const [loading, setLoading] = useState(true);
	// Provide fallback avatar if src is undefined/null
	const fallbackSrc =
		props.src ||
		`https://avatar.vercel.sh/${encodeURIComponent(props.alt || "user")}`;
	const [src, setSrc] = useState(fallbackSrc);
	useEffect(() => {
		const newSrc =
			props.src ||
			`https://avatar.vercel.sh/${encodeURIComponent(props.alt || "user")}`;
		setSrc(newSrc);
	}, [props.src, props.alt]); // update the `src` value when the `prop.src` value changes

	const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
		setLoading(false);
		const target = e.target as HTMLImageElement;
		if (target.naturalWidth <= 16 && target.naturalHeight <= 16) {
			setSrc(`https://avatar.vercel.sh/${encodeURIComponent(props.alt)}`);
		}
	};

	return (
		<Image
			{...props}
			src={src}
			alt={props.alt}
			className={cn(
				"object-cover",
				loading ? "blur-[2px]" : "blur-0",
				props.className,
			)}
			onLoad={handleLoad}
			onError={() => {
				setSrc(`https://avatar.vercel.sh/${encodeURIComponent(props.alt)}`); // if the image fails to load, use the default avatar
			}}
			unoptimized
		/>
	);
});
