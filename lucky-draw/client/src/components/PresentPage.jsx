import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Users, Trophy, Play, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config';

const socket = io(API_URL);

const PresentPage = () => {
  const [users, setUsers] = useState([]);
  const [currentUserToDraw, setCurrentUserToDraw] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [activeSpinner, setActiveSpinner] = useState(null);
  const [allFinished, setAllFinished] = useState(false);

  useEffect(() => {
    fetchUsers();

    socket.on('state_update', (state) => {
      setCurrentUserToDraw(state.currentUser);
      setAllFinished(state.allFinished);
      fetchUsers();
    });

    socket.on('spin_started', (data) => {
      setActiveSpinner(data.user);
      setIsSpinning(true);
    });

    socket.on('draw_event', (data) => {
      setActiveSpinner(data.user);
      setIsSpinning(false);
      // Data contains the newly drawn prize
      // We will reload the users list to get the updated status and won prizes
      fetchUsers();
    });

    return () => {
      socket.off('state_update');
      socket.off('spin_started');
      socket.off('draw_event');
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if(res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  return (
    <div style={{ padding: '1rem 1.5rem', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem', flexShrink: 0 }}>
        <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', textShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}>
          <Trophy size={32} color="var(--primary-color)" /> 線上抽獎即時狀態
        </h1>
        {allFinished && (
          <h2 style={{ color: '#10b981', margin: '0.5rem 0', animation: 'pulse 2s infinite' }}>所有抽獎已順利結束！</h2>
        )}
      </div>

      <div style={{ 
        flex: 1,
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        alignContent: 'start',
        gap: '0.6rem',
        overflowY: 'auto',
        paddingRight: '0.5rem'
      }}>
        {users.map((user) => {
          const isDrawing = isSpinning && activeSpinner?.id === user.id;
          const isNext = !isSpinning && currentUserToDraw?.id === user.id;
          const hasDrawn = user.has_drawn === 1;

          let cardStyle = {
            padding: '1rem',
            borderRadius: '12px',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          };

          if (isDrawing) {
            cardStyle.border = '2px solid var(--primary-color)';
            cardStyle.boxShadow = '0 0 30px rgba(139, 92, 246, 0.6)';
            cardStyle.transform = 'scale(1.02)';
            cardStyle.zIndex = 10;
          } else if (isNext) {
            cardStyle.border = '2px solid #3b82f6';
            cardStyle.boxShadow = '0 0 20px rgba(59, 130, 246, 0.4)';
          } else if (hasDrawn) {
            cardStyle.opacity = 0.8;
          } else {
            cardStyle.opacity = 0.6;
          }

          return (
            <div key={user.id} style={cardStyle}>
              {isDrawing && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(45deg, transparent, rgba(139, 92, 246, 0.2), transparent)',
                  animation: 'spin 2s linear infinite',
                  zIndex: 0
                }} />
              )}
              
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} /> {user.name}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    順序: {user.order_index} | 獎池: {user.pool_name || '一般獎項'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1rem', position: 'relative', zIndex: 1, minHeight: '40px', display: 'flex', alignItems: 'center' }}>
                {isDrawing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontSize: '1rem', fontWeight: 'bold', animation: 'pulse 1s infinite' }}>
                    <Play size={18} className="animate-spin" /> 正在抽獎中...
                  </div>
                ) : hasDrawn ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '1rem', fontWeight: 'bold' }}>
                    <CheckCircle2 size={18} /> 已完成抽獎
                  </div>
                ) : isNext ? (
                  <div style={{ color: '#3b82f6', fontSize: '1rem', fontWeight: 'bold' }}>
                    🟢 輪到他了！
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    等待中...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PresentPage;
