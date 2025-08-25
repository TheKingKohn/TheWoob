import { useState } from "react";
import { GetServerSideProps } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions } from "../lib/session";
import { prisma } from "../lib/prisma";
import Nav from "../components/Nav";
import { ButtonLoader } from "../components/Loading";
import { toast } from "../components/Toast";

interface AccountPageProps {
	user: any;
	authed: boolean;
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
	const session = await getIronSession(req, res, sessionOptions);
	const user = (session as any).user;

	if (!user) {
		return { redirect: { destination: "/signin", permanent: false } };
	}

	// Get full user data from database
	const fullUser = (await prisma.user.findUnique({
		where: { id: user.id },
	})) as any;

	return {
		props: {
			authed: true,
			user: JSON.parse(JSON.stringify(fullUser)),
		},
	};
};

export default function Account({ user, authed }: AccountPageProps) {
	const [name, setName] = useState(user.name || "");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [passwordLoading, setPasswordLoading] = useState(false);

	async function updateProfile(e: any) {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await fetch("/api/auth/update-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim() }),
			});

			if (response.ok) {
				toast.success("Profile updated!", "Your profile has been saved");
			} else {
				const data = await response.json();
				toast.error("Update failed", data.error);
			}
		} catch (err) {
			toast.error("Connection error", "Please try again");
		} finally {
			setLoading(false);
		}
	}

	async function updatePassword(e: any) {
		e.preventDefault();

		if (newPassword.length < 8) {
			toast.error(
				"Password too short",
				"Password must be at least 8 characters",
			);
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("Passwords don't match", "Please check your passwords");
			return;
		}

		setPasswordLoading(true);

		try {
			const response = await fetch("/api/auth/update-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: newPassword }),
			});

			if (response.ok) {
				toast.success("Password updated!", "Your password has been changed");
				setNewPassword("");
				setConfirmPassword("");
			} else {
				const data = await response.json();
				toast.error("Update failed", data.error);
			}
		} catch (err) {
			toast.error("Connection error", "Please try again");
		} finally {
			setPasswordLoading(false);
		}
	}

	return (
		<>
			<Nav authed={authed} />
			<main className="woob-container py-8">
				<div className="max-w-2xl mx-auto space-y-6">
					<div className="panel p-6">
						<h2 className="text-2xl font-bold mb-4">Account Settings</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Profile Information */}
							<div className="panel p-4">
								<h3 className="text-lg font-semibold mb-3">
									Profile Information
								</h3>
								<form onSubmit={updateProfile} className="space-y-4">
									<div>
										<label className="label">Email Address</label>
										<input
											type="email"
											className="input bg-white/5"
											value={user.email}
											disabled
											title="Email address cannot be changed"
										/>
										<p className="text-xs text-white/60 mt-1">
											Email cannot be changed
										</p>
									</div>

									<div>
										<label className="label">Display Name</label>
										<input
											className="input"
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="Your name"
										/>
									</div>

									<button
										className="btn w-full flex items-center justify-center gap-2"
										disabled={loading}
									>
										{loading ? (
											<>
												<ButtonLoader />
												Updating...
											</>
										) : (
											"Update Profile"
										)}
									</button>
								</form>
							</div>

							{/* Security Settings */}
							<div className="panel p-4">
								<h3 className="text-lg font-semibold mb-3">Security</h3>

								<div className="space-y-4 mb-4">
									<div className="flex items-center justify-between">
										<span className="text-sm">Password Protection</span>
										<span
											className={`badge ${user.password ? "bg-green-600" : "bg-orange-600"}`}
										>
											{user.password ? "Enabled" : "Disabled"}
										</span>
									</div>

									<div className="flex items-center justify-between">
										<span className="text-sm">Email Verified</span>
										<span
											className={`badge ${user.emailVerified ? "bg-green-600" : "bg-red-600"}`}
										>
											{user.emailVerified ? "Verified" : "Unverified"}
										</span>
									</div>

									<div className="flex items-center justify-between">
										<span className="text-sm">Last Login</span>
										<span className="text-xs text-white/60">
											{user.lastLoginAt
												? new Date(user.lastLoginAt).toLocaleDateString()
												: "Never"}
										</span>
									</div>
								</div>

								<form onSubmit={updatePassword} className="space-y-4">
									<div>
										<label className="label">
											{user.password ? "New Password" : "Set Password"}
										</label>
										<input
											type="password"
											className="input"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
											placeholder="Enter new password"
											minLength={8}
										/>
									</div>

									<div>
										<label className="label">Confirm Password</label>
										<input
											type="password"
											className="input"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											placeholder="Confirm new password"
											minLength={8}
										/>
									</div>

									<button
										className="btn w-full flex items-center justify-center gap-2"
										disabled={passwordLoading || !newPassword}
									>
										{passwordLoading ? (
											<>
												<ButtonLoader />
												Updating...
											</>
										) : user.password ? (
											"Change Password"
										) : (
											"Set Password"
										)}
									</button>
								</form>
							</div>
						</div>
					</div>

					{/* Account Statistics */}
					<div className="panel p-6">
						<h3 className="text-lg font-semibold mb-3">Account Information</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
							<div className="panel p-3">
								<div className="text-2xl font-bold">{user.role}</div>
								<div className="text-xs text-white/60">Account Type</div>
							</div>
							<div className="panel p-3">
								<div className="text-2xl font-bold">
									{user.loginAttempts || 0}
								</div>
								<div className="text-xs text-white/60">Login Attempts</div>
							</div>
							<div className="panel p-3">
								<div className="text-2xl font-bold">
									{user.stripeAccountId ? "✓" : "✗"}
								</div>
								<div className="text-xs text-white/60">Stripe Connected</div>
							</div>
							<div className="panel p-3">
								<div className="text-2xl font-bold">
									{new Date(user.createdAt).getFullYear()}
								</div>
								<div className="text-xs text-white/60">Member Since</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
