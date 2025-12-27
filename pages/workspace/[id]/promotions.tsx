import workspace from "@/layouts/workspace";
import { pageWithLayout } from "@/layoutTypes";
import { loginState, workspacestate } from "@/state";
import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { GetServerSideProps } from "next";
import { withPermissionCheckSsr } from "@/utils/permissionsManager";
import prisma from "@/utils/database";
import {
  IconPlus,
  IconChevronDown,
  IconUser,
  IconUsers,
  IconTrophy,
  IconThumbUp,
  IconX,
} from "@tabler/icons-react";
import moment from "moment";

interface Promotion {
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
  comments: number;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

export const getServerSideProps = withPermissionCheckSsr(
  async (context: any) => {
    const { id } = context.query;
    const userid = context.req.session.userid;

    if (!userid) {
      return {
        redirect: {
          destination: "/login",
        },
      };
    }

    if (!id) {
      return {
        notFound: true,
      };
    }

    const user = await prisma.user.findFirst({
      where: {
        userid: userid,
      },
      include: {
        roles: {
          where: {
            workspaceGroupId: Number.parseInt(id as string),
          },
        },
      },
    });

    if (!user) {
      return {
        redirect: {
          destination: "/login",
        },
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

const PromotionCard = ({ promotion }: { promotion: Promotion }) => {
  const router = useRouter();
  
  return (
    <div 
      onClick={() => router.push(`/workspace/${router.query.id}/promotions/${promotion.id}`)}
      className="p-4 border-b hover:bg-zinc-100/50 dark:hover:bg-zinc-700/50 border-zinc-200 dark:border-zinc-700 flex flex-col md:flex-row gap-4 md:items-center items-start cursor-pointer"
    >
      {/* Upvote Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          // Handle upvote
        }}
        className="py-2 px-4 inline-flex flex-col items-center border rounded-lg border-zinc-200 dark:border-zinc-700 hover:bg-[color:rgb(var(--group-theme)/0.1)] hover:border-[color:rgb(var(--group-theme)/0.2)] hover:text-[color:rgb(var(--group-theme))] dark:hover:bg-zinc-700"
      >
        <IconThumbUp className="w-4 h-4" />
        <span className="text-sm font-medium">{promotion.upvotes}</span>
      </button>

      {/* Content */}
      <div className="flex flex-col flex-1">
        {/* Target User */}
        <div className="flex-1 flex gap-1 items-center mb-2">
          <img 
            className="h-6 w-6 mr-1 rounded-md" 
            src={promotion.targetAvatar}
            alt={promotion.targetUsername}
          />
          <span className="font-semibold text-zinc-900 dark:text-white">
            {promotion.targetUsername}
          </span>
          <span className="text-zinc-600 dark:text-zinc-400">for</span>
          <span className="text-zinc-900 dark:text-white">{promotion.recommendedRole}</span>
        </div>

        {/* Recommender Info */}
        <div className="flex text-sm items-center gap-1">
          <div className="text-zinc-600 dark:text-zinc-400">Suggested by</div>
          <div className="flex">
            <img 
              className="h-6 w-6 border border-white dark:border-zinc-600 rounded-md" 
              src={promotion.recommenderAvatar}
              alt={promotion.recommenderName}
            />
          </div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
            {promotion.upvotes} vote{promotion.upvotes !== 1 ? 's' : ''} in the last 24 hours
          </div>
        </div>
      </div>

      {/* Time */}
      <div className="text-xs text-zinc-400 dark:text-zinc-500">
        {moment(promotion.createdAt).fromNow()}
      </div>
    </div>
  );
};

const CreatePromotionModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const router = useRouter();
  const [targetUser, setTargetUser] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [recommendedRole, setRecommendedRole] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`/api/workspace/${router.query.id}/promotions`, {
        targetUser,
        currentRole,
        recommendedRole,
        reason,
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to create promotion:", error);
      alert("Failed to create promotion recommendation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            Create Promotion Recommendation
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Target User
            </label>
            <input
              type="text"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="Username"
              required
              className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Current Role
            </label>
            <input
              type="text"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              placeholder="e.g., Moderator"
              required
              className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Recommended Role
            </label>
            <input
              type="text"
              value={recommendedRole}
              onChange={(e) => setRecommendedRole(e.target.value)}
              placeholder="e.g., Senior Moderator"
              required
              className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this person deserves a promotion..."
              required
              rows={4}
              className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[color:rgb(var(--group-theme))] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Recommendation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PromotionsPage: pageWithLayout = () => {
  const router = useRouter();
  const [workspace] = useRecoilState(workspacestate);
  const [login] = useRecoilState(loginState);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [showRecommenderFilter, setShowRecommenderFilter] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (router.query.id) {
      fetchPromotions();
    }
  }, [router.query.id, sortBy]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/workspace/${router.query.id}/promotions?sort=${sortBy}`
      );
      setPromotions(response.data.promotions || []);
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPromotions = promotions.filter((promo) =>
    promo.targetUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    promo.recommenderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-700 px-6 py-4 bg-white dark:bg-zinc-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl tracking-wide font-bold text-zinc-900 dark:text-white">
              Promotions
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Review and manage staff promotion recommendations
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Create Recommendation Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full p-6 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
          >
            <img
              src={login.thumbnail}
              alt="Your avatar"
              className="w-12 h-12 rounded-lg flex-shrink-0"
            />
            <div className="text-left flex-1">
              <h3 className="font-medium text-zinc-900 dark:text-white">
                Create promotion recommendation
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Recommend a staff member for promotion
              </p>
            </div>
            <IconPlus className="text-zinc-400" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border shadow-sm border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Sort by
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white text-sm"
                  >
                    <option value="trending">Trending</option>
                    <option value="top">Top</option>
                    <option value="new">New</option>
                  </select>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search promotions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-3">
                <div className="relative">
                  <button
                    onClick={() => setShowRoleFilter(!showRoleFilter)}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white text-sm flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-600"
                  >
                    <IconUser className="w-4 h-4" />
                    <span>Role</span>
                    <IconChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowRecommenderFilter(!showRecommenderFilter)}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white text-sm flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-600"
                  >
                    <IconUsers className="w-4 h-4" />
                    <span>Recommender</span>
                    <IconChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Promotions List */}
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
              </div>
            ) : filteredPromotions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <IconTrophy className="w-16 h-16 text-zinc-400 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                  No recommendations yet
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  When recommendations are created, they will appear here.
                </p>
              </div>
            ) : (
              filteredPromotions.map((promotion) => (
                <PromotionCard key={promotion.id} promotion={promotion} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePromotionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPromotions();
          }}
        />
      )}
    </div>
  );
};

PromotionsPage.layout = workspace;

export default PromotionsPage;
