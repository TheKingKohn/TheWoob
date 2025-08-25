import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Nav from "../../components/Nav";
import ForceGraph2D from "react-force-graph-2d";

export default function InviteGraph() {
	const [graphData, setGraphData] = useState({ nodes: [], links: [] });
	const [authed, setAuthed] = useState(false);

	async function fetchInviteData() {
		const res = await fetch("/api/admin/invite-graph");
		if (res.ok) {
			const { users, authed } = await res.json();
			setAuthed(authed);
			// Mark root nodes (no invitedById)
			const nodes = users.map((u: any) => ({
				id: u.id,
				label: `${u.name ? u.name : u.email ? u.email : "Unknown"}\n${u.affiliateCode ? "Code: " + u.affiliateCode : ""}`,
				code: u.affiliateCode,
				isRoot: !u.invitedById,
			}));
			const links = users
				.filter((u: any) => u.invitedById)
				.map((u: any) => ({ source: u.invitedById, target: u.id }));
			setGraphData({ nodes, links });
		}
	}

	useEffect(() => {
		fetchInviteData();
		const interval = setInterval(fetchInviteData, 10000); // Refresh every 10s
		return () => clearInterval(interval);
	}, []);

	if (!authed) {
		return (
			<div className="woob-container py-12 text-center text-xl">
				Admin access required.
			</div>
		);
	}

	return (
		<>
			<Nav authed={authed} />
			<main className="woob-container py-12">
				<h1 className="text-heading-2 mb-6">Invite Network Graph</h1>
				<div className="panel p-6">
					<div className="mb-4 flex gap-6 items-center">
						<span className="inline-flex items-center gap-2">
							<span className="inline-block w-4 h-4 rounded-full bg-blue-400"></span>{" "}
							Root User
						</span>
						<span className="inline-flex items-center gap-2">
							<span className="inline-block w-4 h-4 rounded-full bg-gray-400"></span>{" "}
							Invited User
						</span>
					</div>
					<ForceGraph2D
						graphData={graphData}
						nodeLabel={(node: any) => node.label}
						nodeAutoColorBy="isRoot"
						linkDirectionalArrowLength={6}
						linkDirectionalArrowRelPos={1}
						nodeCanvasObject={(
							node: any,
							ctx: CanvasRenderingContext2D,
							globalScale: number,
						) => {
							const label = node.label;
							const fontSize = 16 / globalScale;
							ctx.font = `${fontSize}px Sans-Serif`;
							ctx.fillStyle = node.isRoot ? "#2563eb" : "#22c55e";
							ctx.beginPath();
							ctx.arc(node.x, node.y, 16, 0, 2 * Math.PI, false);
							ctx.fill();
							ctx.fillStyle = "#111";
							ctx.textAlign = "center";
							ctx.textBaseline = "middle";
							ctx.fillText(label, node.x, node.y);
						}}
						linkColor={() => "#888"}
						backgroundColor="#f9fafb"
						width={window.innerWidth - 64}
						height={600}
					/>
				</div>
			</main>
		</>
	);
}
