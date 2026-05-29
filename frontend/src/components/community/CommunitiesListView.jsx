import React from "react";
import Sidebar from "../../layouts/Sidebar";
import CommunityCard from "../CommunityCard";
import PageHeader from "../PageHeader";
import defaultHeader from "../../assets/default-header.jpeg";
import {
    AlertCircle,
    Crown,
    Plus,
    Shield,
    Users,
} from "./CommunityIcons";

const CommunitiesSkeleton = () => (
    <div className="space-y-8">
        <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-slate-100 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                    key={i}
                    className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                    <div className="h-32 bg-slate-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
            ))}
        </div>
    </div>
);

const SidebarCommunityList = ({
    title,
    count,
    icon,
    communities,
    accent,
    onViewCommunity,
    pending = false,
}) => {
    if (!communities.length) return null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h3 className="font-bold text-slate-900">{title}</h3>
                <span className={`px-2 py-0.5 ${accent.badge} rounded-full text-xs font-medium`}>
                    {count}
                </span>
            </div>
            <div className="space-y-3">
                {communities.map((community) => (
                    <div
                        key={community._id}
                        onClick={
                            pending ? undefined : () => onViewCommunity(community)
                        }
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                            pending
                                ? `${accent.background} ${accent.border}`
                                : `${accent.hoverBackground} cursor-pointer transition-colors ${accent.border}`
                        }`}>
                        <img
                            src={community.coverImage || defaultHeader}
                            className={`w-12 h-12 rounded-lg object-cover ${
                                pending ? "opacity-75" : accent.imageBorder
                            }`}
                            alt={community.name}
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-slate-900 truncate">
                                {community.name}
                            </h4>
                            <p className={`text-xs truncate ${pending ? "text-yellow-600 font-medium" : "text-slate-500"}`}>
                                {pending
                                    ? "Pending approval"
                                    : `${community.members?.length || 0} members`}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CommunitiesListView = ({
    loading,
    mainContentClass,
    showLogoutConfirm,
    setShowLogoutConfirm,
    onLogout,
    isAdmin,
    pendingRequests,
    recommendedCommunities,
    categorizedCommunities,
    userId,
    onViewCommunity,
    onJoinCommunity,
    onOpenAdminDashboard,
    onOpenCreateCommunity,
}) => {
    const hasSidebarCommunities =
        categorizedCommunities.myCommunitiesOwned.length > 0 ||
        categorizedCommunities.myCommunitiesJoined.length > 0 ||
        categorizedCommunities.pendingRequests.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex">
            <Sidebar
                showLogoutConfirm={showLogoutConfirm}
                setShowLogoutConfirm={setShowLogoutConfirm}
                onLogout={onLogout}
            />

            <main className={`flex-1 ${mainContentClass}`}>
                <div className="max-w-400 mx-auto w-full px-6 py-8 flex gap-8">
                    <div className="flex-1 max-w-4xl">
                        {loading ? (
                            <CommunitiesSkeleton />
                        ) : (
                            <>
                                <PageHeader
                                    className="mb-12"
                                    eyebrow="Communities"
                                    title="Explore Communities"
                                    description="Discover new collaborative spaces and connect with like-minded learners."
                                />

                                <div className="flex items-center gap-4 mt-8">
                                    {isAdmin && (
                                        <button
                                            onClick={onOpenAdminDashboard}
                                            className="px-6 py-3.5 bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:bg-white hover:shadow-lg hover:border-blue-200 transition-all flex items-center justify-center gap-2 group">
                                            <Shield className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                                            Admin
                                            {pendingRequests.pendingCreations
                                                .length > 0 && (
                                                <span className="bg-blue-600 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                                                    {
                                                        pendingRequests
                                                            .pendingCreations
                                                            .length
                                                    }
                                                </span>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={onOpenCreateCommunity}
                                        className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2">
                                        <Plus className="w-5 h-5" /> Create
                                        Community
                                    </button>
                                </div>

                                {recommendedCommunities.length > 0 ? (
                                    <section>
                                        <div className="flex items-center gap-3 mb-8">
                                            <svg
                                                className="w-6 h-6 text-blue-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                            <h2 className="text-2xl font-bold text-slate-800">
                                                Discover New Communities
                                            </h2>
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                {recommendedCommunities.length}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {recommendedCommunities.map(
                                                (community) => (
                                                    <CommunityCard
                                                        key={community._id}
                                                        community={community}
                                                        userId={userId}
                                                        onViewCommunity={
                                                            onViewCommunity
                                                        }
                                                        onJoinCommunity={
                                                            onJoinCommunity
                                                        }
                                                        isRecommended={true}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </section>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <svg
                                                className="w-10 h-10 text-blue-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-700 mb-2">
                                            No New Communities to Explore
                                        </h3>
                                        <p className="text-slate-500 mb-6">
                                            All communities are either joined or
                                            pending. Check back later for new
                                            ones!
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <aside className="w-80 space-y-6">
                        <SidebarCommunityList
                            title="Communities I Lead"
                            count={
                                categorizedCommunities.myCommunitiesOwned.length
                            }
                            icon={<Crown className="w-5 h-5 text-yellow-600" />}
                            communities={
                                categorizedCommunities.myCommunitiesOwned
                            }
                            accent={{
                                badge: "bg-yellow-100 text-yellow-700",
                                background: "bg-yellow-50",
                                hoverBackground: "hover:bg-yellow-50",
                                border: "border-yellow-200",
                                imageBorder: "border border-yellow-200",
                            }}
                            onViewCommunity={onViewCommunity}
                        />

                        <SidebarCommunityList
                            title="My Communities"
                            count={
                                categorizedCommunities.myCommunitiesJoined.length
                            }
                            icon={<Users className="w-5 h-5 text-green-600" />}
                            communities={
                                categorizedCommunities.myCommunitiesJoined
                            }
                            accent={{
                                badge: "bg-green-100 text-green-700",
                                background: "bg-green-50",
                                hoverBackground: "hover:bg-green-50",
                                border: "border-green-200",
                                imageBorder: "border border-green-200",
                            }}
                            onViewCommunity={onViewCommunity}
                        />

                        <SidebarCommunityList
                            title="Pending Requests"
                            count={categorizedCommunities.pendingRequests.length}
                            icon={
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                            }
                            communities={categorizedCommunities.pendingRequests}
                            accent={{
                                badge: "bg-yellow-100 text-yellow-700",
                                background: "bg-yellow-50",
                                hoverBackground: "hover:bg-yellow-50",
                                border: "border-yellow-200",
                                imageBorder: "",
                            }}
                            onViewCommunity={onViewCommunity}
                            pending
                        />

                        {!hasSidebarCommunities && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 mb-2">
                                    No Communities Yet
                                </h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    Join some communities to see them here!
                                </p>
                                <button
                                    onClick={onOpenCreateCommunity}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Create Community
                                </button>
                            </div>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default CommunitiesListView;
