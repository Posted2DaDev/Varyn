import { useEffect, useState } from "react";
import { GetServerSidePropsContext } from "next";
import { withSessionSsr } from "@/lib/withSession";
import { IconUser, IconUserCircle, IconSparkles, IconMail, IconLock, IconShield, IconCake, IconWorld, IconX } from "@tabler/icons-react";
import Topbar from "@/components/topbar";
import axios from "axios";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { toast } from "react-hot-toast";
import Input from "@/components/input";
import Button from "@/components/button";
import { useRecoilState } from "recoil";
import { desktopCatState } from "@/state/fun";
import Confetti from "react-confetti";

type Tab = "account" | "profile" | "fun";

interface SettingsProps {
	user: {
		userid: string;
		username: string;
		email?: string;
		birthdayDay?: number;
		birthdayMonth?: number;
		country?: string;
	};
}

export default function Settings({ user: initialUser }: SettingsProps) {
	const [activeTab, setActiveTab] = useState<Tab>("account");
	const [desktopCat, setDesktopCat] = useRecoilState(desktopCatState);
	const [showCatConfetti, setShowCatConfetti] = useState(false);
	const [user, setUser] = useState(initialUser);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editField, setEditField] = useState<"email" | "birthday" | "country" | null>(null);
	const [formData, setFormData] = useState({ email: "", birthdayDay: "", birthdayMonth: "", country: "" });
	const [loading, setLoading] = useState(false);
	const [emailCodeSent, setEmailCodeSent] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");
	const router = useRouter();

	const tabs = [
		{ id: "account" as Tab, name: "Account", icon: IconUser },
		{ id: "profile" as Tab, name: "Profile", icon: IconUserCircle },
		{ id: "fun" as Tab, name: "Fun", icon: IconSparkles },
	];

	const formatBirthday = () => {
		if (!user.birthdayDay || !user.birthdayMonth) return "Not set";
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		return `${user.birthdayDay} ${months[user.birthdayMonth - 1]}`;
	};

	const openEditModal = (field: "email" | "birthday" | "country") => {
		setEditField(field);
		if (field === "email") {
			setFormData({ ...formData, email: user.email || "" });
			setEmailCodeSent(false);
			setVerificationCode("");
		} else if (field === "birthday") {
			setFormData({ 
				...formData, 
				birthdayDay: user.birthdayDay?.toString() || "", 
				birthdayMonth: user.birthdayMonth?.toString() || "" 
			});
		} else if (field === "country") {
			setFormData({ ...formData, country: user.country || "" });
		}
		setIsEditModalOpen(true);
	};

	const handleSave = async () => {
		setLoading(true);
		try {
			// Email uses a two-step verification flow
			if (editField === "email") {
				if (!emailCodeSent) {
					// Step 1: request verification code
					const resp = await axios.post("/api/user/email-verify/request", {
						email: formData.email,
					});
					if (resp.status === 200) {
						setEmailCodeSent(true);
						toast.success("Verification code sent to your email");
					}
				} else {
					// Step 2: confirm code and update email everywhere
					const resp = await axios.post("/api/user/email-verify/confirm", {
						email: formData.email,
						code: verificationCode,
					});
					if (resp.data.success) {
						setUser(resp.data.user);
						toast.success("Email verified and updated!");
						setIsEditModalOpen(false);
						setEmailCodeSent(false);
						setVerificationCode("");
					}
				}
				return;
			}

			// Other fields go through the regular settings update endpoint
			const updateData: any = {};
			if (editField === "birthday") {
				updateData.birthdayDay = formData.birthdayDay ? parseInt(formData.birthdayDay) : null;
				updateData.birthdayMonth = formData.birthdayMonth ? parseInt(formData.birthdayMonth) : null;
			} else if (editField === "country") {
				updateData.country = formData.country;
			}

			const response = await axios.patch("/api/user/settings/update", updateData);
			if (response.data.success) {
				setUser(response.data.user);
				toast.success("Settings updated successfully!");
				setIsEditModalOpen(false);
			}
		} catch (error: any) {
			toast.error(error.response?.data?.error || "Failed to update settings");
		} finally {
			setLoading(false);
		}
	};

	// Brief confetti burst when turning the desktop cat on
	useEffect(() => {
		if (!desktopCat) return;
		setShowCatConfetti(true);
		const timeout = setTimeout(() => setShowCatConfetti(false), 2000);
		return () => clearTimeout(timeout);
	}, [desktopCat]);

	return (
		<div className="min-h-screen bg-white dark:bg-zinc-900">
			{showCatConfetti && (
				<div className="pointer-events-none fixed inset-0 z-[99999]">
					<Confetti
						recycle={false}
						numberOfPieces={250}
						gravity={0.8}
						initialVelocityY={15}
						colors={["#26ccff", "#a25afd", "#ff5e7e", "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff"]}
						style={{ width: "100%", height: "100%" }}
					/>
				</div>
			)}
			<Topbar />
			
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Sidebar */}
					<div className="lg:w-64 flex-shrink-0">
						<nav className="space-y-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2">
							{tabs.map((tab) => {
								const Icon = tab.icon;
								return (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
											activeTab === tab.id
												? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
												: "text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-700"
										}`}
									>
										<Icon className="h-5 w-5" />
										<span className="font-medium">{tab.name}</span>
									</button>
								);
							})}
						</nav>
					</div>

					{/* Main Content */}
					<div className="flex-1">
						<div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg">
							{/* Account Tab */}
							{activeTab === "account" && (
								<div className="p-6 space-y-6">
									<div>
										<h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Account</h1>
										<p className="text-zinc-600 dark:text-zinc-400">
											Manage your account settings, including your email address and password. Keep your account secure by using a strong password and updating it regularly.
										</p>
									</div>

									{/* Email Address */}
									<div className="bg-white dark:bg-zinc-900 rounded-lg p-6">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Email Address</h3>
												<p className="text-zinc-600 dark:text-zinc-400">
													{user.email || "No email set"}
												</p>
											</div>
											<button 
												onClick={() => openEditModal("email")}
												className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
											>
												<IconMail className="h-4 w-4" />
												Edit
											</button>
										</div>
									</div>

									{/* Password */}
									<div className="bg-white dark:bg-zinc-900 rounded-lg p-6">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Password</h3>
												<p className="text-zinc-600 dark:text-zinc-400">
													••••••••
												</p>
											</div>
											<button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
												<IconLock className="h-4 w-4" />
												Edit
											</button>
										</div>
									</div>

									{/* Two-Factor Authentication */}
									<div className="bg-white dark:bg-zinc-900 rounded-lg p-6">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Two-Factor Authentication</h3>
												<p className="text-zinc-600 dark:text-zinc-400 mb-1">Not enabled</p>
												<p className="text-sm text-zinc-500 dark:text-zinc-500">
													Add an extra layer of security to your account
												</p>
											</div>
											<button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
												<IconShield className="h-4 w-4" />
												Enable 2FA
											</button>
										</div>
									</div>
								</div>
							)}

							{/* Profile Tab */}
							{activeTab === "profile" && (
								<div className="p-6 space-y-6">
									<div>
										<h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Account</h1>
										<p className="text-zinc-600 dark:text-zinc-400">
											Manage your profile settings for your account.
										</p>
									</div>

									{/* Birthday */}
									<div className="bg-white dark:bg-zinc-900 rounded-lg p-6">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Birthday</h3>
												<p className="text-zinc-600 dark:text-zinc-400">
													{formatBirthday()}
												</p>
											</div>
											<button 
												onClick={() => openEditModal("birthday")}
												className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
											>
												<IconCake className="h-4 w-4" />
												Edit
											</button>
										</div>
									</div>

									{/* Country */}
									<div className="bg-white dark:bg-zinc-900 rounded-lg p-6">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Country</h3>
												<p className="text-zinc-600 dark:text-zinc-400">
													{user.country || "Not set"}
												</p>
											</div>
											<button 
												onClick={() => openEditModal("country")}
												className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
											>
												<IconWorld className="h-4 w-4" />
												Edit
											</button>
										</div>
									</div>
								</div>
							)}

							{/* Fun Tab */}
							{activeTab === "fun" && (
								<div className="p-6 space-y-6">
									<div>
										<h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Fun</h1>
									</div>

									{/* Desktop Cat */}
									<div className="bg-white dark:bg-zinc-900 rounded-lg p-6">
										<div className="flex items-center justify-between">
											<div>
												<h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Desktop Cat</h3>
												<p className="text-sm text-zinc-500 dark:text-zinc-500">
													Enable a cute cat that follows your cursor around the screen
												</p>
											</div>
											<button
												onClick={() => setDesktopCat(!desktopCat)}
												className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
													desktopCat ? "bg-teal-600" : "bg-zinc-300 dark:bg-zinc-600"
												}`}
											>
												<span
													className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
														desktopCat ? "translate-x-6" : "translate-x-1"
													}`}
												/>
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Edit Modal */}
			<Transition appear show={isEditModalOpen} as={Fragment}>
				<Dialog as="div" className="relative z-50" onClose={() => setIsEditModalOpen(false)}>
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
					</Transition.Child>

					<div className="fixed inset-0 overflow-y-auto">
						<div className="flex min-h-full items-center justify-center p-4">
							<Transition.Child
								as={Fragment}
								enter="ease-out duration-300"
								enterFrom="opacity-0 scale-95"
								enterTo="opacity-100 scale-100"
								leave="ease-in duration-200"
								leaveFrom="opacity-100 scale-100"
								leaveTo="opacity-0 scale-95"
							>
								<Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-800 p-6 shadow-xl transition-all">
									<div className="flex items-center justify-between mb-4">
										<Dialog.Title className="text-lg font-semibold text-zinc-900 dark:text-white">
											Edit {editField === "email" ? "Email" : editField === "birthday" ? "Birthday" : "Country"}
										</Dialog.Title>
										<button
											onClick={() => setIsEditModalOpen(false)}
											className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
										>
											<IconX className="h-5 w-5" />
										</button>
									</div>

									<div className="space-y-4">
										{editField === "email" && (
											<div>
												<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
													Email Address
												</label>
												<Input
													type="email"
													value={formData.email}
													onChange={(e) => setFormData({ ...formData, email: e.target.value })}
													placeholder="Enter your email"
												/>

												{emailCodeSent && (
													<div className="mt-4">
														<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
															Verification Code
														</label>
														<Input
															type="text"
															value={verificationCode}
															onChange={(e) => setVerificationCode(e.target.value)}
															placeholder="Enter the 6-digit code"
														/>
														<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
															Check your inbox for a message with your verification code.
														</p>
													</div>
												)}
											</div>
										)}

										{editField === "birthday" && (
											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
														Day
													</label>
													<Input
														type="number"
														min="1"
														max="31"
														value={formData.birthdayDay}
														onChange={(e) => setFormData({ ...formData, birthdayDay: e.target.value })}
														placeholder="Day"
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
														Month
													</label>
													<select
														value={formData.birthdayMonth}
														onChange={(e) => setFormData({ ...formData, birthdayMonth: e.target.value })}
														className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
													>
														<option value="">Month</option>
														{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, i) => (
															<option key={i} value={i + 1}>{month}</option>
														))}
													</select>
												</div>
											</div>
										)}

										{editField === "country" && (
											<div>
												<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
													Country
												</label>
												<Input
													type="text"
													value={formData.country}
													onChange={(e) => setFormData({ ...formData, country: e.target.value })}
													placeholder="Enter your country"
												/>
											</div>
										)}
									</div>

									<div className="flex gap-3 mt-6">
										<Button
											onClick={() => setIsEditModalOpen(false)}
											className="flex-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600"
										>
											Cancel
										</Button>
										<Button
											onClick={handleSave}
											disabled={loading}
											className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
										>
											{loading ? "Saving..." : "Save"}
										</Button>
									</div>
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition>
		</div>
	);
}

export const getServerSideProps = withSessionSsr(
	async function getServerSideProps(context: GetServerSidePropsContext) {
		const userid = context.req.session?.userid;

		if (!userid) {
			return {
				redirect: {
					destination: "/login",
					permanent: false,
				},
			};
		}

		try {
			const { default: prisma } = await import("@/utils/database");
			
			const user = await prisma.user.findUnique({
				where: { userid: BigInt(userid) },
				select: {
					userid: true,
					username: true,
					email: true,
					country: true,
					birthdayDay: true,
					birthdayMonth: true,
				},
			});

			if (!user) {
				return {
					redirect: {
						destination: "/login",
						permanent: false,
					},
				};
			}

			return {
				props: {
					user: {
						userid: user.userid.toString(),
						username: user.username,
						email: user.email,
						birthdayDay: user.birthdayDay,
						birthdayMonth: user.birthdayMonth,
						country: user.country,
					},
				},
			};
		} catch (error) {
			console.error("Error loading user settings:", error);
			return {
				redirect: {
					destination: "/login",
					permanent: false,
				},
			};
		}
	}
);
