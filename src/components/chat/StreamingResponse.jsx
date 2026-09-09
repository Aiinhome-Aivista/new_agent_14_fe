import React, { useEffect, useState } from 'react';

const cleanStream = (raw) => {
  if (!raw) return '';
  let str = String(raw);
  // Strip leading {"response": " or {"response":"
  str = str.replace(/^\s*\{\s*"response"\s*:\s*"/, '');
  // Strip trailing "} or "
  if (str.endsWith('"}') || str.endsWith('" }')) {
    str = str.slice(0, -2);
  } else if (str.endsWith('"')) {
    str = str.slice(0, -1);
  }
  return str.replace(/\\n/g, '\n').replace(/\\"/g, '"');
};

const StreamingResponse = ({ text }) => {
  const display = cleanStream(text);
  return (
    <div className="flex w-full justify-start mb-4">
      <div className="max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm theme-card theme-heading border rounded-bl-none">
        <p className="whitespace-pre-wrap">
          {display}
          <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#FF5A14] animate-pulse"></span>
        </p>
      </div>
    </div>
  );
};

export default StreamingResponse;
