import React from 'react';

const Card = ({ 
  children, 
  className = "",
  hover = false,
  padding = "p-6",
  shadow = "shadow-lg"
}) => {
  const baseClasses = `bg-white rounded-xl ${shadow} ${padding}`;
  const hoverClasses = hover ? "hover:shadow-xl transition-shadow duration-300" : "";
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

export default Card;