import React, { useState, useEffect } from 'react';

const SlotMachineAnimation = ({ isSpinning, result, onAnimationComplete }) => {
  const [displayText, setDisplayText] = useState('???');

  useEffect(() => {
    let interval;
    if (isSpinning) {
      const items = ['🎁', '🎉', '🌟', '💎', '🚀', '🔮'];
      interval = setInterval(() => {
        setDisplayText(items[Math.floor(Math.random() * items.length)]);
      }, 100);
    } else if (result) {
      setDisplayText(result.name);
      // Trigger complete after showing result for a bit
      setTimeout(() => {
        if (onAnimationComplete) onAnimationComplete();
      }, 2000);
    } else {
      setDisplayText('等待中...');
    }

    return () => clearInterval(interval);
  }, [isSpinning, result, onAnimationComplete]);

  return (
    <div className="slot-machine">
      <div className={`slot-item ${isSpinning ? 'animate-spin' : 'floating'}`}>
        {result && !isSpinning ? (
          <div>
            {result.image_url ? (
              <img src={result.image_url} alt={result.name} style={{ width: '80px', height: '80px', objectFit: 'contain', display: 'block', margin: '0 auto 10px' }} />
            ) : '🎁'}
            <div style={{ fontSize: '1.5rem', color: '#fff' }}>{displayText}</div>
          </div>
        ) : (
          displayText
        )}
      </div>
    </div>
  );
};

export default SlotMachineAnimation;
