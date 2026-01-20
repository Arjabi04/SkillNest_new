import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.jpg";

function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId") || localStorage.getItem("userId") || "";

  const isHome = location.pathname === "/";
  const isProfile = location.pathname.startsWith("/profile");
  const isCommunities = location.pathname.startsWith("/communities");
  const isMarketplace = location.pathname.startsWith("/marketplace");
  const isEvents = location.pathname.startsWith("/events");
  const isNotifications = location.pathname.startsWith("/notifications");
  const isSettings = location.pathname.startsWith("/settings");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/posts");
        const data = await res.json();
        if (res.ok) setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      {/* Sidebar navigation */}
      <aside className="hidden md:flex flex-col w-72 border-r border-gray-200 bg-white py-8 px-6 gap-6 fixed inset-y-0 left-0">
        <div className="px-1">
          <h2 className="text-2xl font-extrabold text-black tracking-tight">SkillNest</h2>
          <p className="mt-1 text-xs text-gray-500">Your learning space</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isHome ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Home</span>
          </Link>
          <Link
            to={`/profile?userId=${userId}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isProfile ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Profile</span>
          </Link>
          <Link
            to="/communities"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isCommunities ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Communities</span>
          </Link>
          <Link
            to="/marketplace"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isMarketplace ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Marketplace</span>
          </Link>
          <Link
            to="/events"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isEvents ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Events</span>
          </Link>
          <Link
            to="/notifications"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isNotifications ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Notifications</span>
          </Link>
          <Link
            to="/settings"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
              isSettings ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-72 flex justify-center px-4 py-8">
        <div className="w-full max-w-6xl space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
              <p className="mt-1 text-sm text-gray-500">
                See what the SkillNest community is sharing right now.
              </p>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main feed */}
            <main className="flex-1 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className="rounded-2xl bg-white border border-gray-200 p-4 animate-pulse space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                        <div className="h-2 w-32 bg-gray-100 rounded" />
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center">
                <p className="text-gray-600">
                  No posts yet. Be the first to share something on SkillNest!
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post._id}
                  className="rounded-2xl bg-white border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={post.user?.profileImage || defaultAvatar}
                      alt={post.user?.username || "User"}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {post.user?.username || "Unknown user"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(post.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {post.text && (
                    <p className="text-gray-800 text-sm sm:text-base leading-relaxed mb-3 whitespace-pre-wrap">
                      {post.text}
                    </p>
                  )}

                  {post.image && (
                    <div className="rounded-xl overflow-hidden border border-gray-100 mb-2">
                      <img
                        src={post.image}
                        alt="Post"
                        className="w-full max-h-[460px] object-cover"
                      />
                    </div>
                  )}

                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
            </main>

            {/* Right sidebar */}
            <aside className="hidden lg:block w-80 space-y-4">
              <div className="rounded-2xl bg-white border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Discover topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Design",
                    "Web Dev",
                    "AI & ML",
                    "Marketing",
                    "Photography",
                    "Writing",
                    "Fitness",
                    "Startup",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  Tips
                </h2>
                <p className="text-xs text-gray-600">
                  Share what you&apos;re learning, add an image when it helps,
                  and keep posts focused so others can learn from you quickly.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExplorePage;
