import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import SlotMachineAnimation from './SlotMachineAnimation';
import { API_URL } from '../config';

const socket = io(API_URL);

const ParticipantRoom = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [currentUserToDraw, setCurrentUserToDraw] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawResult, setDrawResult] = useState(null);
  const [error, setError] = useState('');
  const [allFinished, setAllFinished] = useState(false);

  // Fetch initial users
  useEffect(() => {
    fetchUsers();
    
    // Listen for state updates
    socket.on('state_update', (state) => {
      setCurrentUserToDraw(state.currentUser);
      setAllFinished(state.allFinished);
      fetchUsers(); // Refresh to see who has drawn
    });

    socket.on('draw_event', (data) => {
      if (data.user.id !== parseInt(selectedUserId)) {
        console.log(`${data.user.name} 抽中: ${data.prize.name}`);
      }
    });

    return () => {
      socket.off('state_update');
      socket.off('draw_event');
    };
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDraw = async () => {
    if (!selectedUserId) return;
    setError('');
    setIsSpinning(true);
    setDrawResult(null);

    try {
      const res = await fetch(`${API_URL}/api/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(selectedUserId) })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || '抽獎失敗');
        setIsSpinning(false);
        return;
      }

      // We have the result, let the slot machine component handle the spinning delay
      setTimeout(() => {
        setIsSpinning(false);
        setDrawResult(data.prize);
      }, 3000); // 3 seconds spin

    } catch (err) {
      setError('網路連線錯誤');
      setIsSpinning(false);
    }
  };

  const onAnimationComplete = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']
    });
  };

  // Login view
  if (!selectedUserId) {
    return (
      <div className="glass-panel" style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center' }}>
        <h2>請選擇您的身分</h2>
        <p className="mb-4">登入後即可進入抽獎等待室。</p>
        <select onChange={(e) => setSelectedUserId(e.target.value)} value={selectedUserId} style={{ marginBottom: '2rem' }}>
          <option value="">-- 請選擇您的名字 --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} {u.has_drawn ? '(已抽獎)' : `(順序: ${u.order_index})`}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const me = users.find(u => u.id === parseInt(selectedUserId));
  const isMyTurn = currentUserToDraw && currentUserToDraw.id === me?.id;
  const iHaveDrawn = me?.has_drawn === 1;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <div className="glass-panel mb-4">
        <h2>{isMyTurn ? "🎉 輪到您了！" : iHaveDrawn ? "感謝您的參與！您已結束抽獎。" : "抽獎等待室"}</h2>
        {allFinished && <h3>所有抽獎已順利結束！請查看最終得獎清單。</h3>}
        
        {!allFinished && currentUserToDraw && !isMyTurn && !iHaveDrawn && (
          <p>目前正在等待 <strong>{currentUserToDraw.name}</strong> 進行抽獎。</p>
        )}
        
        {isMyTurn && !isSpinning && !drawResult && (
          <p>點擊下方按鈕，從您的專屬獎品池中抽出獎品： <strong>{me?.pool_name || '一般獎項'}</strong></p>
        )}

        {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      </div>

      {(isMyTurn || isSpinning || drawResult) && !iHaveDrawn && (
        <div className="glass-panel">
          <SlotMachineAnimation 
            isSpinning={isSpinning} 
            result={drawResult} 
            onAnimationComplete={onAnimationComplete} 
          />
          
          <button 
            onClick={handleDraw} 
            disabled={!isMyTurn || isSpinning || drawResult}
            style={{ width: '100%', maxWidth: '300px', fontSize: '1.2rem', padding: '1rem' }}
          >
            {isSpinning ? '抽獎中...' : drawResult ? '恭喜中獎！' : '立即抽獎'}
          </button>
        </div>
      )}

      {drawResult && (
        <div className="glass-panel mt-4" style={{ animation: 'float 2s infinite ease-in-out' }}>
          <h3 style={{ color: 'var(--primary-color)' }}>您抽中了：{drawResult.name}</h3>
        </div>
      )}
    </div>
  );
};

export default ParticipantRoom;
