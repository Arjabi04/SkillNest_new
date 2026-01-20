import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // import useNavigate
import "./ChooseInterests.css";

export default function ChooseInterests() {
  const location = useLocation();
  const navigate = useNavigate(); // initialize navigate
  const params = new URLSearchParams(location.search);
  const userId = params.get("userId");

  const [selectedInterests, setSelectedInterests] = useState([]);
  const [message, setMessage] = useState("");

  const InterestsList = [
    "Cooking", "Painting", "Photography", "Reading", "Music",
    "Traveling", "Gaming", "Fitness", "Writing", "Dancing",
    "Gardening", "Cycling", "Drawing", "Crafting", "Coding",
    "Blogging", "Yoga", "Entrepreneurship"
  ];

  const toggleHobby = (hobby) => {
    if (selectedInterests.includes(hobby)) {
      setSelectedInterests(selectedInterests.filter(h => h !== hobby));
    } else {
      setSelectedInterests([...selectedInterests, hobby]);
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
    }
  };

  return (
    <div className="page-wrapper">
    <div className="interests-container">
      <h2>Welcome to SkillNest!</h2>
      <p className="subtitle">
        Select the hobbies and interests you love. You can always come back and change them anytime.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="interests-grid">
          {InterestsList.map((hobby) => (
            <label
              key={hobby}
              className={`interest-card ${selectedInterests.includes(hobby) ? "selected" : ""}`}
            >
              <input
                type="checkbox"
                value={hobby}
                checked={selectedInterests.includes(hobby)}
                onChange={() => toggleHobby(hobby)}
              />
              {hobby}
            </label>
          ))}
        </div>
        <button type="submit" className="submit-btn">
          Save & Continue
        </button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
    </div>
  );
}
