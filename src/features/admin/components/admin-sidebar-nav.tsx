"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type JSX, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type AdminSidebarNavProps = React.HTMLAttributes<HTMLElement> & {
	items: {
		href: string;
		title: string;
		icon: JSX.Element;
	}[];
};

export function AdminSidebarNav({
	className,
	items,
	...props
}: AdminSidebarNavProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [val, setVal] = useState(pathname ?? "/admin");

	const handleSelect = (e: string) => {
		setVal(e);
		router.push(e);
	};

	return (
		<>
			{/* Mobile dropdown */}
			<div className="p-1 md:hidden">
				<Select value={val} onValueChange={handleSelect}>
					<SelectTrigger className="h-12 sm:w-48">
						<SelectValue placeholder="Select category" />
					</SelectTrigger>
					<SelectContent>
						{items.map((item) => (
							<SelectItem key={item.href} value={item.href}>
								<div className="flex gap-x-4 px-2 py-1 items-center">
									<span className="scale-125">{item.icon}</span>
									<span className="text-md">{item.title}</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Desktop sidebar */}
			<ScrollArea
				type="always"
				className="hidden w-full min-w-40 px-1 py-2 md:block"
			>
				<nav
					className={cn(
						"flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0",
						className,
					)}
					{...props}
				>
					{items.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								buttonVariants({ variant: "ghost" }),
								pathname === item.href
									? "bg-muted hover:bg-accent"
									: "hover:bg-accent hover:underline",
								"justify-start",
							)}
						>
							<span className="me-2">{item.icon}</span>
							{item.title}
						</Link>
					))}
				</nav>
			</ScrollArea>
		</>
	);
}
