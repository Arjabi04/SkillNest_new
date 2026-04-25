import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(({ className = '', error, ...props }, ref) => {
  return (
    <div className="input-wrapper">
      <input
        ref={ref}
        className={`input-field ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="input-error-msg">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
