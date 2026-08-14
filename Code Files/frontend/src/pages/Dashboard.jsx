import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  
  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/contacts/');
      setContacts(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.phone?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query)
    );
  });

  // Group contacts by first letter
  const groupedContacts = {};
  filteredContacts.forEach((contact) => {
    const firstLetter = contact.name ? contact.name[0].toUpperCase() : '#';
    if (!groupedContacts[firstLetter]) {
      groupedContacts[firstLetter] = [];
    }
    groupedContacts[firstLetter].push(contact);
  });

  // Sort keys alphabetically
  const alphabetKeys = Object.keys(groupedContacts).sort();

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // Set up adding form
  const handleStartAdd = () => {
    setIsAdding(true);
    setIsEditing(false);
    setSelectedContact(null);
    setFormData({ name: '', email: '', phone: '', company: '' });
    setError('');
  };

  // Set up editing form
  const handleStartEdit = () => {
    if (!selectedContact) return;
    setIsEditing(true);
    setIsAdding(false);
    setFormData({
      name: selectedContact.name || '',
      email: selectedContact.email || '',
      phone: selectedContact.phone || '',
      company: selectedContact.company || ''
    });
    setError('');
  };

  // Select contact
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setIsAdding(false);
    setIsEditing(false);
    setError('');
  };

  // Cancel edit/add form
  const handleCancelForm = () => {
    setIsAdding(false);
    setIsEditing(false);
    setError('');
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save Contact (Create or Update)
  const handleSaveContact = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Contact name is required.');
      return;
    }

    try {
      if (isAdding) {
        const res = await api.post('/api/contacts/', formData);
        setContacts((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedContact(res.data);
        setIsAdding(false);
      } else if (isEditing && selectedContact) {
        const res = await api.put(`/api/contacts/${selectedContact.id}/`, formData);
        setContacts((prev) =>
          prev.map((c) => (c.id === selectedContact.id ? res.data : c)).sort((a, b) => a.name.localeCompare(b.name))
        );
        setSelectedContact(res.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save contact. Please verify the entries.');
    }
  };

  // Delete Contact
  const handleDeleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await api.delete(`/api/contacts/${id}/`);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setSelectedContact(null);
      setIsEditing(false);
      setIsAdding(false);
    } catch (err) {
      console.error(err);
      setError('Failed to delete contact.');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar - Left panel */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#818cf8' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              ContactBook
            </h2>
            <span className="sidebar-user">{user?.username}</span>
          </div>

          <button onClick={handleStartAdd} className="btn-add-contact">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Contact
          </button>

          <div className="search-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Scrollable contact items list */}
        <div className="contacts-list-wrapper">
          {loading && contacts.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }}></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="no-contacts-state">
              <p>No contacts saved yet.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px', color: '#4b5563' }}>Click "Add Contact" above to start.</p>
            </div>
          ) : alphabetKeys.length === 0 ? (
            <div className="no-contacts-state">
              <p>No matches found.</p>
            </div>
          ) : (
            alphabetKeys.map((letter) => (
              <div key={letter} className="alphabet-group">
                <div className="alphabet-label">{letter}</div>
                <div className="contact-items">
                  {groupedContacts[letter].map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className={`contact-item-card ${selectedContact?.id === contact.id ? 'active' : ''}`}
                    >
                      <div className="contact-item-avatar">
                        {getInitials(contact.name)}
                      </div>
                      <div className="contact-item-info">
                        <div className="contact-item-name">{contact.name}</div>
                        <div className="contact-item-company">
                          {contact.company || 'No Company'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <button onClick={logout} className="btn-logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area - Right panel */}
      <main className="main-content">
        {/* Placeholder mode when nothing selected */}
        {!selectedContact && !isAdding && !isEditing && (
          <div className="placeholder-view">
            <div className="placeholder-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h3>Mini Private Contact Book</h3>
            <p>Select a contact from the alphabetized list on the left to view full details, or add a new professional or personal contact.</p>
          </div>
        )}

        {/* Detail view of a selected contact */}
        {selectedContact && !isEditing && !isAdding && (
          <div className="detail-card">
            <div className="detail-header">
              <div className="detail-avatar-glow">
                {getInitials(selectedContact.name)}
              </div>
              <h2 className="detail-name">{selectedContact.name}</h2>
              <span className="detail-meta-pill">Professional Connection</span>
            </div>

            <div className="detail-body">
              <div className="detail-row">
                <div className="detail-row-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div className="detail-row-content">
                  <div className="detail-row-label">Email Address</div>
                  <div className="detail-row-value">
                    {selectedContact.email || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>No email provided</span>}
                  </div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-row-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div className="detail-row-content">
                  <div className="detail-row-label">Phone Number</div>
                  <div className="detail-row-value">
                    {selectedContact.phone || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>No phone number provided</span>}
                  </div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-row-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div className="detail-row-content">
                  <div className="detail-row-label">Company / Affiliation</div>
                  <div className="detail-row-value">
                    {selectedContact.company || <span style={{ color: '#4b5563', fontStyle: 'italic' }}>No affiliation provided</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-actions">
              <button onClick={handleStartEdit} className="btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button onClick={() => handleDeleteContact(selectedContact.id)} className="btn-danger">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Editor Form (Add or Edit) */}
        {(isAdding || isEditing) && (
          <div className="editor-card">
            <h3>{isAdding ? 'Create Contact' : 'Edit Contact'}</h3>
            
            {error && <div className="auth-error">{error}</div>}
            
            <form onSubmit={handleSaveContact}>
              <div className="form-group">
                <label htmlFor="contact-name">Full Name</label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  className="input-field"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-email">Email Address</label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  className="input-field"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-phone">Phone Number</label>
                <input
                  type="text"
                  id="contact-phone"
                  name="phone"
                  className="input-field"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-company">Company</label>
                <input
                  type="text"
                  id="contact-company"
                  name="company"
                  className="input-field"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Acme Corp"
                />
              </div>

              <div className="editor-actions">
                <button type="button" onClick={handleCancelForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
