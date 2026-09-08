import React, { useEffect, useState } from 'react';

const StreamingResponse = ({ text }) => {
  return (
    <div className="flex w-full justify-start mb-4">
      <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm bg-white border border-borderLight text-textPrimary rounded-bl-none">
        <p className="whitespace-pre-wrap">
          {text}
          <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse"></span>
        </p>
      </div>
    </div>
  );
};

export default StreamingResponse;
