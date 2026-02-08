import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './AdminPages.css';

const emptyForm = {
    name: '',
    imageUrl: '',
    description: ''
};

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const fetchCategories = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`${API_URL}/api/categories`);
            setCategories(res.data);
        } catch (err) {
            setError('Failed to load categories');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const openEdit = (cat) => {
        setEditing(cat);
        setForm({
            name: cat.name || '',
            imageUrl: cat.imageUrl || '',
            description: cat.description || ''
        });
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const saveCategory = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            if (editing?._id) {
                await axios.put(`${API_URL}/api/categories/${editing._id}`, form, config);
                setSuccess('Category updated.');
            } else {
                await axios.post(`${API_URL}/api/categories`, form, config);
                setSuccess('Category created.');
            }
            closeModal();
            await fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save category.');
        }
    };

    const deleteCategory = async (cat) => {
        if (!window.confirm(`Delete "${cat.name}"? Products in this category will NOT be deleted.`)) return;

        setError('');
        setSuccess('');
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            await axios.delete(`${API_URL}/api/categories/${cat._id}`, config);
            setSuccess('Category deleted.');
            await fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete category.');
        }
    };

    return (
        <AdminLayout
            title="Categories"
            actions={<button className="admin-btn" onClick={openCreate}>+ Add Category</button>}
        >
            {error && <div className="admin-error">{error}</div>}
            {success && <div className="admin-success">{success}</div>}

            <div className="admin-toolbar">
                <span>{categories.length} Categories</span>
                <button className="admin-btn admin-btn-ghost" onClick={fetchCategories} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Description</th>
                            <th style={{ width: 180 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat._id}>
                                <td>
                                    <div className="admin-prod">
                                        <img
                                            className="admin-prod-img"
                                            src={cat.imageUrl}
                                            alt={cat.name}
                                            style={{ borderRadius: '8px' }}
                                        />
                                        <div>
                                            <div className="admin-prod-name">{cat.name}</div>
                                            <div className="admin-prod-id">{cat._id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{cat.description || '-'}</td>
                                <td>
                                    <div className="admin-row-actions">
                                        <button className="admin-btn admin-btn-ghost" onClick={() => openEdit(cat)}>Edit</button>
                                        <button className="admin-btn admin-btn-danger" onClick={() => deleteCategory(cat)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="admin-modal-backdrop" onClick={closeModal}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2 className="admin-modal-title">{editing ? 'Edit Category' : 'Add Category'}</h2>
                            <button className="admin-btn admin-btn-ghost" onClick={closeModal}>✕</button>
                        </div>

                        <form onSubmit={saveCategory} className="admin-form">
                            <label>
                                Name
                                <input
                                    className="admin-input"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </label>

                            <label style={{ gridColumn: '1 / -1' }}>
                                Image URL
                                <input
                                    className="admin-input"
                                    value={form.imageUrl}
                                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                                    placeholder="https://images.unsplash.com/..."
                                    required
                                />
                            </label>

                            {form.imageUrl && (
                                <div style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Preview:</p>
                                    <img
                                        src={form.imageUrl}
                                        alt="Preview"
                                        style={{ maxWidth: '200px', maxHeight: '120px', borderRadius: '8px', objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                            )}

                            <label style={{ gridColumn: '1 / -1' }}>
                                Description
                                <textarea
                                    className="admin-input admin-textarea"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief description of this category"
                                />
                            </label>

                            <div className="admin-form-actions" style={{ gridColumn: '1 / -1' }}>
                                <button type="button" className="admin-btn admin-btn-ghost" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="admin-btn">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
