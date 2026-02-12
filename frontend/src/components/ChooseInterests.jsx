import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ChooseInterests.css";

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
    <div className="choose-interests">
      <div className="choose-interests__card">
        <div className="choose-interests__header">
          <div>
            <h2>Choose your interests</h2>
            <p className="subtitle">
              Personalize your feed with the topics you care about most.
            </p>
          </div>
          <div className="choose-interests__count">
            <span>{selectedInterests.length}</span>
            <small>selected</small>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="interests-grid">
            {InterestsList.map((hobby) => {
              const isSelected = selectedInterests.includes(hobby.name);
              return (
                <label
                  key={hobby.name}
                  className={`interest-card ${isSelected ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    value={hobby.name}
                    checked={isSelected}
                    onChange={() => toggleHobby(hobby.name)}
                  />
                  <span className="interest-icon" aria-hidden>
                    {hobby.icon}
                  </span>
                  <span className="interest-label">{hobby.name}</span>
                  <span className="interest-check" aria-hidden>
                    ✓
                  </span>
                </label>
              );
            })}
          </div>

          <div className="choose-interests__actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading || selectedInterests.length === 0}
            >
              {isLoading ? "Saving..." : "Save & Continue"}
            </button>
            <p className="helper-text">You can update these anytime in your profile.</p>
          </div>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}
