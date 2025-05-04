import { useEffect, useRef, useState } from 'react';
import { useAuth } from './use-auth';
import { useQueryClient } from '@tanstack/react-query';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocketNotifications() {
  const { user } = useAuth();
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!user) {
      setStatus('disconnected');
      return;
    }
    
    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;
    
    setStatus('connecting');
    
    socket.onopen = () => {
      setStatus('connected');
      
      // Authenticate the WebSocket connection
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.type === 'auth_success') {
          console.log('WebSocket authenticated successfully');
        } else if (data.type === 'notification') {
          // Invalidate queries to refresh notification data
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
          
          // You could also show a toast notification here
          console.log('New notification received:', data.data);
          
          // Play notification sound or show browser notification
          playNotificationSound();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
    };
    
    socket.onclose = () => {
      setStatus('disconnected');
    };
    
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user, queryClient]);
  
  // Simple beep sound for notifications
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(0);
      
      setTimeout(() => {
        oscillator.stop();
      }, 200);
    } catch (error) {
      console.log('Audio notification failed to play:', error);
    }
  };
  
  return { status };
}
