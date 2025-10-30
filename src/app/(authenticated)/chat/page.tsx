"use client";

import { Suspense } from "react";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { ChatContainer } from "@/features/chat/components/chat-container";

export default function ChatPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					<AITextLoading
						texts={["Matching...", "Loading...", "Please wait..."]}
					/>
				</div>
			}
		>
			<ChatContainer />
		</Suspense>
	);
}
