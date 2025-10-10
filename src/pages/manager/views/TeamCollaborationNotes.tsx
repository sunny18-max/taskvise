import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare,
  Pin,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User
} from 'lucide-react';

interface TeamNote {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  isPinned: boolean;
  priority: 'low' | 'medium' | 'high';
  visibleTo: string[]; // Team member IDs
}

interface TeamMember {
  id: string;
  fullName: string;
  role: string;
}

interface TeamCollaborationNotesProps {
  teamMembers: TeamMember[];
  currentUser: any;
}

export const TeamCollaborationNotes = ({ teamMembers, currentUser }: TeamCollaborationNotesProps) => {
  const [notes, setNotes] = useState<TeamNote[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<TeamNote | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Load notes from localStorage (in real app, this would be from API)
  useEffect(() => {
    const savedNotes = localStorage.getItem('team-collaboration-notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('team-collaboration-notes', JSON.stringify(notes));
  }, [notes]);

  const handleCreateNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note: TeamNote = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      author: currentUser?.displayName || 'Manager',
      authorId: currentUser?.uid || 'manager',
      createdAt: new Date().toISOString(),
      isPinned: false,
      priority: newNote.priority,
      visibleTo: teamMembers.map(member => member.id) // Visible to all team members
    };

    setNotes(prev => [note, ...prev]);
    setNewNote({ title: '', content: '', priority: 'medium' });
    setIsEditing(false);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !newNote.title.trim() || !newNote.content.trim()) return;

    setNotes(prev => prev.map(note =>
      note.id === editingNote.id
        ? {
            ...note,
            title: newNote.title,
            content: newNote.content,
            priority: newNote.priority,
            updatedAt: new Date().toISOString()
          }
        : note
    ));

    setEditingNote(null);
    setNewNote({ title: '', content: '', priority: 'medium' });
    setIsEditing(false);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handlePinNote = (noteId: string) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId
        ? { ...note, isPinned: !note.isPinned }
        : note
    ));
  };

  const startEditing = (note: TeamNote) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      priority: note.priority
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setNewNote({ title: '', content: '', priority: 'medium' });
    setIsEditing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort notes: pinned first, then by creation date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Collaboration Notes</h2>
          <p className="text-gray-600 mt-1">
            Share instructions, updates, and important information with your team
          </p>
        </div>
        <Button 
          onClick={() => setIsEditing(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create/Edit Note Form */}
        {(isEditing || editingNote) && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </CardTitle>
              <CardDescription>
                {editingNote 
                  ? 'Update your note for the team' 
                  : 'Share important information with your entire team'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter note title..."
                  className="w-full p-2 border rounded-md mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Priority</label>
                <div className="flex gap-2 mt-1">
                  {(['low', 'medium', 'high'] as const).map(priority => (
                    <Button
                      key={priority}
                      type="button"
                      variant={newNote.priority === priority ? 'default' : 'outline'}
                      onClick={() => setNewNote(prev => ({ ...prev, priority }))}
                      className="capitalize"
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your message for the team..."
                  className="min-h-[120px] mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={editingNote ? handleUpdateNote : handleCreateNote}
                  disabled={!newNote.title.trim() || !newNote.content.trim()}
                >
                  {editingNote ? 'Update Note' : 'Create Note'}
                </Button>
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes List */}
        <div className="lg:col-span-2 space-y-4">
          {sortedNotes.length > 0 ? (
            sortedNotes.map(note => (
              <Card key={note.id} className={note.isPinned ? 'border-yellow-300 bg-yellow-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{note.title}</h3>
                      {note.isPinned && <Pin className="h-4 w-4 text-yellow-600 fill-yellow-600" />}
                      <Badge className={getPriorityColor(note.priority)}>
                        {note.priority}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePinNote(note.id)}
                      >
                        <Pin className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{note.content}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{note.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                        {note.updatedAt && <span>(edited)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>Visible to {teamMembers.length} team members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notes Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first note to share information with your team
                </p>
                <Button onClick={() => setIsEditing(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create First Note
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Notes Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{notes.length}</div>
              <div className="text-sm text-gray-600">Total Notes</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {notes.filter(n => n.isPinned).length}
              </div>
              <div className="text-sm text-gray-600">Pinned Notes</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {notes.filter(n => n.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-600">High Priority</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium mb-2">Team Visibility</div>
              <div className="text-xs text-gray-600">
                All notes are visible to {teamMembers.length} team members
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};