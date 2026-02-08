import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './AdminPages.css';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { user: currentUser } = useAuth();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_URL}/api/users`, config);
            setUsers(res.data);
        } catch (err) {
            setError('Failed to fetch users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                await axios.delete(`${API_URL}/api/users/${id}`, config);
                setSuccess('User deleted successfully');
                setUsers(users.filter(u => u._id !== id));
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError('Failed to delete user');
                console.error(err);
            }
        }
    };

    return (
        <AdminLayout title="Manage Users">
            {error && <div className="admin-error">{error}</div>}
            {success && <div className="admin-success">{success}</div>}

            <div className="admin-card">
                <div className="admin-header">
                    <h3>Registered Users ({users.length})</h3>
                    <button className="admin-btn admin-btn-ghost" onClick={fetchUsers}>Refresh</button>
                </div>

                {loading ? (
                    <div>Loading users...</div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td className="admin-prod-id">{user._id.substring(user._id.length - 6)}</td>
                                        <td>
                                            <div className="admin-user-name">{user.name}</div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                background: user.role === 'admin' ? '#e0e7ff' : '#f1f5f9',
                                                color: user.role === 'admin' ? '#4338ca' : '#475569',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="admin-row-actions">
                                                <button
                                                    className="admin-btn danger"
                                                    onClick={() => handleDelete(user._id)}
                                                    disabled={user._id === currentUser._id || user.email === 'admin@sagestudio.com'}
                                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
