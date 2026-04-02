import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import SlotMachineAnimation from './SlotMachineAnimation';
import { API_URL } from '../config';

const socket = io(API_URL);

const ParticipantRoom = () => {
  const [users, setUsers] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [drawResult, setDrawResult] = useState(null);
  const [activeSpinner, setActiveSpinner] = useState(null);
  const [error, setError] = useState('');

  // Fetch initial users
  useEffect(() => {
    fetchUsers();
    
    // Fallback polling: fetch every 5 seconds
    const intervalId = setInterval(() => {
      fetchUsers();
    }, 5000);
    
    // Listen for state updates
    socket.on('state_update', (state) => {
      fetchUsers(); // Refresh to see who has drawn
    });

    socket.on('spin_started', (data) => {
      setActiveSpinner(data.user);
      setIsSpinning(true);
      setDrawResult(null);
    });

    socket.on('draw_event', (data) => {
      setActiveSpinner(data.user);
      setIsSpinning(false);
      setDrawResult(data.prize);
      
      if (data.user.id !== parseInt(selectedUserId)) {
        console.log(`${data.user.name} 抽中: ${data.prize.name}`);
      }
    });

    return () => {
      clearInterval(intervalId);
      socket.off('state_update');
      socket.off('spin_started');
      socket.off('draw_event');
    };
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const [uRes, pRes] = await Promise.all([
        fetch(`${API_URL}/api/users`),
        fetch(`${API_URL}/api/prizes`)
      ]);
      const uData = await uRes.json();
      const pData = await pRes.json();
      setUsers(uData);
      if(Array.isArray(pData)) setPrizes(pData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDraw = async () => {
    if (!selectedUserId) return;
    setError('');
    
    // Get current user info to broadcast
    const currentUserInfo = users.find(u => u.id === parseInt(selectedUserId));
    
    // Broadcast to others that I am spinning
    socket.emit('spin_started', { user: currentUserInfo });
    
    // Local state update
    setActiveSpinner(currentUserInfo);
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
        setActiveSpinner(null);
        return;
      }

      // The result handling is now moved to the socket 'draw_event' listener
      // to ensure everyone gets the result at the exact same time.

    } catch (err) {
      setError('網路連線錯誤');
      setIsSpinning(false);
      setActiveSpinner(null);
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

  const currentUserToDraw = users.find(u => u.has_drawn === 0);
  const allFinished = !currentUserToDraw && users.length > 0;
  const me = users.find(u => u.id === parseInt(selectedUserId));
  const isMyTurn = currentUserToDraw && currentUserToDraw.id === me?.id;
  const iHaveDrawn = me?.has_drawn === 1;
  const myPrizes = prizes.filter(p => p.prize_pool_id === me?.prize_pool_id);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      
      {!allFinished && (
        <div className="glass-panel mb-4" style={{ textAlign: 'left' }}>
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>抽籤資訊</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p><strong>您的順序：</strong> <span style={{ color: 'var(--primary-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>{me?.order_index || '-'}</span></p>
              <p><strong>目前抽獎進度：</strong> <span style={{ color: '#3b82f6', fontSize: '1.2rem', fontWeight: 'bold' }}>{currentUserToDraw?.order_index || '-'}</span></p>
              <p><strong>專屬獎池：</strong> <span style={{ fontWeight: 'bold' }}>{me?.pool_name || '一般獎項'}</span></p>
            </div>
            <div>
              <strong>該獎池包含獎項：</strong>
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                {myPrizes.length === 0 && <li>目前無獎項或已抽完</li>}
                {myPrizes.map(p => (
                  <li key={p.id}>{p.name} <span style={{ fontSize: '0.85em', color: p.remaining > 0 ? '#10b981' : '#ef4444' }}>(剩餘: {p.remaining}/{p.quantity})</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel mb-4">
        <h2>{isMyTurn ? "🎉 輪到您了！" : iHaveDrawn ? "感謝您的參與！您已結束抽獎。" : "抽獎等待室"}</h2>
        {allFinished && <h3>所有抽獎已順利結束！請查看最終得獎清單。</h3>}
        
        {!allFinished && currentUserToDraw && !isMyTurn && !isSpinning && !iHaveDrawn && (
          <p>目前正在等待 <strong>{currentUserToDraw.name}</strong> 進行抽獎。</p>
        )}
        
        {isMyTurn && !(isSpinning && activeSpinner?.id === me?.id) && !(drawResult && activeSpinner?.id === me?.id) && (
          <>
            <p>點擊下方按鈕，從您的專屬獎品池中抽出獎品： <strong>{me?.pool_name || '一般獎項'}</strong></p>
            <button 
              onClick={handleDraw} 
              style={{ width: '100%', maxWidth: '300px', fontSize: '1.2rem', padding: '1rem', marginTop: '1rem' }}
            >
              立即抽獎
            </button>
          </>
        )}

        {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      </div>

      {(isSpinning || drawResult) && (
        <div className="glass-panel">
          {activeSpinner && (
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
              {activeSpinner.id === parseInt(selectedUserId) 
                ? "您的抽獎" 
                : `${activeSpinner.name} ${isSpinning ? '正在抽獎...' : '抽中了：'}`}
            </h3>
          )}

          <SlotMachineAnimation 
            isSpinning={isSpinning} 
            result={drawResult} 
            onAnimationComplete={onAnimationComplete} 
          />
        </div>
      )}
    </div>
  );
};

export default ParticipantRoom;
