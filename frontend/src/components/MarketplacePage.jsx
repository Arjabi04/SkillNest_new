import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import useSidebarLayout from "../hooks/useSidebarLayout";
import defaultAvatar from "../assets/default-avatar.jpg";
import { clearAuth } from "../utils/tokenUtils";

const API_BASE = "http://localhost:4000/api/marketplace";

const defaultCategories = [
  "Electronics",
  "Books",
  "Fashion",
  "Home",
  "Sports",
  "Gaming",
  "Services",
  "Other",
];

function MarketplacePage() {
  const navigate = useNavigate();
  const { mainContentClass } = useSidebarLayout();

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("userId") || localStorage.getItem("userId") || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [creatingListing, setCreatingListing] = useState(false);
  const [reviewLoading, setReviewLoading] = useState({});
  const [reportLoading, setReportLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});

  const [draftFilters, setDraftFilters] = useState({
    search: "",
    category: "all",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
    myOnly: false,
  });

  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    minPrice: "",
    maxPrice: "",
    sort: "newest",
    myOnly: false,
  });

  const [listingForm, setListingForm] = useState({
    title: "",
    description: "",
    category: defaultCategories[0],
    price: "",
    images: [],
  });

  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reportDrafts, setReportDrafts] = useState({});
  const [reportOpenByProduct, setReportOpenByProduct] = useState({});
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [paymentPopup, setPaymentPopup] = useState(null);

  const availableCategories = useMemo(() => {
    const merged = [...defaultCategories, ...categories];
    return Array.from(new Set(merged.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      if (res.ok) {
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (filters.search.trim()) params.set("search", filters.search.trim());
      if (filters.category !== "all") params.set("category", filters.category);
      if (filters.minPrice !== "") params.set("minPrice", filters.minPrice);
      if (filters.maxPrice !== "") params.set("maxPrice", filters.maxPrice);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.myOnly) params.set("sellerId", userId);

      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setProducts(Array.isArray(data.products) ? data.products : []);
      } else {
        alert(data.msg || "Failed to load marketplace listings");
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      alert("Failed to load marketplace listings");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters, userId]);

  useEffect(() => {
    if (!selectedProductId) return;
    const stillExists = products.some((product) => product._id === selectedProductId);
    if (!stillExists) setSelectedProductId(null);
  }, [products, selectedProductId]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const paymentStatus = query.get("payment");

    if (paymentStatus === "success") {
      setPaymentPopup({
        type: "success",
        title: "Payment Successful",
        message: "Payment was successful. Continue browsing.",
      });
    } else if (paymentStatus === "cancel") {
      setPaymentPopup({
        type: "cancel",
        title: "Payment Cancelled",
        message: "Payment was cancelled.",
      });
    } else {
      return;
    }

    query.delete("payment");
    const nextQuery = query.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  const handleApplyFilters = () => {
    setFilters({ ...draftFilters });
  };

  const handleListingChange = (name, value) => {
    setListingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelection = (files) => {
    const selected = Array.from(files || []).slice(0, 6);
    setListingForm((prev) => ({ ...prev, images: selected }));
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();

    const title = listingForm.title.trim();
    const description = listingForm.description.trim();
    const price = Number(listingForm.price);

    if (!title || !description || !listingForm.category || Number.isNaN(price)) {
      alert("Title, description, category and price are required");
      return;
    }

    if (price < 0) {
      alert("Price must be a positive number");
      return;
    }

    setCreatingListing(true);
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("category", listingForm.category);
      formData.append("price", String(price));

      listingForm.images.forEach((imageFile) => {
        formData.append("images", imageFile);
      });

      const res = await fetch(API_BASE, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Failed to create listing");
        return;
      }

      alert(data.msg || "Listing created");
      setListingForm({
        title: "",
        description: "",
        category: availableCategories[0] || defaultCategories[0],
        price: "",
        images: [],
      });
      await Promise.all([loadProducts(), loadCategories()]);
    } catch (err) {
      console.error(err);
      alert("Failed to create listing");
    } finally {
      setCreatingListing(false);
    }
  };

  const handleDeleteListing = async (productId) => {
    if (!window.confirm("Delete this listing?")) return;

    setDeleteLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`${API_BASE}/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Failed to delete listing");
        return;
      }

      alert(data.msg || "Listing deleted");
      if (selectedProductId === productId) setSelectedProductId(null);
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete listing");
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleSubmitReview = async (productId) => {
    const draft = reviewDrafts[productId] || { rating: 5, comment: "" };
    const rating = Number(draft.rating);
    const comment = String(draft.comment || "").trim();

    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
      alert("Rating must be between 1 and 5");
      return;
    }

    setReviewLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`${API_BASE}/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, rating, comment }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Failed to submit review");
        return;
      }

      alert(data.msg || "Review submitted");
      setReviewDrafts((prev) => ({ ...prev, [productId]: { rating: 5, comment: "" } }));
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to submit review");
    } finally {
      setReviewLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleSubmitReport = async (productId) => {
    const draft = reportDrafts[productId] || { reason: "", details: "" };
    const reason = String(draft.reason || "").trim();
    const details = String(draft.details || "").trim();

    if (!reason) {
      alert("Please provide a reason for the report");
      return;
    }

    setReportLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`${API_BASE}/${productId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason, details }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Failed to submit report");
        return;
      }

      alert(data.msg || "Report submitted");
      setReportDrafts((prev) => ({ ...prev, [productId]: { reason: "", details: "" } }));
      setReportOpenByProduct((prev) => ({ ...prev, [productId]: false }));
    } catch (err) {
      console.error(err);
      alert("Failed to submit report");
    } finally {
      setReportLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleBuyNow = async (productId) => {
    if (!userId) {
      alert("Please log in to continue");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/checkout/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, buyerId: userId }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Unable to start checkout");
        return;
      }

      if (!data.checkoutUrl) {
        alert("Checkout URL missing from server response");
        return;
      }

      // redirectToCheckout was removed in newer Stripe.js versions.
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      console.error(err);
      alert("Unable to start checkout");
    }
  };

  const renderImageGrid = (images) => {
    if (!images?.length) {
      return (
        <div className="h-40 w-full rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm text-slate-500">
          No image
        </div>
      );
    }

    if (images.length === 1) {
      return (
        <img
          src={images[0]}
          alt="Product"
          className="h-40 w-full rounded-xl border border-slate-200 object-cover"
        />
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {images.slice(0, 4).map((imageUrl, idx) => (
          <img
            key={`${imageUrl}-${idx}`}
            src={imageUrl}
            alt={`Product ${idx + 1}`}
            className="h-24 w-full rounded-lg border border-slate-200 object-cover"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <Sidebar onLogout={handleLogout} />

      <div className={`flex-1 ${mainContentClass} max-w-[1400px] mx-auto px-6 py-8`}>
        <header className="mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-slate-700 rounded-full" />
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900">Marketplace</h1>
            </div>
            <p className="text-slate-500 text-sm ml-5">
              Post products, browse listings, review sellers, and report suspicious listings.
            </p>
          </div>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Search and Filter Listings</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
            <input
              type="text"
              placeholder="Search title, description, category"
              value={draftFilters.search}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 lg:col-span-2"
            />

            <select
              value={draftFilters.category}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="all">All categories</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              placeholder="Min price"
              value={draftFilters.minPrice}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />

            <input
              type="number"
              min="0"
              placeholder="Max price"
              value={draftFilters.maxPrice}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />

            <select
              value={draftFilters.sort}
              onChange={(e) => setDraftFilters((prev) => ({ ...prev, sort: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draftFilters.myOnly}
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, myOnly: e.target.checked }))}
              />
              My listings only
            </label>

            <button
              type="button"
              onClick={handleApplyFilters}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Apply Filters
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h2 className="text-lg font-semibold text-slate-900">Create Product Listing</h2>
            <p className="mt-1 text-sm text-slate-500">You can upload up to 6 images for each listing.</p>

            <form className="mt-4 space-y-3" onSubmit={handleCreateListing}>
              <input
                type="text"
                placeholder="Product title"
                value={listingForm.title}
                onChange={(e) => handleListingChange("title", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                required
              />

              <textarea
                placeholder="Describe your product"
                value={listingForm.description}
                onChange={(e) => handleListingChange("description", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                required
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={listingForm.category}
                  onChange={(e) => handleListingChange("category", e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                >
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  value={listingForm.price}
                  onChange={(e) => handleListingChange("price", e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  required
                />
              </div>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageSelection(e.target.files)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />

              {listingForm.images.length > 0 && (
                <p className="text-xs text-slate-600">{listingForm.images.length} image(s) selected</p>
              )}

              <button
                type="submit"
                disabled={creatingListing}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {creatingListing ? "Posting listing..." : "Post Listing"}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            {loadingProducts ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading listings...</div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                No products found for the selected search/filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() => setSelectedProductId(product._id)}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="h-52 w-full bg-slate-100 flex items-center justify-center text-sm text-slate-500">
                        No image
                      </div>
                    )}
                    <div className="border-t border-slate-100 px-3 py-3 text-left">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{product.title}</h3>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {paymentPopup && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{paymentPopup.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{paymentPopup.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentPopup(null)}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPaymentPopup(null)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  paymentPopup.type === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (() => {
        const isOwnProduct = String(selectedProduct.seller?._id || "") === String(userId);
        const reviewDraft = reviewDrafts[selectedProduct._id] || { rating: 5, comment: "" };
        const reportDraft = reportDrafts[selectedProduct._id] || { reason: "", details: "" };
        const reportOpen = Boolean(reportOpenByProduct[selectedProduct._id]);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">{selectedProduct.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{selectedProduct.category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductId(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
                <div>{renderImageGrid(selectedProduct.images)}</div>

                <div>
                  <p className="text-2xl font-bold text-slate-900">${Number(selectedProduct.price || 0).toFixed(2)}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selectedProduct.description}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1">
                      <span className="font-semibold text-slate-800">Rating:</span>
                      <span>{Number(selectedProduct.ratingAverage || 0).toFixed(1)} / 5</span>
                      <span>({selectedProduct.ratingCount || 0})</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <img
                        src={selectedProduct.seller?.profileImage || defaultAvatar}
                        alt={selectedProduct.seller?.username || "Seller"}
                        className="h-7 w-7 rounded-full border border-slate-200 object-cover"
                      />
                      <span>Seller: {selectedProduct.seller?.username || "Unknown"}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBuyNow(selectedProduct._id)}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Buy Now
                    </button>

                    {isOwnProduct && (
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(selectedProduct._id)}
                        disabled={Boolean(deleteLoading[selectedProduct._id])}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {deleteLoading[selectedProduct._id] ? "Deleting..." : "Delete Listing"}
                      </button>
                    )}
                  </div>

                  {!isOwnProduct && (
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[100px_1fr_auto]">
                      <select
                        value={reviewDraft.rating}
                        onChange={(e) =>
                          setReviewDrafts((prev) => ({
                            ...prev,
                            [selectedProduct._id]: {
                              ...reviewDraft,
                              rating: Number(e.target.value),
                            },
                          }))
                        }
                        className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <option key={value} value={value}>
                            {value} star{value > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Write a review (optional)"
                        value={reviewDraft.comment}
                        onChange={(e) =>
                          setReviewDrafts((prev) => ({
                            ...prev,
                            [selectedProduct._id]: {
                              ...reviewDraft,
                              comment: e.target.value,
                            },
                          }))
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitReview(selectedProduct._id)}
                        disabled={Boolean(reviewLoading[selectedProduct._id])}
                        className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {reviewLoading[selectedProduct._id] ? "Saving..." : "Rate"}
                      </button>
                    </div>
                  )}

                  {!isOwnProduct && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setReportOpenByProduct((prev) => ({
                            ...prev,
                            [selectedProduct._id]: !reportOpen,
                          }))
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        {reportOpen ? "Cancel Report" : "Report Listing"}
                      </button>
                    </div>
                  )}

                  {reportOpen && !isOwnProduct && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          placeholder="Reason"
                          value={reportDraft.reason}
                          onChange={(e) =>
                            setReportDrafts((prev) => ({
                              ...prev,
                              [selectedProduct._id]: {
                                ...reportDraft,
                                reason: e.target.value,
                              },
                            }))
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                        <input
                          type="text"
                          placeholder="Details (optional)"
                          value={reportDraft.details}
                          onChange={(e) =>
                            setReportDrafts((prev) => ({
                              ...prev,
                              [selectedProduct._id]: {
                                ...reportDraft,
                                details: e.target.value,
                              },
                            }))
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSubmitReport(selectedProduct._id)}
                        disabled={Boolean(reportLoading[selectedProduct._id])}
                        className="mt-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {reportLoading[selectedProduct._id] ? "Submitting..." : "Submit Report"}
                      </button>
                    </div>
                  )}

                  {Array.isArray(selectedProduct.reviews) && selectedProduct.reviews.length > 0 && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-sm font-semibold text-slate-800">Recent Reviews</p>
                      <div className="space-y-2">
                        {selectedProduct.reviews.slice(0, 3).map((review) => (
                          <div key={review._id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-slate-800">{review.user?.username || "User"}</span>
                              <span className="text-slate-600">{review.rating}/5</span>
                            </div>
                            {review.comment && <p className="mt-1 text-slate-600">{review.comment}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default MarketplacePage;
