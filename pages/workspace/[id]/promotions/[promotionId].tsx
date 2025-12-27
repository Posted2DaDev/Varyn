import workspace from "@/layouts/workspace";
import { pageWithLayout } from "@/layoutTypes";
import { workspacestate } from "@/state";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
//
import { withPermissionCheckSsr } from "@/utils/permissionsManager";
import prisma from "@/utils/database";
import {
  IconThumbUp,
  IconThumbDown,
  IconTrash,
  IconMessageCircle,
  IconUsers,
  IconUser,
  IconCalendar,
} from "@tabler/icons-react";
import moment from "moment";

interface PromotionDetail {
  id: string;
  recommenderId: string;
  recommenderName: string;
  recommenderAvatar: string;
  targetUserId: string;
  targetUsername: string;
  targetAvatar: string;
  currentRole: string;
  recommendedRole: string;
  reason: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  voters: {
    userId: string;
    username: string;
    avatar: string;
  }[];
  comments: {
    id: number;
    userId: string;
    username: string;
    avatar: string;
    content: string;
    createdAt: string;
    isUpvote: boolean;
  }[];
  targetJoinDate?: string;
}

export const getServerSideProps = withPermissionCheckSsr(
  async (context: any) => {
    const { id, promotionId } = context.query;
    const userid = context.req.session.userid;

    if (!userid) {
      return {
        redirect: {
          destination: "/login",
        },
      };
    }

    if (!id || !promotionId) {
      return {
        notFound: true,
      };
    }

    const config = await prisma.config.findFirst({
      where: {
        workspaceGroupId: Number.parseInt(id as string),
        key: "promotions",
      },
    });

    let promotionsEnabled = false;
    if (config?.value) {
      let val = config.value;
      if (typeof val === "string") {
        try {
          val = JSON.parse(val);
        } catch {
          val = {};
        }
      }
      promotionsEnabled =
        typeof val === "object" && val !== null && "enabled" in val
          ? (val as { enabled?: boolean }).enabled ?? false
          : false;
    }

    if (!promotionsEnabled) {
      return { notFound: true };
    }

    return {
      props: {},
    };
  },
  "view_promotions"
);

const PromotionDetailPage: pageWithLayout = () => {
  const router = useRouter();
  const [workspaceState] = useRecoilState(workspacestate);
  const [promotion, setPromotion] = useState<PromotionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [justification, setJustification] = useState("");
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (router.query.id && router.query.promotionId) {
      fetchPromotion();
    }
  }, [router.query.id, router.query.promotionId]);

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/workspace/${router.query.id}/promotions/${router.query.promotionId}`
      );
      setPromotion(response.data.promotion);
    } catch (error) {
      console.error("Failed to fetch promotion:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (isUpvote: boolean) => {
    if (!justification.trim()) {
      alert("Please provide a justification for your vote");
      return;
    }

    try {
      setIsVoting(true);
      await axios.post(
        `/api/workspace/${router.query.id}/promotions/${router.query.promotionId}/vote`,
        {
          isUpvote,
          justification,
        }
      );
      setJustification("");
      fetchPromotion();
    } catch (error) {
      console.error("Failed to vote:", error);
      alert("Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this promotion recommendation?")) {
      return;
    }

    try {
      await axios.delete(
        `/api/workspace/${router.query.id}/promotions/${router.query.promotionId}`
      );
      router.push(`/workspace/${router.query.id}/promotions`);
    } catch (error) {
      console.error("Failed to delete promotion:", error);
      alert("Failed to delete promotion");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-600 dark:text-zinc-400">Promotion not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto">
        <div className="lg:flex gap-8 items-start">
          {/* Sidebar */}
          <div className="lg:w-80 mb-8 lg:mb-0 space-y-6">
            {/* Voters */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                  <IconUsers className="w-5 h-5 inline mr-2" />
                  Voters ({promotion.voters.length})
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {promotion.voters.map((voter) => (
                    <div key={voter.userId} className="flex items-center gap-3">
                      <img
                        src={voter.avatar}
                        alt={voter.username}
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                      />
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {voter.username}
                      </span>
                    </div>
                  ))}
                  {promotion.voters.length === 0 && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No votes yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Player Info */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                  <IconUser className="w-5 h-5 inline mr-2" />
                  Player Info
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      <IconCalendar className="w-4 h-4 inline mr-1" />
                      Joined Roblox
                    </label>
                    <p className="text-zinc-900 dark:text-white">
                      {promotion.targetJoinDate
                        ? moment(promotion.targetJoinDate).format("MMM D, YYYY")
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Promotion Header */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm border-zinc-200 dark:border-zinc-700 overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Upvote Button */}
                  <button className="py-2 px-4 inline-flex flex-col items-center border rounded-lg transition-colors font-medium bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-600/40 dark:border-blue-600 dark:text-blue-100">
                    <IconThumbUp className="w-5 h-5 mb-1" />
                    {promotion.upvotes}
                  </button>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <img
                        src={promotion.targetAvatar}
                        alt={promotion.targetUsername}
                        className="w-12 h-12 rounded-lg flex-shrink-0"
                      />
                      <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                          {promotion.targetUsername}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-zinc-600 dark:text-zinc-400">for</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-600/40 text-blue-700 dark:text-blue-100 text-sm font-medium">
                            <IconUser className="w-3 h-3 mr-1" />
                            {promotion.recommendedRole}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  {Array.isArray(workspaceState?.yourPermission) && 
                   (workspaceState.yourPermission.includes("manage_promotions") ||
                    workspaceState.yourPermission.includes("admin")) ? (                    <div className="sm:ml-auto">
                      <button
                        onClick={handleDelete}
                        className="cursor-pointer transition-colors font-medium rounded-md py-2 px-8 active:scale-[0.98] inline-block bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        <IconTrash className="w-4 h-4 inline mr-2" />
                        Delete Recommendation
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Original Recommendation */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm border-zinc-200 dark:border-zinc-700 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                  <IconMessageCircle className="w-5 h-5 inline mr-2" />
                  Original Recommendation
                </h2>
              </div>
              <div className="p-6">
                <div className="flex gap-4">
                  <img
                    src={promotion.recommenderAvatar}
                    alt={promotion.recommenderName}
                    className="w-10 h-10 rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {promotion.recommenderName}
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {moment(promotion.createdAt).format("MMM D, YYYY, h:mm:ss A")}
                      </span>
                    </div>
                    <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4">
                      {promotion.reason}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Supporter Justifications */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                  <IconMessageCircle className="w-5 h-5 inline mr-2" />
                  Supporter Justifications
                </h2>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {promotion.comments.map((comment) => (
                  <div key={comment.id} className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={comment.avatar}
                          alt={comment.username}
                          className="w-10 h-10 rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {comment.isUpvote ? (
                            <IconThumbUp className="w-4 h-4 text-green-500" />
                          ) : (
                            <IconThumbDown className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            {comment.username}
                          </span>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            {moment(comment.createdAt).format("MMM D, YYYY, h:mm:ss A")}
                          </span>
                        </div>
                        <div className="text-zinc-700 dark:text-zinc-300">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {promotion.comments.length === 0 && (
                  <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                    No justifications yet
                  </div>
                )}
              </div>
            </div>

            {/* Add Vote Section */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm border-zinc-200 dark:border-zinc-700 overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                  Add Your Vote
                </h2>
              </div>
              <div className="p-6">
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explain why you support or oppose this promotion..."
                  rows={4}
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVote(true)}
                    disabled={isVoting || !justification.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <IconThumbUp className="w-4 h-4" />
                    Support
                  </button>
                  <button
                    onClick={() => handleVote(false)}
                    disabled={isVoting || !justification.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <IconThumbDown className="w-4 h-4" />
                    Oppose
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PromotionDetailPage.layout = workspace;

export default PromotionDetailPage;
