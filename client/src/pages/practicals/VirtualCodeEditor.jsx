import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../api/client.js';

export default function VirtualCodeEditor({ practical, onBack }) {
  // Provide a simple boilerplate to let students test
  const boilerplate = `// Write a function to print the expected output
// Then call your console.log()

console.log("Hello World");
`;

  const [code, setCode] = useState(boilerplate);
  const [output, setOutput] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [resultStatus, setResultStatus] = useState(null); // 'success', 'fail'

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleRunCode = async (isFinal = false) => {
    if (!code.trim()) return;
    
    setEvaluating(true);
    setOutput('Loading VM...');
    setResultStatus(null);
    
    try {
      const response = await api.post(`/practicals/${practical._id}/submit`, {
        codeSubmitted: code,
        language: 'javascript',
        isFinalSubmit: isFinal
      });
      
      const { data, message } = response.data;
      setOutput(data.output);
      setResultStatus(data.isCorrect ? 'success' : 'fail');

      if (isFinal) {
        alert('Solution submitted successfully!');
        onBack();
      }
      
    } catch (error) {
      setOutput('Error: ' + (error.response?.data?.message || error.message));
      setResultStatus('fail');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="virtual-editor-container fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem' }}>
        <div>
          <button className="btn-outline" onClick={onBack} style={{ padding: '0.25rem 0.75rem', marginRight: '1rem' }}>
            ← Back
          </button>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{practical.title}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {resultStatus === 'success' && <span className="badge badge-success">✓ Passed</span>}
          {resultStatus === 'fail' && <span className="badge badge-danger">✗ Failed</span>}
          <button 
            className="btn-outline" 
            onClick={() => handleRunCode(false)} 
            disabled={evaluating}
            style={{ minWidth: '100px' }}
          >
            {evaluating ? 'Running...' : 'Run Tests ▶'}
          </button>
          <button 
            className="btn-primary" 
            onClick={() => handleRunCode(true)} 
            disabled={evaluating}
            style={{ minWidth: '100px', backgroundColor: '#28a745', borderColor: '#28a745', color: '#fff' }}
          >
            Submit Final
          </button>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
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
                padding: { top: 16 }
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
    </div>
  );
}
