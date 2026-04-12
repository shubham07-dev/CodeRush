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

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '85vh', background: '#f8f9fa' }}>
      
      {/* Dynamic Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 1rem 0', borderRadius: 0, padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-outline" onClick={onLeave}>← Leave Room {isTeacherUser ? '(Keep Live)' : ''}</button>
          
          {isTeacherUser && (
            <button className="btn-primary" onClick={handleEndSessionDirectly} style={{ backgroundColor: '#e53e3e', borderColor: '#e53e3e', color: '#fff' }}>
              End Session For All
            </button>
          )}

          <h2 style={{marginLeft: '1rem'}}><span style={{ color: '#e53e3e' }}>🔴 LIVE:</span> {classData.title}</h2>
          <span className="badge badge-primary">{classData.section}</span>
        </div>
        {isTeacherUser && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{fontWeight:'bold'}}>Students Connected: {remoteStreams.filter(s => s.role === 'student').length}</span>
            <button className="btn-outline" onClick={clearWhiteboard}>Clear Board</button>
            <button className={`btn-${isScreenSharing ? 'outline' : 'primary'}`} onClick={toggleScreenShare}>
              {isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', gap: '1rem', flex: 1, overflow: 'hidden', paddingBottom: participantStreams.length > 0 ? 0 : '1rem' }}>
        
        {/* Left Column: Whiteboard + Student Cams Row */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
          
          {/* Whiteboard */}
          <div className="card" style={{ flex: 1, padding: '0.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <strong>Virtual Whiteboard</strong>
                {isTeacherUser && (
                  <div style={{ display: 'flex', gap: '0.5rem', background: '#ececec', padding: '0.3rem', borderRadius: '8px' }}>
                    <button 
                      onClick={() => setIsTypingMode(false)} 
                      style={{ padding: '0.2rem 0.5rem', background: !isTypingMode ? '#fff' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >✏️ Draw</button>
                    <button 
                      onClick={() => setIsTypingMode(true)} 
                      style={{ padding: '0.2rem 0.5rem', background: isTypingMode ? '#fff' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >🔤 Type</button>
                  </div>
                )}
              </div>

              {isTeacherUser ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['black', '#e53e3e', '#2b6cb0', '#2f855a'].map(color => (
                    <div 
                      key={color} 
                      onClick={() => setPenColor(color)}
                      style={{ width: '24px', height: '24px', background: color, borderRadius: '50%', cursor: 'pointer', border: penColor === color ? '3px solid #666' : '1px solid transparent' }}
                    />
                  ))}
                </div>
              ) : (
                <span className="badge badge-secondary">View Only</span>
              )}
            </div>
            
            <div ref={whiteboardBoxRef} onClick={handleWhiteboardClick} style={{ position: 'relative', flex: 1, border: '2px dashed #ccc', borderRadius: '8px', cursor: isTeacherUser ? (isTypingMode ? 'text' : 'crosshair') : 'default', overflow: 'hidden' }}>
              <ReactSketchCanvas
                ref={canvasRef}
                strokeWidth={isTeacherUser && !isTypingMode ? 4 : 0} 
                strokeColor={penColor}
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
                
                {/* Active TextInput */}
                {activeInputCoords && (
                  <form onSubmit={saveTextElement} style={{ position: 'absolute', left: activeInputCoords.x, top: activeInputCoords.y, pointerEvents: 'auto' }}>
                    <input 
                      autoFocus
                      type="text" 
                      value={activeInputText}
                      onChange={e => setActiveInputText(e.target.value)}
                      onBlur={saveTextElement}
                      style={{ background: 'transparent', border: '1px dashed #aaa', outline: 'none', color: penColor, fontSize: '1.2rem', fontWeight: 'bold', padding: 0 }}
                    />
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Connected Participants Row Strip */}
          {participantStreams.length > 0 && (
            <div className="card" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', flexShrink: 0, height: '140px' }}>
              {participantStreams.map(ps => (
                <div key={ps.id} style={{ width: '180px', flexShrink: 0, height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
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

        {/* Right Column: Broadcast Video + Chat Box */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '320px', gap: '1rem', overflow: 'hidden' }}>
          
          {/* Main Broadcast Focus (Teacher) */}
          <div className="card" style={{ height: '240px', padding: '0.4rem', flexShrink: 0, position: 'relative' }}>
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
              <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                  Waiting for Teacher...
              </div>
            )}
          </div>

          {/* Chat Box */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #eee', background: '#f8f9fa', flexShrink: 0 }}>
              <h3 style={{ margin: 0 }}>Class Chat</h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ background: '#f1f3f5', padding: '0.8rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{msg.user}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>{msg.time}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>{msg.text}</div>
                </div>
              ))}
              {messages.length === 0 && <div className="text-secondary" style={{ textAlign: 'center', marginTop: '2rem' }}>No messages yet.</div>}
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <input 
                type="text" 
                className="input-base" 
                placeholder="Type message..." 
                style={{ flex: 1 }}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem' }}>Send</button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
