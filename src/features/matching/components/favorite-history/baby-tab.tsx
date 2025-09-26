import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Trash2 } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTimeAgo } from "@/lib/utils/date";

export function BabyTab() {
	const [babyHistory, setBabyHistory] = React.useState<any[]>([]);

	const deleteBaby = (id: string) => {};
	return (
		<div>
			{babyHistory.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					<div className="text-4xl mb-3">👶</div>
					<p>No baby generations yet</p>
					<p className="text-sm">Generate your first baby to see it here</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<AnimatePresence>
						{babyHistory.map((baby) => (
							<motion.div
								key={baby.id}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
							>
								<Card className="p-4 group hover:shadow-md transition-shadow">
									<div className="space-y-3">
										<div className="flex justify-between items-start">
											<h3 className="font-semibold text-sm">
												Baby with {baby.matchName}
											</h3>
											<Button
												size="sm"
												variant="outline"
												onClick={() => deleteBaby(baby.id)}
												className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive p-1.5"
											>
												<Trash2 className="w-3 h-3" />
											</Button>
										</div>

										<div className="flex items-center justify-between">
											<img
												src={baby.userPhoto}
												alt="You"
												className="w-12 h-12 rounded-full object-cover"
											/>
											<img
												src={baby.babyImage}
												alt="Baby"
												className="w-16 h-16 rounded-full object-cover border-2 border-primary"
											/>
											<img
												src={baby.matchPhoto}
												alt={baby.matchName}
												className="w-12 h-12 rounded-full object-cover"
											/>
										</div>

										<div className="flex items-center justify-between text-xs text-muted-foreground">
											<Badge variant="outline" className="text-xs">
												{baby.matchType}
											</Badge>
											<span className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												{getTimeAgo(baby.timestamp)}
											</span>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			)}
		</div>
	);
}
