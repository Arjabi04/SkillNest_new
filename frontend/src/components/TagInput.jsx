import React, { useState } from 'react';
import './TagInput.css';

const TagInput = ({ tags, setTags, placeholder = "Type and press Enter to add tag..." }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="tag-input-container">
      <div className="tag-input-list">
        {tags.map((tag) => (
          <span
            key={tag}
            className="tag-badge"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="tag-remove-btn"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        className="tag-input-field"
        placeholder={placeholder}
      />
      <p className="tag-input-hint">Press Enter to add tags</p>
    </div>
  );
};

export default TagInput;