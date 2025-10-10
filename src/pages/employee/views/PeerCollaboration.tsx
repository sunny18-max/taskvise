import { useState } from 'react';
import { Users, MessageCircle, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  projects: string[];
  department: string;
  avatar?: string;
  currentWorkload?: 'light' | 'balanced' | 'heavy';
}

interface CollaborationMessage {
  id: string;
  taskId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'help' | 'question' | 'update';
}

interface PeerCollaborationProps {
  taskId: string;
  taskTitle: string;
  teamMembers: TeamMember[];
  currentUserId: string;
  onSendMessage: (message: string, type: 'help' | 'question' | 'update') => void;
  messages: CollaborationMessage[];
}

export const PeerCollaboration = ({
  taskId,
  taskTitle,
  teamMembers,
  currentUserId,
  onSendMessage,
  messages = []
}: PeerCollaborationProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'help' | 'question' | 'update'>('question');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage, messageType);
      setNewMessage('');
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'help':
        return 'bg-red-100 text-red-800';
      case 'question':
        return 'bg-blue-100 text-blue-800';
      case 'update':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Collaboration
        </CardTitle>
        <CardDescription>
          Discuss and get help for: "{taskTitle}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Team Members */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Available Teammates</h4>
          <div className="flex flex-wrap gap-2">
            {teamMembers
              .filter(member => member.id !== currentUserId)
              .map(member => (
                <div key={member.id} className="flex items-center gap-2 px-3 py-2 border rounded-lg">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{member.name || 'Unknown Teammate'}</span>
                  <Badge 
                    variant={
                      member.currentWorkload === 'heavy' ? 'destructive' : 
                      member.currentWorkload === 'balanced' ? 'secondary' : 'default'
                    }
                    className="text-xs"
                  >
                    {member.currentWorkload || 'light'}
                  </Badge>
                </div>
              ))
            }
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
          {messages
            .filter(message => message.taskId === taskId)
            .map(message => (
              <div key={message.id} className={`flex gap-3 ${message.senderId === currentUserId ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(message.senderName)}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 ${message.senderId === currentUserId ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{message.senderName}</span>
                    <Badge className={`text-xs ${getMessageTypeColor(message.type)}`}>
                      {message.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm bg-gray-50 rounded-lg p-3">{message.message}</p>
                </div>
              </div>
            ))
          }
          {messages.filter(message => message.taskId === taskId).length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation with your team</p>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={messageType === 'question' ? 'default' : 'outline'}
              onClick={() => setMessageType('question')}
            >
              Question
            </Button>
            <Button
              size="sm"
              variant={messageType === 'help' ? 'default' : 'outline'}
              onClick={() => setMessageType('help')}
            >
              Help Needed
            </Button>
            <Button
              size="sm"
              variant={messageType === 'update' ? 'default' : 'outline'}
              onClick={() => setMessageType('update')}
            >
              Update
            </Button>
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder={`Type your ${messageType} message...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              rows={2}
            />
            <Button onClick={handleSendMessage} className="self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};