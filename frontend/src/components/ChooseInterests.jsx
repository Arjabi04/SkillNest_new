import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ChooseInterests() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const userId = params.get("userId");

  const [selectedInterests, setSelectedInterests] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const InterestsList = [
    { name: "Cooking", icon: "🍳" },
    { name: "Painting", icon: "🎨" },
    { name: "Photography", icon: "📸" },
    { name: "Reading", icon: "📚" },
    { name: "Music", icon: "🎵" },
    { name: "Traveling", icon: "✈️" },
    { name: "Gaming", icon: "🎮" },
    { name: "Fitness", icon: "💪" },
    { name: "Writing", icon: "✍️" },
    { name: "Dancing", icon: "💃" },
    { name: "Gardening", icon: "🌱" },
    { name: "Cycling", icon: "🚴" },
    { name: "Drawing", icon: "✏️" },
    { name: "Crafting", icon: "🎭" },
    { name: "Coding", icon: "💻" },
    { name: "Blogging", icon: "📝" },
    { name: "Yoga", icon: "🧘" },
    { name: "Entrepreneurship", icon: "🚀" }
  ];

  const toggleHobby = (hobbyName) => {
    if (selectedInterests.includes(hobbyName)) {
      setSelectedInterests(selectedInterests.filter(h => h !== hobbyName));
    } else {
      setSelectedInterests([...selectedInterests, hobbyName]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setMessage("User ID missing.");
      return;
    }

    if (selectedInterests.length === 0) {
      setMessage("Please select at least one interest.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:4000/api/interests", { // make sure route matches backend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, interests: selectedInterests })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.msg || "Your interests have been saved!");
        // Redirect to user profile after 1 second
        setTimeout(() => {
          navigate(`/profile?userId=${userId}`);
        }, 1000);
      } else {
        setMessage(data.msg || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center px-4 py-8 bg-gradient-to-b from-slate-50 to-indigo-50 font-sans">
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-[26px] p-6 md:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.1)] relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6 relative z-10">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 m-0">Choose your interests</h2>
            <p className="text-base text-slate-500 mt-2 mb-0">
              Personalize your feed with the topics you care about most.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-br from-blue-50 to-green-50 text-slate-900 min-w-[72px] border border-slate-200">
            <span className="text-2xl font-extrabold">{selectedInterests.length}</span>
            <small className="text-[10px] tracking-wider uppercase text-slate-500">selected</small>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4 mb-6 relative z-10">
            {InterestsList.map((hobby) => {
              const isSelected = selectedInterests.includes(hobby.name);
              return (
                <label
                  key={hobby.name}
                  className={`relative flex items-center gap-2.5 px-4 py-3.5 border rounded-2xl cursor-pointer transition-all duration-200 bg-white text-slate-900 font-semibold shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(37,99,235,0.15)] ${isSelected ? "border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-[0_12px_28px_rgba(37,99,235,0.22)]" : "border-slate-200"}`}
                >
                  <input
                    type="checkbox"
                    value={hobby.name}
                    checked={isSelected}
                    onChange={() => toggleHobby(hobby.name)}
                    className="hidden"
                  />
                  <span className="text-xl" aria-hidden>
                    {hobby.icon}
                  </span>
                  <span className="flex-1 text-[0.95rem]">{hobby.name}</span>
                  <span className={`w-5.5 h-5.5 rounded-full inline-flex items-center justify-center text-xs text-white bg-blue-600 shadow-[0_6px_14px_rgba(37,99,235,0.35)] transition-all ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75"}`} aria-hidden>
                    ✓
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex flex-col gap-2.5 items-center relative z-10">
            <button
              type="submit"
              className="px-7 py-3 text-base font-bold bg-gradient-to-br from-blue-600 to-blue-500 text-white border-none rounded-xl cursor-pointer transition-all w-full max-w-[280px] shadow-[0_12px_24px_rgba(37,99,235,0.25)] hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(37,99,235,0.3)] disabled:bg-slate-400 disabled:cursor-not-allowed disabled:translate-y-0"
              disabled={isLoading || selectedInterests.length === 0}
            >
              {isLoading ? "Saving..." : "Save & Continue"}
            </button>
            <p className="text-sm text-slate-400 m-0">You can update these anytime in your profile.</p>
          </div>
        </form>

        {message && <p className="mt-4 font-semibold text-slate-900 text-center relative z-10">{message}</p>}
      </div>
    </div>
  );
}
