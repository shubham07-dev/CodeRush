import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../api/client.js';

export default function VirtualCodeEditor({ practical, onBack }) {
  // If it's already a final submission, load the previous code, otherwise boilerplate.
  const boilerplate = `// Write a function to print the expected output\n// Then call your console.log()\n\nconsole.log("Hello World");\n`;
  const initialCode = practical.isFinal ? (practical.codeSubmitted || boilerplate) : (practical.codeSubmitted || boilerplate);
  
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState(practical.output || '');
  const [evaluating, setEvaluating] = useState(false);
  const [resultStatus, setResultStatus] = useState(practical.isCorrect ? 'success' : (practical.isFinal ? 'fail' : null));
  
  // Anti-cheat / Fullscreen state
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [testStarted, setTestStarted] = useState(practical.isFinal); // If already final, we skip the "Start" wall
  const [cheatViolation, setCheatViolation] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If the test has started, they are NOT in final status, and they left fullscreen -> Cheat violation!
      if (testStarted && !practical.isFinal && !isCurrentlyFullscreen) {
        setCheatViolation(true);
        // Force auto-submit as penalty
        handleRunCode(true, "CHEAT_AUTO_SUBMIT");
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [testStarted, practical.isFinal, code]);

  const startTest = async () => {
    try {
      if (containerRef.current && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      }
      setTestStarted(true);
      setCheatViolation(false);
    } catch (err) {
      alert("Failed to enter fullscreen. You must allow fullscreen to take this practical.");
    }
  };

  const forceExit = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    onBack();
  };

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleRunCode = async (isFinal = false, cheatCode = null) => {
    if (!code.trim() && !cheatCode) return;
    
    setEvaluating(true);
    setOutput('Loading VM...');
    setResultStatus(null);
    
    const submissionCode = cheatCode === "CHEAT_AUTO_SUBMIT" ? code + "\n\n// AUTO-SUBMITTED DUE TO FULLSCREEN EXIT VIOLATION" : code;

    try {
      const response = await api.post(`/practicals/${practical._id}/submit`, {
        codeSubmitted: submissionCode,
        language: 'javascript',
        isFinalSubmit: isFinal
      });
      
      const { data } = response.data;
      setOutput(data.output);
      setResultStatus(data.isCorrect ? 'success' : 'fail');

      if (isFinal) {
        if (cheatCode === "CHEAT_AUTO_SUBMIT") {
          alert('Warning: You exited fullscreen mode. Your code has been automatically submitted as-is.');
        } else {
          alert('Solution submitted successfully!');
        }
        await forceExit();
      }
      
    } catch (error) {
      setOutput('Error: ' + (error.response?.data?.message || error.message));
      setResultStatus('fail');
      // Even if it failed to submit properly, we kick them out on cheat
      if (isFinal && cheatCode === "CHEAT_AUTO_SUBMIT") {
        await forceExit();
      }
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="virtual-editor-container fade-in" 
      style={{ 
        display: 'flex', flexDirection: 'column', height: '100%', 
        background: '#f4f6f8', padding: isFullscreen ? '1.5rem' : '0' 
      }}
    >
      {/* 1. Show Start Wall if test not started */}
      {!testStarted && !practical.isFinal ? (
        <div className="card text-center fade-in" style={{ padding: '4rem 2rem', margin: 'auto', background: '#fff' }}>
          <h2>{practical.title}</h2>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '1rem auto' }}>
            This is a secure practical test environment. Once you click "Start Test", the editor will enter <strong>strict Fullscreen mode</strong>. 
            If you exit Fullscreen mode (e.g. by pressing Esc or switching tabs), your code will be <strong>automatically submitted exactly as it is</strong>.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn-outline" onClick={onBack}>Cancel</button>
            <button className="btn-primary" onClick={startTest}>Start Test (Enter Fullscreen)</button>
          </div>
        </div>
      ) : (
        /* 2. The active Editor Interface */
        <>
          {/* Header bar */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem' }}>
            <div>
              <button className="btn-outline" onClick={forceExit} style={{ padding: '0.25rem 0.75rem', marginRight: '1rem' }}>
                ← Back
              </button>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                {practical.title} {practical.isFinal && <span className="badge badge-warning" style={{marginLeft: '10px'}}>Read-Only (Finalized)</span>}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {resultStatus === 'success' && <span className="badge badge-success">✓ Passed</span>}
              {resultStatus === 'fail' && <span className="badge badge-danger">✗ Failed</span>}
              
              {!practical.isFinal && (
                <>
                  <button 
                    className="btn-outline" 
                    onClick={() => handleRunCode(false)} 
                    disabled={evaluating || cheatViolation}
                    style={{ minWidth: '100px' }}
                  >
                    {evaluating ? 'Running...' : 'Run Tests ▶'}
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleRunCode(true)} 
                    disabled={evaluating || cheatViolation}
                    style={{ minWidth: '100px', backgroundColor: '#28a745', borderColor: '#28a745', color: '#fff' }}
                  >
                    Submit Final
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Split pane layout */}
          <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: '60vh' }}>
            
            {/* Left side: Problem Description */}
            <div className="card" style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Problem Statement</h3>
              <p style={{ lineHeight: '1.6', fontSize: '0.95rem', flex: 1, whiteSpace: 'pre-wrap' }}>
                {practical.description}
              </p>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong>Expected Output:</strong>
                <pre style={{ marginTop: '0.5rem', background: '#fff', border: '1px solid #eee', padding: '0.5rem', borderRadius: '4px' }}>
                  {practical.expectedOutput}
                </pre>
              </div>
            </div>

            {/* Right side: Editor + Console */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
              
              {cheatViolation && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                  background: 'rgba(0,0,0,0.8)', zIndex: 100, color: 'white',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <h2 style={{color: '#ff4d4f'}}>Security Violation</h2>
                  <p>You exited the secure fullscreen environment.</p>
                  <p>Auto-submitting your code now...</p>
                </div>
              )}

              {/* Editor */}
              <div className="card" style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={code}
                  onChange={handleEditorChange}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                    readOnly: practical.isFinal || cheatViolation
                  }}
                />
              </div>

              {/* Console */}
              <div className="card" style={{ height: '200px', padding: 0, display: 'flex', flexDirection: 'column', background: '#1e1e1e', color: '#fff' }}>
                <div style={{ background: '#333', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: '#ccc' }}>
                  Terminal Output
                </div>
                <pre style={{ flex: 1, padding: '1rem', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem', margin: 0 }}>
                  {output || '... output will appear here ...'}
                </pre>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
