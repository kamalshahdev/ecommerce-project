import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import './AdminPages.css';

const emptyForm = {
  name: '',
  description: '',
  category: '',
  brand: '',
  tags: '',
  price: '',
  stock: '',
  imageUrl: ''
};

function normalizePayload(form) {
  const tags = (form.tags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  return {
    name: (form.name || '').trim(),
    description: (form.description || '').trim(),
    category: (form.category || '').trim(),
    brand: (form.brand || '').trim(),
    tags,
    price: Number(form.price) || 0,
    stock: Number(form.stock) || 0,
    imageUrl: (form.imageUrl || '').trim()
  };
}

export default function AdminProducts() {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [customCategory, setCustomCategory] = useState(false);

  const formatPKR = (value) => {
    try {
      return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(value || 0);
    } catch {
      return `PKR ${value || 0}`;
    }
  };

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase().trim();
    if (!q) return products;
    return products.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.get(`${API_URL}/api/products`, { params: { limit: 200, page: 1, sort: '-createdAt' } });
      setProducts(res.data.products || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      setCategories(res.data || []);
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setCustomCategory(false);
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (p) => {
    setEditing(p);
    // Check if category exists in known categories
    const categoryExists = categories.some(c => c.name === p.category);
    setCustomCategory(!categoryExists);
    setForm({
      name: p.name || '',
      description: p.description || '',
      category: p.category || '',
      brand: p.brand || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      price: p.price ?? '',
      stock: p.stock ?? '',
      imageUrl: p.imageUrl || ''
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const payload = normalizePayload(form);
    try {
      if (editing?._id) {
        await axios.put(`${API_URL}/api/products/${editing._id}`, payload);
        setSuccess('Product updated.');
      } else {
        await axios.post(`${API_URL}/api/products`, payload);
        setSuccess('Product created.');
      }
      closeModal();
      await fetchProducts();
    } catch (e2) {
      setError(e2.response?.data?.message || 'Failed to save product. Make sure you are logged in as admin.');
    }
  };

  const deleteProduct = async (p) => {
    const ok = window.confirm(`Delete "${p.name}"?`);
    if (!ok) return;

    setError('');
    setSuccess('');
    try {
      await axios.delete(`${API_URL}/api/products/${p._id}`);
      setSuccess('Product deleted.');
      await fetchProducts();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete product. Make sure you are logged in as admin.');
    }
  };

  return (
    <AdminLayout
      title="Products"
      actions={<button className="admin-btn" onClick={openCreate}>+ Add Product</button>}
    >
      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-toolbar">
        <input
          className="admin-input"
          placeholder="Search by name/category/brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="admin-btn admin-btn-ghost" onClick={fetchProducts} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Stock</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p._id}>
                <td>
                  <div className="admin-prod">
                    <img className="admin-prod-img" src={p.imageUrl} alt="" />
                    <div>
                      <div className="admin-prod-name">{p.name}</div>
                      <div className="admin-prod-id">{p._id}</div>
                    </div>
                  </div>
                </td>
                <td>{p.category}</td>
                <td>{p.brand}</td>
                <td>{formatPKR(p.price)}</td>
                <td>{p.stock}</td>
                <td>
                  <div className="admin-row-actions">
                    <button className="admin-btn admin-btn-ghost" onClick={() => openEdit(p)}>Edit</button>
                    <button className="admin-btn admin-btn-danger" onClick={() => deleteProduct(p)}>Delete</button>
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
              <h2 className="admin-modal-title">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className="admin-btn admin-btn-ghost" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={saveProduct} className="admin-form">
              <label>
                Name
                <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>

              <label>
                Category
                {customCategory ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="admin-input"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Enter new category name"
                      required
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      onClick={() => { setCustomCategory(false); setForm({ ...form, category: '' }); }}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      ← Back
                    </button>
                  </div>
                ) : (
                  <select
                    className="admin-input"
                    value={form.category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setCustomCategory(true);
                        setForm({ ...form, category: '' });
                      } else {
                        setForm({ ...form, category: e.target.value });
                      }
                    }}
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="__custom__">+ Add New Category</option>
                  </select>
                )}
              </label>

              <label>
                Brand
                <input className="admin-input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </label>

              <label>
                Price (PKR)
                <input className="admin-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </label>

              <label>
                Stock
                <input className="admin-input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Image URL
                <input className="admin-input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Tags (comma separated)
                <input className="admin-input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Description
                <textarea className="admin-input admin-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
