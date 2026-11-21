import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const initialForm = { name: '', email: '', password: '' }
const noteColors = ['#f5f3ff', '#fef3c7', '#dcfce7', '#dbeafe', '#fee2e2', '#fce7f3']
const noteCategories = ['General', 'Work', 'Ideas', 'Personal', 'Study', 'Quick']
const notePhotos = [
  { src: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80', alt: 'Soft pink flowers in a bouquet' },
  { src: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=80', alt: 'Sunlight falling across green leaves' },
  { src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', alt: 'Dreamy mountain landscape' },
  { src: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80', alt: 'Colorful fresh ingredients' },
  { src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80', alt: 'Starry night over a mountain' },
  { src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80', alt: 'A bright, cozy workspace' }
]
const noteFilters = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'private', label: 'Private' },
  { key: 'archive', label: 'Archive' },
  { key: 'trash', label: 'Trash' }
]

const emptyDraft = {
  title: '',
  content: '',
  color: noteColors[0],
  category: 'General',
  isPinned: false,
  isFavorite: false,
  isPrivate: false,
  privatePassword: '',
  status: 'inbox'
}

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return await response.json()
  }
  return await response.text()
}

function App() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [notes, setNotes] = useState([])
  const [showComposer, setShowComposer] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [savingNote, setSavingNote] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeFilter, setActiveFilter] = useState('inbox')
  const [selectedNote, setSelectedNote] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [notePasswordInput, setNotePasswordInput] = useState('')
  const [noteToUnlock, setNoteToUnlock] = useState(null)
  const [editingNoteId, setEditingNoteId] = useState(null)

  const resetComposer = () => {
    setShowComposer(false)
    setEditingNoteId(null)
    setDraft({ ...emptyDraft })
  }

  const openEditNote = (note) => {
    setEditingNoteId(note._id)
    setDraft({
      title: note.title || '',
      content: note.content || '',
      color: note.color || noteColors[0],
      category: note.category || 'General',
      isPinned: Boolean(note.isPinned),
      isFavorite: Boolean(note.isFavorite),
      isPrivate: Boolean(note.isPrivate),
      privatePassword: note.privatePassword || '',
      status: note.status || 'inbox'
    })
    setShowComposer(true)
    setMessage('')
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const switchMode = (nextMode) => {
    setMode(nextMode)
    setMessage('')
    setForm(initialForm)
  }

  const openDashboardAfterLogin = async (nextToken, nextUser = null) => {
    localStorage.setItem('token', nextToken)
    setToken(nextToken)
    setUser(nextUser)

    try {
      const dashboardResponse = await fetch('/dashboard', {
        headers: { Authorization: `Bearer ${nextToken}` }
      })

      if (dashboardResponse.ok) {
        const dashboardData = await parseResponse(dashboardResponse)
        if (dashboardData && dashboardData.user) {
          setUser(dashboardData.user)
        }
      }

      const notesResponse = await fetch(`/user/notes?filter=${activeFilter || 'inbox'}`, {
        headers: { Authorization: `Bearer ${nextToken}` }
      })

      if (notesResponse.ok) {
        const notesData = await parseResponse(notesResponse)
        if (Array.isArray(notesData)) {
          setNotes(notesData)
        }
      }
    } catch (error) {
      setUser(nextUser)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const endpoint = mode === 'register' ? '/user/register' : '/user/login'
      const payload = mode === 'register'
        ? form
        : { email: form.email, password: form.password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await parseResponse(response)

      if (mode === 'login' && typeof data === 'object' && data.token) {
        const userFromLogin = {
          name: data.user?.name || form.email.split('@')[0],
          email: form.email,
        }

        await openDashboardAfterLogin(data.token, userFromLogin)
        setMessage(data.msg || 'Login Successfully')
      } else {
        setMessage(typeof data === 'string' ? data : (data.msg || 'Something went wrong'))
        if (mode === 'register' && typeof data === 'string' && data.toLowerCase().includes('success')) {
          setTimeout(() => switchMode('login'), 900)
        }
      }
    } catch (error) {
      setMessage('Unable to connect to the server. Make sure the backend is running on port 8080.')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    try {
      const response = await fetch('/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Dashboard request failed')
      }

      const data = await parseResponse(response)
      if (data && data.user) {
        setUser(data.user)
      }
    } catch (error) {
      setUser(null)
    }
  }

  const loadNotes = async (filter = activeFilter) => {
    try {
      const response = await fetch(`/user/notes?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to load notes')
      }

      const data = await parseResponse(response)
      const noteList = Array.isArray(data) ? data : []
      setNotes(noteList)
    } catch (error) {
      setNotes([])
    }
  }

  const handleCreateNote = async (e) => {
    e.preventDefault()

    if (!draft.title.trim() && !draft.content.trim()) {
      setMessage('Write a note title or some content before saving.')
      return
    }

    if (draft.isPrivate && !draft.privatePassword.trim()) {
      setMessage('Private notes need a password to unlock.')
      return
    }

    setSavingNote(true)

    try {
      const payload = {
        title: draft.title,
        content: draft.content,
        color: draft.color,
        category: draft.category,
        isPinned: draft.isPinned,
        isFavorite: draft.isFavorite,
        isPrivate: draft.isPrivate,
        privatePassword: draft.privatePassword,
        status: draft.status
      }

      let response
      let data

      if (editingNoteId) {
        response = await fetch(`/user/notes/${editingNoteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })

        data = await parseResponse(response)

        if (!response.ok) {
          throw new Error(typeof data === 'string' ? data : (data.msg || 'Unable to update note'))
        }

        setNotes((currentNotes) => currentNotes.map((note) => note._id === editingNoteId ? data : note))
        setSelectedNote((current) => (current && current._id === editingNoteId ? data : current))
        setMessage('Note updated successfully')
      } else {
        response = await fetch('/user/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })

        data = await parseResponse(response)

        if (!response.ok) {
          throw new Error(typeof data === 'string' ? data : (data.msg || 'Unable to create note'))
        }

        setNotes((currentNotes) => [data, ...currentNotes])
        setMessage('New note created successfully')
      }

      resetComposer()
      loadNotes(activeFilter)
    } catch (error) {
      setMessage(error.message || 'Unable to save note')
    } finally {
      setSavingNote(false)
    }
  }

  const updateNote = async (noteId, updates) => {
    try {
      const response = await fetch(`/user/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      const data = await parseResponse(response)
      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : (data.msg || 'Unable to update note'))
      }

      setNotes((currentNotes) => currentNotes.map((note) => note._id === noteId ? data : note))
      setSelectedNote((current) => (current && current._id === noteId ? data : current))
      return data
    } catch (error) {
      setMessage(error.message || 'Unable to update note')
      return null
    }
  }

  const handleToggleFavorite = async (noteId, isFavorite) => {
    await updateNote(noteId, { isFavorite: !isFavorite })
    loadNotes(activeFilter)
  }

  const handleMoveToStatus = async (noteId, status) => {
    await updateNote(noteId, { status })
    loadNotes(activeFilter)
  }

  const handleOpenNote = async (note) => {
    if (!note.isPrivate) {
      setSelectedNote(note)
      return
    }

    setSelectedNote(null)
    setNoteToUnlock(note)
    setNotePasswordInput('')
    setShowPasswordModal(true)
  }

  const confirmUnlockNote = async () => {
    if (!noteToUnlock) return

    if (!notePasswordInput.trim()) {
      setMessage('Private note locked. Password required.')
      return
    }

    try {
      const response = await fetch(`/user/notes/${noteToUnlock._id}/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: notePasswordInput })
      })

      const data = await parseResponse(response)
      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : (data.msg || 'Wrong password'))
      }

      setSelectedNote(data)
      setMessage('Private note unlocked')
      setShowPasswordModal(false)
      setNoteToUnlock(null)
      setNotePasswordInput('')
    } catch (error) {
      setMessage(error.message || 'Wrong password')
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      const response = await fetch(`/user/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await parseResponse(response)
      if (!response.ok) {
        throw new Error(typeof data === 'string' ? data : (data.msg || 'Unable to delete note'))
      }

      setNotes((currentNotes) => currentNotes.filter((note) => note._id !== noteId))
      setSelectedNote(null)
      setMessage('Note deleted')
    } catch (error) {
      setMessage(error.message || 'Unable to delete note')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken('')
    setUser(null)
    setNotes([])
    setSelectedNote(null)
    setNoteToUnlock(null)
    setShowPasswordModal(false)
    setNotePasswordInput('')
    setMode('login')
    setForm(initialForm)
    setDraft({ ...emptyDraft })
    setEditingNoteId(null)
    setMessage('')
    setShowComposer(false)
  }

  const noteCount = useMemo(() => notes.length, [notes])
  const favoriteCount = useMemo(() => notes.filter((note) => note.isFavorite).length, [notes])
  const privateCount = useMemo(() => notes.filter((note) => note.isPrivate).length, [notes])

  useEffect(() => {
    if (!token) return

    loadDashboard()
    loadNotes(activeFilter)
  }, [token])

  useEffect(() => {
    if (token) {
      loadNotes(activeFilter)
    }
  }, [activeFilter, token])

  if (token) {
    return (
      <div className="app-shell dashboard-shell">
        <header className="topbar">
          <div className="brand"><span className="brand-mark">N</span><span>NoteFlow</span></div>
          <div className="topbar-actions">
            <span className="user-pill">{user?.name || 'User'}</span>
            <button className="ghost-btn" onClick={logout}>Log out</button>
          </div>
        </header>

        <main className="dashboard">
          <section className="welcome-card noted-card">
            <div>
              <span className="eyebrow">PRIVATE WORKSPACE</span>
              <h1>Your notes dashboard.</h1>
              <p>Organize ideas, mark favorites, secure private notes, and keep your workspace clean with inbox, archive, and trash.</p>
              <div className="dashboard-actions">
                <button className="primary-btn" onClick={() => {
                  if (editingNoteId) {
                    resetComposer()
                    return
                  }
                  setShowComposer((value) => !value)
                }}>
                  {showComposer ? 'Close composer' : 'Add new note'}
                </button>
              </div>
              {message && <div className="status info">{message}</div>}
            </div>
            <div className="dashboard-summary">
              <div className="summary-box">
                <span>Total notes</span>
                <strong>{noteCount}</strong>
              </div>
              <div className="summary-box">
                <span>Favorites</span>
                <strong>{favoriteCount}</strong>
              </div>
              <div className="summary-box">
                <span>Private</span>
                <strong>{privateCount}</strong>
              </div>
            </div>
          </section>

          <nav className="filter-bar" aria-label="Note filters">
            {noteFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`filter-chip ${activeFilter === filter.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </nav>

          {showComposer && (
            <section className="composer-panel">
              <form onSubmit={handleCreateNote} className="note-form">
                <div className="form-header-row">
                  <h2>{editingNoteId ? 'Edit note' : 'Write a note'}</h2>
                  <button type="button" className="secondary-btn small-btn" onClick={resetComposer}>Cancel</button>
                </div>

                <div className="tool-row">
                  <div className="color-row">
                    {noteColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-swatch ${draft.color === color ? 'selected' : ''}`}
                        style={{ background: color }}
                        onClick={() => setDraft({ ...draft, color })}
                        aria-label="Choose note color"
                      />
                    ))}
                  </div>

                  <label className="checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={draft.isPinned}
                      onChange={(e) => setDraft({ ...draft, isPinned: e.target.checked })}
                    />
                    <span>Pinned</span>
                  </label>

                  <label className="checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={draft.isFavorite}
                      onChange={(e) => setDraft({ ...draft, isFavorite: e.target.checked })}
                    />
                    <span>Favorite</span>
                  </label>
                </div>

                <div className="split-row">
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Note title"
                    className="note-input"
                  />

                  <select
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    className="category-select"
                  >
                    {noteCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="private-row">
                  <label className="checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={draft.isPrivate}
                      onChange={(e) => setDraft({ ...draft, isPrivate: e.target.checked, privatePassword: e.target.checked ? draft.privatePassword : '' })}
                    />
                    <span>Private note</span>
                  </label>

                  {draft.isPrivate && (
                    <input
                      type="password"
                      value={draft.privatePassword}
                      onChange={(e) => setDraft({ ...draft, privatePassword: e.target.value })}
                      placeholder="Password required to open"
                      className="private-password-input"
                    />
                  )}
                </div>

                <textarea
                  value={draft.content}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  placeholder="Write your note here..."
                  className="note-textarea"
                  rows="6"
                />

                <button className="primary-btn submit-btn" disabled={savingNote} type="submit">
                  {savingNote ? (editingNoteId ? 'Updating...' : 'Saving...') : (editingNoteId ? 'Update note' : 'Save note')}
                </button>
              </form>
            </section>
          )}

          <section className="notes-grid">
            {notes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✎</div>
                <h3>No notes in this section</h3>
                <p>Create a new note or switch filters to see more.</p>
              </div>
            ) : (
              notes.map((note, index) => {
                const photoIndex = (noteCategories.indexOf(note.category) + note.title?.length + index || index) % notePhotos.length
                const photo = notePhotos[Math.abs(photoIndex)]

                return (
                <article key={note._id} className="note-card" style={{ background: note.color || '#f5f3ff', '--note-index': index }}>
                  <div className="note-photo">
                    <img src={photo.src} alt={photo.alt} loading="lazy" />
                    <span aria-hidden="true">✦</span>
                  </div>
                  <div className="note-card-top">
                    <span className="note-tag">{note.isPinned ? 'Pinned' : (note.category || 'General')}</span>
                    <div className="note-actions-row">
                      {note.isPrivate && <span className="mini-lock">🔒</span>}
                      {note.isFavorite && <span className="mini-fav">★</span>}
                    </div>
                  </div>

                  <h3>{note.title || 'Untitled note'}</h3>
                  <p>{note.isPrivate ? 'This is a private note. Unlock to view content.' : (note.content || 'No content added yet.')}</p>

                  <div className="meta-row">
                    <span>{note.category || 'General'}</span>
                    <span>{note.isPrivate ? 'Private' : 'Public'}</span>
                  </div>

                  <div className="card-actions">
                    <button type="button" className="mini-btn" onClick={() => handleOpenNote(note)}>{note.isPrivate ? 'Unlock' : 'Open'}</button>
                    <button type="button" className="mini-btn" onClick={() => openEditNote(note)}>Edit</button>
                    <button type="button" className="mini-btn" onClick={() => handleToggleFavorite(note._id, note.isFavorite)}>{note.isFavorite ? 'Unfavorite' : 'Favorite'}</button>
                    <button type="button" className="mini-btn" onClick={() => handleMoveToStatus(note._id, note.status === 'archive' ? 'inbox' : 'archive')}>{note.status === 'archive' ? 'Restore' : 'Archive'}</button>
                    <button type="button" className="mini-btn danger" onClick={() => handleMoveToStatus(note._id, 'trash')}>Trash</button>
                  </div>

                  <small>
                    {new Date(note.updatedAt || note.createdAt || Date.now()).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </small>
                </article>
                )
              })
            )}
          </section>
        </main>

        {selectedNote && (
          <div className="note-overlay" onClick={() => setSelectedNote(null)}>
            <div className="note-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="note-tag modal-tag">{selectedNote.isPinned ? 'Pinned' : (selectedNote.category || 'General')}</span>
                  <h2>{selectedNote.title || 'Untitled note'}</h2>
                </div>
                <button type="button" className="close-btn" onClick={() => setSelectedNote(null)}>×</button>
              </div>

              <div className="modal-meta">
                <span>{selectedNote.isPrivate ? 'Private note' : 'Public note'}</span>
                <span>{selectedNote.isFavorite ? 'Favorite' : 'Normal'}</span>
              </div>

              <p className="modal-content">{selectedNote.content || 'No content added yet.'}</p>

              <div className="modal-footer">
                <button type="button" className="mini-btn" onClick={() => openEditNote(selectedNote)}>Edit</button>
                <button type="button" className="mini-btn" onClick={() => handleToggleFavorite(selectedNote._id, selectedNote.isFavorite)}>{selectedNote.isFavorite ? 'Remove favorite' : 'Add favorite'}</button>
                <button type="button" className="mini-btn" onClick={() => handleMoveToStatus(selectedNote._id, selectedNote.status === 'archive' ? 'inbox' : 'archive')}>{selectedNote.status === 'archive' ? 'Restore' : 'Archive'}</button>
                <button type="button" className="mini-btn danger" onClick={() => handleDeleteNote(selectedNote._id)}>Delete forever</button>
              </div>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="password-modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="password-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Unlock private note</h2>
              <p>This note is locked. Enter the password to unlock and view the content.</p>

              <div className="input-wrap">
                <span>🔑</span>
                <input
                  type="password"
                  value={notePasswordInput}
                  onChange={(e) => setNotePasswordInput(e.target.value)}
                  placeholder="Enter note password"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  className="primary-btn"
                  onClick={confirmUnlockNote}
                >
                  Unlock note
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">N</span><span>NoteFlow</span></div>
        <nav>
          <button className={mode === 'login' ? 'nav-active' : ''} onClick={() => switchMode('login')}>Sign in</button>
          <button className={mode === 'register' ? 'nav-active' : ''} onClick={() => switchMode('register')}>Create account</button>
        </nav>
      </header>

      <main className="auth-layout">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">SIMPLE. SECURE. ORGANIZED.</span>
            <h1>Give your ideas a <span>beautiful home.</span></h1>
            <p>A clean note-taking app with user accounts, protected notes, favorites, archive, and trash buckets.</p>
          </div>
          <div className="visual-board">
            <div className="glow glow-one"></div><div className="glow glow-two"></div>
            <div className="floating-card card-main"><div className="card-top"><span className="dot"></span><span>Today</span></div><h3>Make space for what matters.</h3><p>Capture your thoughts and stay focused.</p><div className="progress"><i></i></div></div>
            <div className="floating-card card-small"><div className="small-check">✓</div><div><b>All set</b><small>Stay in sync</small></div></div>
            <div className="floating-pill">✦ Your private workspace</div>
          </div>
          <div className="hero-footer"><span>●</span> Built around your secure login system and note storage</div>
        </section>

        <section className="form-panel">
          <div className="form-wrap">
            <div className="form-heading"><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</span><h2>{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</h2><p>{mode === 'login' ? 'Access your personal notes dashboard.' : 'Register and start saving your ideas.'}</p></div>

            <form onSubmit={handleSubmit}>
              {mode === 'register' && <label>Full name<div className="input-wrap"><span>◉</span><input name="name" value={form.name} onChange={handleChange} placeholder="Enter your name" required /></div></label>}
              <label>Email address<div className="input-wrap"><span>@</span><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="name@example.com" required /></div></label>
              <label>Password<div className="input-wrap"><span>⌁</span><input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" required /><button type="button" className="show-pass" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
              {message && <div className={`status ${message.toLowerCase().includes('success') ? 'success' : 'error'}`}>{message}</div>}
              <button className="primary-btn submit-btn" disabled={loading}>{loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
            </form>

            <div className="switch-copy">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create one' : 'Sign in'}</button></div>
            <p className="backend-note">Connected to: <code>/user/register</code> · <code>/user/login</code> · <code>/dashboard</code></p>
          </div>
        </section>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
