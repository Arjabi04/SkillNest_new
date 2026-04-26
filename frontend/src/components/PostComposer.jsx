const PostComposer = ({
  avatarSrc,
  avatarAlt = 'Avatar',
  onAvatarError,
  text,
  onTextChange,
  placeholder = "What's on your mind?",
  rows = 3,
  previews = [],
  onRemovePreview,
  maxImages = 6,
  tags = [],
  onRemoveTag,
  tagInput,
  onImageSelect,
  imageLabel = 'Photo',
  onSubmit,
  submitLabel = 'Post',
  submitDisabled = false,
  isSubmitting = false,
  containerClassName = 'bg-white rounded-2xl shadow-sm border border-gray-100',
}) => {
  return (
    <div className={containerClassName}>
      <div className="p-4">
        <div className="flex gap-3 mb-3">
          <img
            src={avatarSrc}
            alt={avatarAlt}
            onError={onAvatarError}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 resize-none text-sm font-sans text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
              rows={rows}
            />
          </div>
        </div>

        {previews.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={preview}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemovePreview?.(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                    title="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{previews.length}/{maxImages} images selected</p>
          </div>
        )}

        {(tags.length > 0 || tagInput) && (
          <div className="mt-2 mb-3 flex flex-wrap items-center gap-2 px-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => onRemoveTag?.(tag)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  x
                </button>
              </span>
            ))}
            {tagInput}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-gray-600 hover:text-blue-500 cursor-pointer transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">{imageLabel}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => onImageSelect?.(e)}
                className="hidden"
              />
            </label>
          </div>
          <button
            onClick={onSubmit}
            disabled={submitDisabled}
            className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {isSubmitting ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
