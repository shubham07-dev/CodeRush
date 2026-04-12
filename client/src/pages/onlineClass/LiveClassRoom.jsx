import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

function VideoNode({ stream, label, muted = false, isVideoMuted = false, onToggleAudio, onToggleVideo, isAudioMutedLocal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted={muted}
        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: isVideoMuted ? 'none' : 'block' }}
      />
      {isVideoMuted && (
        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', position: 'absolute', top: 0, left: 0 }}>
          Camera Disabled
        </div>
      )}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', zIndex: 10 }}>
        {label}
      </div>
      {(onToggleAudio || onToggleVideo) && (
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
          <button onClick={onToggleAudio} style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', background: isAudioMutedLocal ? '#e53e3e' : '#fff', color: isAudioMutedLocal ? '#fff' : '#000', cursor: 'pointer', fontSize: '0.8rem' }}>
            {isAudioMutedLocal ? '🔇' : '🎤'}
          </button>
          <button onClick={onToggleVideo} style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', background: isVideoMuted ? '#e53e3e' : '#fff', color: isVideoMuted ? '#fff' : '#000', cursor: 'pointer', fontSize: '0.8rem' }}>
            {isVideoMuted ? '🚫' : '📷'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function LiveClassRoom({ classData, onLeave }) {
  const { user } = useAuth();
  
  // References
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const canvasRef = useRef(null);
  const whiteboardBoxRef = useRef(null);

  // States
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectedStudents, setConnectedStudents] = useState(0);

  // Tools
  const [penColor, setPenColor] = useState('black');
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [activeInputCoords, setActiveInputCoords] = useState(null); // {x, y}
  const [activeInputText, setActiveInputText] = useState("");
  const [textElements, setTextElements] = useState([]); // [{x, y, text, color}]

  // Media States
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]); // [{ socketId, stream, role, label }]
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  useEffect(() => {
    // 1. Initialize Socket
    const baseURL = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1').replace('/api/v1', '');
    socketRef.current = io(baseURL);

    const attachSocketListeners = () => {
      socketRef.current.on('user-joined', async (socketId, role, userId) => {
        if (role === 'student') setConnectedStudents(prev => prev + 1);
        
        const peer = new RTCPeerConnection(STUN_SERVERS);
        peersRef.current[socketId] = peer;

        if (user.role === 'teacher' || user.role === 'admin') {
          socketRef.current.emit('draw-text', { classId: classData._id, textElements });
        }

        // Only attach tracks if we successfully got a local stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            peer.addTrack(track, localStreamRef.current);
          });
        }

        peer.ontrack = (event) => {
          setRemoteStreams(prev => {
            if (prev.find(p => p.socketId === socketId)) return prev;
            return [...prev, { socketId, stream: event.streams[0], role, label: role === 'teacher' || role === 'admin' ? 'Teacher' : `Student ${socketId.substring(0,4)}` }];
          });
        };

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit('webrtc-ice-candidate', { target: socketId, caller: socketRef.current.id, candidate: event.candidate });
          }
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current.emit('webrtc-offer', { target: socketId, caller: socketRef.current.id, offer, role: user.role });
      });

      socketRef.current.on('webrtc-offer', async (payload) => {
        const peer = new RTCPeerConnection(STUN_SERVERS);
        peersRef.current[payload.caller] = peer; 

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            peer.addTrack(track, localStreamRef.current);
          });
        }

        peer.ontrack = (event) => {
          setRemoteStreams(prev => {
            if (prev.find(p => p.socketId === payload.caller)) return prev;
            return [...prev, { socketId: payload.caller, stream: event.streams[0], role: payload.role, label: payload.role === 'teacher' || payload.role === 'admin' ? 'Teacher' : `Student ${payload.caller.substring(0,4)}` }];
          });
        };

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit('webrtc-ice-candidate', { target: payload.caller, caller: socketRef.current.id, candidate: event.candidate });
          }
        };

        await peer.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        
        socketRef.current.emit('webrtc-answer', { target: payload.caller, caller: socketRef.current.id, answer });
      });

      socketRef.current.on('webrtc-answer', async (payload) => {
        const peer = peersRef.current[payload.caller];
        if (peer) {
          await peer.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
      });

      socketRef.current.on('webrtc-ice-candidate', async (payload) => {
        const peer = peersRef.current[payload.caller];
        if (peer && payload.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(e => console.log(e));
        }
      });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('join-class', classData._id, user.role, user._id);
      });

      if (socketRef.current.connected) {
        socketRef.current.emit('join-class', classData._id, user.role, user._id);
      }
    };

    // Request Media FIRST to prevent race conditions with incoming WebRTC offers
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        localStreamRef.current = stream;
        attachSocketListeners();
      }).catch(err => {
        console.error("Mic/Cam Access Denied:", err);
        alert("Please allow camera/mic permissions to broadcast your video. You will still receive the Teacher's stream.");
        // Still attach socket listeners so they can be a viewer!
        attachSocketListeners();
      });

    socketRef.current.on('user-disconnected', (socketId) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
        setRemoteStreams(prev => prev.filter(p => p.socketId !== socketId));
      }
    });

    // Auto-kick listener
    if (user.role === 'student') {
      socketRef.current.on('class-ended', () => {
        alert("The teacher has ended this live session. You are being redirected.");
        onLeave();
      });
    }

    // ─── SHARED LOGIC ─────────────────────────────
    socketRef.current.on('chat-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on('draw-stroke', (paths) => {
      if (user.role === 'student' && canvasRef.current) {
        canvasRef.current.loadPaths(paths);
      }
    });

    socketRef.current.on('draw-text', (elements) => {
      if (user.role === 'student') {
        setTextElements(elements);
      }
    });
    
    socketRef.current.on('clear-whiteboard', () => {
      if (canvasRef.current) canvasRef.current.clearCanvas();
      setTextElements([]);
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.keys(peersRef.current).forEach(key => peersRef.current[key].close());
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [classData._id, user.role, user._id]);

  // Actions
  const handleEndSessionDirectly = async () => {
    if (confirm("Are you sure you want to end this session for everyone?")) {
      try {
        await api.put(`/classes/${classData._id}/end`);
        onLeave();
      } catch (err) {
        alert("Error ending class.");
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks().find(t => t.label.includes('camera') || !t.label.includes('screen'));
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing && (user.role === 'teacher' || user.role === 'admin')) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getTracks()[0];
        
        Object.keys(peersRef.current).forEach(peerId => {
          const peer = peersRef.current[peerId];
          const sender = peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        
        const modifiedStream = new MediaStream([screenTrack, localStream.getAudioTracks()[0]]);
        setLocalStream(modifiedStream);

        screenTrack.onended = () => {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(camStrm => {
              const camTrack = camStrm.getVideoTracks()[0];
              Object.keys(peersRef.current).forEach(peerId => {
                const peer = peersRef.current[peerId];
                const sender = peer.getSenders().find(s => s.track.kind === 'video');
                if (sender) sender.replaceTrack(camTrack);
              });
              const newLocal = new MediaStream([camTrack, localStream.getAudioTracks()[0]]);
              setLocalStream(newLocal);
              localStreamRef.current = newLocal;
              setIsScreenSharing(false);
              // reset toggle states naturally
              setIsVideoMuted(false);
            });
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen Share failed:", err);
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = { classId: classData._id, user: user.fullName, text: chatInput, time: new Date().toLocaleTimeString() };
    socketRef.current.emit('chat-message', msg);
    setChatInput('');
  };

  const handleWhiteboardChange = async () => {
    if ((user.role === 'teacher' || user.role === 'admin') && canvasRef.current && !isTypingMode) {
      const paths = await canvasRef.current.exportPaths();
      socketRef.current.emit('draw-stroke', { classId: classData._id, strokeData: paths });
    }
  };

  const clearWhiteboard = () => {
    if (canvasRef.current) canvasRef.current.clearCanvas();
    setTextElements([]);
    socketRef.current.emit('clear-whiteboard', classData._id);
  };

  const handleWhiteboardClick = (e) => {
    if ((user.role !== 'teacher' && user.role !== 'admin') || !isTypingMode) return;
    if (activeInputCoords) return; // already typing
    
    const rect = whiteboardBoxRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setActiveInputCoords({ x, y });
  };

  const saveTextElement = (e) => {
    e.preventDefault();
    if (activeInputText.trim() && activeInputCoords) {
      const newEl = { id: Date.now(), x: activeInputCoords.x, y: activeInputCoords.y, text: activeInputText, color: penColor };
      const updated = [...textElements, newEl];
      setTextElements(updated);
      socketRef.current.emit('draw-text', { classId: classData._id, textElements: updated });
    }
    setActiveInputCoords(null);
    setActiveInputText("");
  };

  // Determine which stream is the main Teacher Broadcast focus in the sidebar
  const isTeacherUser = user.role === 'teacher' || user.role === 'admin';
  const mainBroadcastStream = isTeacherUser ? localStream : remoteStreams.find(s => s.role === 'teacher' || s.role === 'admin')?.stream;
  const mainBroadcastLabel = isTeacherUser ? 'Your Broadcast' : 'Teacher Broadcast';

  // The bottom row contains all other webcams (local students + remote students)
  const participantStreams = [];
  if (user.role === 'student' && localStream) participantStreams.push({ id: 'local', stream: localStream, label: 'You', isLocal: true });
  remoteStreams.forEach(rs => {
    if (rs.role === 'student') participantStreams.push({ id: rs.socketId, stream: rs.stream, label: rs.label, isLocal: false });
  });

  // Responsive state
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 900);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* ─── Premium Header Bar ─── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: isMobileView ? '0.6rem 1rem' : '0.8rem 1.5rem',
        background: 'rgba(17,17,17,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, gap: '0.5rem', flexWrap: 'wrap', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button onClick={onLeave} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', color: '#d1d5db', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Leave
          </button>

          {isTeacherUser && (
            <button onClick={handleEndSessionDirectly} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem',
              background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: '8px', color: '#fca5a5', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
              End For All
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 8px rgba(239,68,68,0.6)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', letterSpacing: '0.05em' }}>LIVE</span>
            </span>
            <h2 style={{ margin: 0, fontSize: isMobileView ? '0.95rem' : '1.1rem', fontWeight: 700, color: '#f9fafb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobileView ? '140px' : '300px' }}>
              {classData.title}
            </h2>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', borderRadius: '4px', textTransform: 'uppercase' }}>
              {classData.subject} · {classData.section}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isTeacherUser && (
            <>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '4px' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {remoteStreams.filter(s => s.role === 'student').length}
              </span>
              <button onClick={clearWhiteboard} style={{
                padding: '0.4rem 0.7rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px', color: '#d1d5db', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '3px' }}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Clear
              </button>
              <button onClick={toggleScreenShare} style={{
                padding: '0.4rem 0.7rem',
                background: isScreenSharing ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${isScreenSharing ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '6px', color: isScreenSharing ? '#86efac' : '#d1d5db', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: '3px' }}><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                {isScreenSharing ? 'Stop Share' : 'Screen'}
              </button>
            </>
          )}

          {/* Mobile Chat Toggle */}
          {isMobileView && (
            <button onClick={() => setShowChat(!showChat)} style={{
              padding: '0.4rem 0.7rem', background: showChat ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${showChat ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '6px', color: showChat ? '#a5b4fc' : '#d1d5db', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {messages.length > 0 && <span style={{ marginLeft: '4px', background: '#6366f1', color: '#fff', borderRadius: '99px', padding: '0 5px', fontSize: '0.7rem' }}>{messages.length}</span>}
            </button>
          )}
        </div>
      </div>

      {/* ─── Main Content Area ─── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isMobileView ? 'column' : 'row' }}>
        
        {/* Left Column: Whiteboard + Participants */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          
          {/* Whiteboard */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '0.5rem', background: '#1a1a1a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            
            {/* Whiteboard Toolbar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem 0.8rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0
            }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Whiteboard</span>
                {isTeacherUser && (
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                    <button 
                      onClick={() => setIsTypingMode(false)} 
                      style={{ padding: '0.3rem 0.6rem', background: !isTypingMode ? 'rgba(255,255,255,0.12)' : 'transparent', border: 'none', color: !isTypingMode ? '#fff' : '#6b7280', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    >✏️ Draw</button>
                    <button 
                      onClick={() => setIsTypingMode(true)} 
                      style={{ padding: '0.3rem 0.6rem', background: isTypingMode ? 'rgba(255,255,255,0.12)' : 'transparent', border: 'none', color: isTypingMode ? '#fff' : '#6b7280', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    >🔤 Type</button>
                  </div>
                )}
              </div>
              
              {isTeacherUser ? (
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {['#ffffff', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b'].map(color => (
                    <div 
                      key={color} 
                      onClick={() => setPenColor(color)}
                      style={{ width: '20px', height: '20px', background: color, borderRadius: '50%', cursor: 'pointer', border: penColor === color ? '2px solid #6366f1' : '2px solid transparent', transition: 'border 0.2s', boxShadow: penColor === color ? '0 0 8px rgba(99,102,241,0.4)' : 'none' }}
                    />
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>View Only</span>
              )}
            </div>
            
            {/* Canvas Area */}
            <div ref={whiteboardBoxRef} onClick={handleWhiteboardClick} style={{ position: 'relative', flex: 1, cursor: isTeacherUser ? (isTypingMode ? 'text' : 'crosshair') : 'default', overflow: 'hidden', background: '#111' }}>
              <ReactSketchCanvas
                ref={canvasRef}
                strokeWidth={isTeacherUser && !isTypingMode ? 4 : 0} 
                strokeColor={penColor}
                canvasColor="#111111"
                onChange={handleWhiteboardChange}
                readOnly={!isTeacherUser || isTypingMode} 
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
              />
              
              {/* Text Overlays */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 2 }}>
                {textElements.map(el => (
                  <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, color: el.color, fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {el.text}
                  </div>
                ))}
                
                {activeInputCoords && (
                  <form onSubmit={saveTextElement} style={{ position: 'absolute', left: activeInputCoords.x, top: activeInputCoords.y, pointerEvents: 'auto' }}>
                    <input 
                      autoFocus
                      type="text" 
                      value={activeInputText}
                      onChange={e => setActiveInputText(e.target.value)}
                      onBlur={saveTextElement}
                      style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.3)', outline: 'none', color: penColor, fontSize: '1.2rem', fontWeight: 'bold', padding: '2px 4px' }}
                    />
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Participants Strip */}
          {participantStreams.length > 0 && (
            <div style={{
              display: 'flex', gap: '0.5rem', padding: '0.5rem',
              overflowX: 'auto', flexShrink: 0, height: isMobileView ? '100px' : '130px', alignItems: 'stretch'
            }}>
              {participantStreams.map(ps => (
                <div key={ps.id} style={{ width: isMobileView ? '130px' : '170px', flexShrink: 0, height: '100%', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <VideoNode 
                    stream={ps.stream} 
                    label={ps.label} 
                    muted={ps.isLocal} 
                    isVideoMuted={ps.isLocal ? isVideoMuted : false} 
                    onToggleAudio={ps.isLocal ? toggleAudio : null}
                    onToggleVideo={ps.isLocal ? toggleVideo : null}
                    isAudioMutedLocal={ps.isLocal ? isAudioMuted : false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Broadcast + Chat (desktop: sidebar, mobile: overlay) */}
        <div style={{
          display: isMobileView ? (showChat ? 'flex' : 'none') : 'flex',
          flexDirection: 'column', width: isMobileView ? '100%' : '320px',
          gap: '0.5rem', overflow: 'hidden', padding: '0.5rem', flexShrink: 0,
          ...(isMobileView ? { position: 'absolute', bottom: 0, left: 0, right: 0, top: '60px', zIndex: 20, background: 'rgba(15,15,15,0.97)', backdropFilter: 'blur(16px)' } : {})
        }}>
          
          {/* Main Broadcast Focus (Teacher) */}
          <div style={{
            height: isMobileView ? '180px' : '220px', flexShrink: 0,
            borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative'
          }}>
            {mainBroadcastStream ? (
              <VideoNode 
                stream={mainBroadcastStream}
                label={mainBroadcastLabel}
                muted={isTeacherUser} 
                isVideoMuted={isTeacherUser ? isVideoMuted : false}
                onToggleAudio={isTeacherUser ? toggleAudio : null}
                onToggleVideo={isTeacherUser ? toggleVideo : null}
                isAudioMutedLocal={isAudioMuted}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                <span style={{ color: '#6b7280', fontSize: '0.85rem', fontWeight: 600 }}>Waiting for Teacher...</span>
                <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{ width: '50%', height: '100%', background: '#6366f1', borderRadius: '2px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            background: '#1a1a1a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {/* Chat Header */}
            <div style={{ padding: '0.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e5e7eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live Chat</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#6b7280', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{messages.length}</span>
              </div>
              {isMobileView && (
                <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              )}
            </div>
            
            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <strong style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>{msg.user}</strong>
                    <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>{msg.time}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.4 }}>{msg.text}</div>
                </div>
              ))}
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '2rem', color: '#4b5563', fontSize: '0.85rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem', display: 'block' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  No messages yet
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} style={{ padding: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                style={{
                  flex: 1, padding: '0.5rem 0.8rem', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                  color: '#e5e7eb', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit'
                }}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button type="submit" style={{
                padding: '0.5rem 0.8rem', background: '#6366f1', border: 'none',
                borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
