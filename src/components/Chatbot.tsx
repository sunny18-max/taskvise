import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatBotProps {
  dashboardType: 'admin' | 'manager' | 'employee';
}

export const ChatBot = ({ dashboardType }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = getWelcomeMessage(dashboardType);
      setMessages([{
        id: '1',
        content: welcomeMessage,
        role: 'assistant',
        timestamp: new Date()
      }]);
    }
  }, [isOpen, dashboardType]);

  // Toggle chat open/close
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const getWelcomeMessage = (type: string) => {
    const messages = {
      admin: "👋 Hello Administrator! I'm your AI assistant. I can help you manage employees, analyze system data, and navigate the admin dashboard efficiently. What would you like to explore today?",
      manager: "💼 Welcome Manager! I'm here to assist with team coordination, project tracking, and resource management. How can I help you optimize your team's performance?",
      employee: "🚀 Hi there! I'm your work companion. I can help you manage tasks, track projects, handle leave requests, and understand your workload better. How can I assist you today?"
    };
    return messages[type as keyof typeof messages] || "Hello! How can I help you today?";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await generateBotResponse(inputMessage, dashboardType, messages);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "😔 I'm having trouble responding right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      content: getWelcomeMessage(dashboardType),
      role: 'assistant',
      timestamp: new Date()
    }]);
  };

  const getQuickSuggestions = () => {
    const suggestions = {
      admin: [
        "How to add a new employee?",
        "Show me skill gap analysis",
        "Export employee data",
        "Manage user roles"
      ],
      manager: [
        "Assign a new task",
        "Check team workload",
        "Create a project",
        "View reports"
      ],
      employee: [
        "Update task status",
        "Request leave",
        "Check my projects",
        "Get help with a task"
      ]
    };
    return suggestions[dashboardType as keyof typeof suggestions] || [];
  };

  // SVG Icons as React components
  const MessageCircleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );

  const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );

  const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22,2 15,22 11,13 2,9"/>
    </svg>
  );

  const BotIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
    </svg>
  );

  const UserIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const LoaderIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );

  const SparklesIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.5 1l1.5 3.5L14.5 4 13 7.5 14.5 11l-3.5-1.5L7.5 11 9 7.5 7.5 4 9.5 1z"/>
      <path d="M15.5 13l1.5 3.5L20.5 16 19 19.5 20.5 23l-3.5-1.5L13.5 23 15 19.5 13.5 16 15.5 13z"/>
      <path d="M3.5 13l1.5 3.5L8.5 16 7 19.5 8.5 23l-3.5-1.5L1.5 23 3 19.5 1.5 16 3.5 13z"/>
    </svg>
  );

  const ZapIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );

  const BrainIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 12h6m-3-3v6m-9 3c0-5 3-9 6-9 0 3 3 6 6 6 3 0 6-3 6-6 3 0 6 4 6 9s-3 9-6 9c-3 0-6-3-6-6 0 3-3 6-6 6s-6-4-6-9z"/>
    </svg>
  );

  const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  );

  return (
    <>
      {/* Chat Bot Button */}
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          height: '56px',
          width: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)';
        }}
      >
        <div style={{ position: 'relative' }}>
          <MessageCircleIcon />
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            height: '12px',
            width: '12px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            border: '2px solid white',
            animation: 'pulse 1.5s infinite'
          }} />
        </div>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          width: '360px',
          height: '480px',
          zIndex: 50,
          animation: 'slideInUp 0.3s ease-out'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, white, #f9fafb)',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
            border: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(to right, #2563eb, #7c3aed, #2563eb)',
              color: 'white',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.1
              }}>
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'white',
                  borderRadius: '50%'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'white',
                  borderRadius: '50%'
                }} />
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      height: '40px',
                      width: '40px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <BrainIcon />
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      height: '12px',
                      width: '12px',
                      backgroundColor: '#10b981',
                      borderRadius: '50%',
                      border: '2px solid white'
                    }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      margin: 0,
                      color: 'white'
                    }}>Dashboard Assistant</h3>
                    <p style={{
                      fontSize: '12px',
                      color: '#dbeafe',
                      margin: 0,
                      fontWeight: 300
                    }}>Always here to help</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: 'none',
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {dashboardType}
                  </span>
                  <button
                    onClick={toggleChat}
                    style={{
                      height: '28px',
                      width: '28px',
                      color: 'white',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <XIcon />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Messages Area */}
            <div style={{
              flex: 1,
              padding: '16px',
              background: 'linear-gradient(135deg, #f0f9ff, white, #faf5ff)',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                      animation: 'fadeIn 0.3s ease-out'
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '85%',
                        borderRadius: '12px',
                        padding: '12px',
                        transition: 'all 0.3s ease',
                        ...(message.role === 'user' ? {
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: 'white',
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                        } : {
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          color: '#1f2937',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                          border: '1px solid #f3f4f6',
                          backdropFilter: 'blur(10px)'
                        })
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        {message.role === 'assistant' && (
                          <div style={{ flexShrink: 0 }}>
                            <div style={{
                              height: '24px',
                              width: '24px',
                              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <BotIcon />
                            </div>
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '14px',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            margin: 0
                          }}>{message.content}</p>
                          <p style={{
                            fontSize: '11px',
                            marginTop: '4px',
                            fontWeight: 500,
                            ...(message.role === 'user' ? {
                              color: '#bfdbfe'
                            } : {
                              color: '#6b7280'
                            })
                          }}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div style={{ flexShrink: 0 }}>
                            <div style={{
                              height: '24px',
                              width: '24px',
                              background: 'linear-gradient(135deg, #4b5563, #374151)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <UserIcon />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    animation: 'fadeIn 0.3s ease-out'
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '12px',
                      padding: '12px',
                      maxWidth: '85%',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #f3f4f6',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          height: '24px',
                          width: '24px',
                          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <BotIcon />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <div style={{
                              height: '6px',
                              width: '6px',
                              backgroundColor: '#9ca3af',
                              borderRadius: '50%',
                              animation: 'bounce 1s infinite'
                            }} />
                            <div style={{
                              height: '6px',
                              width: '6px',
                              backgroundColor: '#9ca3af',
                              borderRadius: '50%',
                              animation: 'bounce 1s infinite',
                              animationDelay: '0.1s'
                            }} />
                            <div style={{
                              height: '6px',
                              width: '6px',
                              backgroundColor: '#9ca3af',
                              borderRadius: '50%',
                              animation: 'bounce 1s infinite',
                              animationDelay: '0.2s'
                            }} />
                          </div>
                          <span style={{
                            fontSize: '14px',
                            color: '#4b5563',
                            fontWeight: 500
                          }}>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Suggestions */}
                {messages.length === 1 && !isLoading && (
                  <div style={{
                    marginTop: '16px',
                    animation: 'fadeIn 0.5s ease-out 0.3s both'
                  }}>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#6b7280',
                      textAlign: 'center',
                      margin: '0 0 8px 0'
                    }}>QUICK SUGGESTIONS</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {getQuickSuggestions().map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setInputMessage(suggestion)}
                          style={{
                            textAlign: 'left',
                            padding: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.6)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.borderColor = '#bfdbfe';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        >
                          <p style={{
                            fontSize: '12px',
                            color: '#374151',
                            fontWeight: 500,
                            lineHeight: '1.4',
                            margin: 0
                          }}>{suggestion}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} style={{ height: '1px' }} />
              </div>
            </div>

            {/* Input Area */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid #f3f4f6',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      height: '40px',
                      width: '100%',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      padding: '8px 36px 8px 12px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#93c5fd';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}>
                    <SparklesIcon />
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  style={{
                    height: '40px',
                    width: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease',
                    ...((!inputMessage.trim() || isLoading) && {
                      opacity: 0.5,
                      boxShadow: 'none'
                    })
                  }}
                  onMouseEnter={(e) => {
                    if (inputMessage.trim() && !isLoading) {
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (inputMessage.trim() && !isLoading) {
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                >
                  {isLoading ? (
                    <div style={{ animation: 'spin 1s linear infinite' }}>
                      <LoaderIcon />
                    </div>
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px'
              }}>
                <button
                    onClick={clearChat}
                    style={{
                        fontSize: '11px',
                        height: '28px',
                        color: '#6b7280',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        padding: '0 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#374151';
                        e.currentTarget.style.backgroundColor = '#f3f4f6'; // ✅ Fixed: using = instead of :
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#6b7280';
                        e.currentTarget.style.backgroundColor = 'transparent'; // ✅ Also fixed here
                    }}
                    >
                    <TrashIcon />
                    Clear
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ZapIcon />
                  <span style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    fontWeight: 500
                  }}>
                    AI • {dashboardType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-4px);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </>
  );
};

// AI Response Generator
const generateBotResponse = async (
  userMessage: string,
  dashboardType: string,
  conversationHistory: Message[]
): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800));

  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "👋 Hello! I'm excited to help you navigate your dashboard. What would you like to explore today?";
  }

  if (lowerMessage.includes('thank')) {
    return "🌟 You're welcome! I'm glad I could help. Is there anything else you'd like to know?";
  }

  if (lowerMessage.includes('help')) {
    return getHelpResponse(dashboardType);
  }

  switch (dashboardType) {
    case 'admin':
      return getAdminResponse(lowerMessage);
    case 'manager':
      return getManagerResponse(lowerMessage);
    case 'employee':
      return getEmployeeResponse(lowerMessage);
    default:
      return "🤔 I understand you're asking about the dashboard features. Could you be more specific about what you'd like to accomplish?";
  }
};

const getHelpResponse = (dashboardType: string): string => {
  const helpMessages = {
    admin: `I can help you with:

• Employee Management - Add, edit, and manage team members
• Analytics & Reports - System-wide insights and metrics  
• Skill Gap Analysis - Identify team capabilities
• System Configuration - User roles and permissions
• Data Export - Export employee data

What specific area would you like assistance with?`,

    manager: `I can assist you with:

• Task Management - Create, assign, and track tasks
• Project Coordination - Monitor progress and deadlines
• Team Oversight - View employee performance
• Workload Balancing - Distribute tasks evenly
• Performance Reports - Generate insights
• Leave Management - Approve time-off requests

What would you like to focus on?`,

    employee: `I'm here to help you with:

• Task Management - Update status and progress
• Project Tracking - Monitor your projects
• Leave Requests - Submit and track time-off
• Time Management - Track work sessions
• Performance Insights - View your metrics
• Help Requests - Get assistance

How can I assist you today?`
  };

  return helpMessages[dashboardType as keyof typeof helpMessages] || "🎯 I'm here to help! What do you need assistance with?";
};

const getAdminResponse = (message: string): string => {
  if (message.includes('employee') || message.includes('user')) {
    if (message.includes('add') || message.includes('create')) {
      return "👤 To add a new employee:\n\n1. Go to Employees tab\n2. Click 'Add Employee'\n3. Fill in details and role\n4. Assign skills and department\n5. Set temporary password\n\nThey'll receive login instructions!";
    }
    if (message.includes('delete') || message.includes('remove')) {
      return "🗑️ To delete employees:\n\n• Bulk: Select with checkboxes, use 'Bulk Actions'\n• Single: Click trash icon\n\nNote: This cannot be undone.";
    }
    if (message.includes('role') || message.includes('permission')) {
      return "👑 Managing User Roles:\n\n• Admin: Full system access\n• Manager: Team management\n• Employee: Task execution\n\nUse bulk actions or edit individually.";
    }
    return "👥 Employee Management:\n\nManage your entire workforce in one place. View, filter, sort, and manage employees efficiently.";
  }

  if (message.includes('skill') || message.includes('analytics')) {
    return "📊 Skill Gap Analysis:\n\nVisualize team capabilities vs project requirements. Identify training needs and resource allocation insights.";
  }

  if (message.includes('report')) {
    return "📈 Reports & Analytics:\n\nAccess system-wide insights, performance metrics, and comprehensive data visualizations for informed decisions.";
  }

  return "🤔 I understand you're asking about admin features. Could you specify:\n\n• Employee management\n• Analytics & reports\n• Skill gap analysis\n• System configuration";
};

const getManagerResponse = (message: string): string => {
  if (message.includes('task')) {
    if (message.includes('assign') || message.includes('create')) {
      return "📝 Assigning Tasks:\n\n1. Click 'Assign Task'\n2. Select team member\n3. Set priority and due date\n4. Choose project (optional)\n5. Add description\n\nUse Workload Balancer for even distribution!";
    }
    return "✅ Task Management:\n\nCreate, assign, and track tasks. Set priorities, monitor progress, and ensure timely completion.";
  }

  if (message.includes('project')) {
    return "🚀 Project Management:\n\nOrganize related tasks, track progress, assign teams, set deadlines, and generate reports.";
  }

  if (message.includes('employee') || message.includes('team')) {
    return "👥 Team Management:\n\nView employee profiles, track performance, manage workloads, and assign tasks based on skills.";
  }

  if (message.includes('report')) {
    return "📊 Manager Reports:\n\nAccess team performance, project progress, task completion rates, and productivity analytics.";
  }

  if (message.includes('workload')) {
    return "⚖️ Workload Management:\n\nBalance tasks across team members, monitor capacity, and ensure optimal resource utilization.";
  }

  return "💼 I understand you're asking about management. Could you specify:\n\n• Task management\n• Project coordination\n• Team oversight\n• Workload balancing\n• Performance reports";
};

const getEmployeeResponse = (message: string): string => {
  if (message.includes('task')) {
    if (message.includes('status') || message.includes('update')) {
      return "🔄 Updating Task Status:\n\n1. Go to Tasks view\n2. Find your task\n3. Click status badge\n4. Select new status\n5. Add comments if needed\n\nStatus: Pending → In Progress → Completed";
    }
    return "✅ Your Tasks:\n\nView all assignments, filter by status/priority, track due dates, and request help when needed.";
  }

  if (message.includes('project')) {
    return "📅 Your Projects:\n\nMonitor assigned projects, track progress, view team members, and stay updated on deadlines.";
  }

  if (message.includes('leave') || message.includes('vacation')) {
    return "🏖️ Leave Requests:\n\n1. Go to Leave Management\n2. Click 'Request Leave'\n3. Select dates and type\n4. Provide reason\n5. Submit for approval\n\nTrack status and get notifications!";
  }

  if (message.includes('workload')) {
    return "📊 Your Workload:\n\nView current task distribution. Green = manageable, Yellow = balanced, Red = heavy workload.";
  }

  return "🚀 I understand you're asking about work. Could you specify:\n\n• Task management\n• Project tracking\n• Leave requests\n• Time tracking\n• Performance metrics";
};