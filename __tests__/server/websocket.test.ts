import { createServer } from 'http';
import express from 'express';
import { AddressInfo } from 'net';
import { WebSocket, WebSocketServer } from 'ws';
import { setTimeout as sleep } from 'timers/promises';

describe('WebSocket Server', () => {
  let server: any;
  let wss: WebSocketServer;
  let port: number;
  let baseUrl: string;
  
  beforeAll((done) => {
    // Set up server
    const app = express();
    server = createServer(app);
    
    // Create WebSocket server
    wss = new WebSocketServer({ server });
    
    // Set up authentication handling
    const authenticatedClients = new Map();
    
    wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          
          // Handle authentication
          if (data.type === 'authenticate') {
            const userId = data.userId;
            if (userId) {
              // Store user ID with this connection
              authenticatedClients.set(ws, userId);
              ws.send(JSON.stringify({ type: 'auth_success', userId }));
            } else {
              ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid user ID' }));
            }
          }
          
          // Handle ping/pong
          if (data.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', time: new Date().toISOString() }));
          }
          
          // Echo message (only for authenticated users)
          if (data.type === 'echo' && authenticatedClients.has(ws)) {
            ws.send(JSON.stringify({ 
              type: 'echo_response', 
              message: data.message,
              userId: authenticatedClients.get(ws)
            }));
          }
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });
      
      // Handle disconnection
      ws.on('close', () => {
        authenticatedClients.delete(ws);
      });
    });
    
    // Start server
    server.listen(0, () => { // 0 = random available port
      const address = server.address() as AddressInfo;
      port = address.port;
      baseUrl = `ws://localhost:${port}`;
      done();
    });
  });
  
  afterAll((done) => {
    wss.close(() => {
      server.close(done);
    });
  });
  
  it('should establish connection successfully', (done) => {
    const ws = new WebSocket(baseUrl);
    
    ws.on('open', () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      ws.close();
    });
    
    ws.on('close', () => {
      done();
    });
    
    ws.on('error', (error) => {
      done(error);
    });
  });
  
  it('should handle authentication success', (done) => {
    const ws = new WebSocket(baseUrl);
    const testUserId = 123;
    
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'authenticate', userId: testUserId }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'auth_success') {
        expect(message.userId).toBe(testUserId);
        ws.close();
      }
    });
    
    ws.on('close', () => {
      done();
    });
    
    ws.on('error', (error) => {
      done(error);
    });
  });
  
  it('should reject authentication with invalid user ID', (done) => {
    const ws = new WebSocket(baseUrl);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'authenticate', userId: null }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'auth_error') {
        expect(message.message).toBe('Invalid user ID');
        ws.close();
      }
    });
    
    ws.on('close', () => {
      done();
    });
    
    ws.on('error', (error) => {
      done(error);
    });
  });
  
  it('should handle ping/pong', (done) => {
    const ws = new WebSocket(baseUrl);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'ping' }));
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'pong') {
        expect(message.time).toBeDefined();
        expect(new Date(message.time).getTime()).toBeLessThanOrEqual(Date.now());
        ws.close();
      }
    });
    
    ws.on('close', () => {
      done();
    });
    
    ws.on('error', (error) => {
      done(error);
    });
  });
  
  it('should only process echo for authenticated users', async () => {
    // Create unauthenticated connection
    const unauthWs = new WebSocket(baseUrl);
    let gotEchoUnauthenticated = false;
    
    unauthWs.on('open', () => {
      unauthWs.send(JSON.stringify({ type: 'echo', message: 'Hello unauthenticated' }));
    });
    
    unauthWs.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'echo_response') {
        gotEchoUnauthenticated = true;
      }
    });
    
    // Create authenticated connection
    const authWs = new WebSocket(baseUrl);
    let gotEchoAuthenticated = false;
    let testMessage = 'Hello authenticated';
    
    const authPromise = new Promise<void>((resolve, reject) => {
      authWs.on('open', () => {
        authWs.send(JSON.stringify({ type: 'authenticate', userId: 456 }));
      });
      
      authWs.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth_success') {
          authWs.send(JSON.stringify({ type: 'echo', message: testMessage }));
        }
        
        if (message.type === 'echo_response') {
          gotEchoAuthenticated = true;
          expect(message.message).toBe(testMessage);
          expect(message.userId).toBe(456);
          resolve();
        }
      });
      
      authWs.on('error', (error) => {
        reject(error);
      });
    });
    
    // Wait for both tests to complete
    await sleep(500); // Wait for any potential unauthenticated echo
    await authPromise; // Wait for authenticated echo
    
    // Cleanup
    unauthWs.close();
    authWs.close();
    
    // Check results
    expect(gotEchoUnauthenticated).toBe(false); // Should not echo for unauthenticated users
    expect(gotEchoAuthenticated).toBe(true); // Should echo for authenticated users
  });
  
  it('should handle invalid message format', (done) => {
    const ws = new WebSocket(baseUrl);
    
    ws.on('open', () => {
      ws.send('this is not valid JSON');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'error') {
        expect(message.message).toBe('Invalid message format');
        ws.close();
      }
    });
    
    ws.on('close', () => {
      done();
    });
    
    ws.on('error', (error) => {
      done(error);
    });
  });
});
