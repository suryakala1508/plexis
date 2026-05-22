import React from 'react'

export const Button = (props) => {
    const { children, style, onClick } = props;
  return (
    <button 
      className={style ? style : ''} 
      onClick={onClick}
    >
      {children}
    </button>
  )
}
