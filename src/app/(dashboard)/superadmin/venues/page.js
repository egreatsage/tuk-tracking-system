'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function VenueManagement() {
  const [venues, setVenues] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: 50,
  });

  const [rooms, setRooms] = useState([{ name: '', capacity: '' }]);

  const fetchVenues = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/venues');
      if (res.ok) {
        const data = await res.json();
        setVenues(data);
      }
    } catch (error) {
      console.error('Failed to fetch venues', error);
    }
    setFetching(false);
  };

  useEffect(() => { fetchVenues(); }, []);

  const grabCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    navigator.geolocation.getCurrentPosition((pos) => {
      setFormData((prev) => ({
        ...prev,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }));
    });
  };

  const addRoomField = () => setRooms([...rooms, { name: '', capacity: '' }]);

  const updateRoom = (index, field, value) => {
    const newRooms = [...rooms];
    newRooms[index][field] = value;
    setRooms(newRooms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const validRooms = rooms.filter((r) => r.name.trim() !== '');
    const url = editingId ? `/api/venues/${editingId}` : '/api/venues';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, rooms: validRooms }),
    });
    if (res.ok) {
      toast.success(editingId ? 'Venue updated!' : 'Block and Rooms added successfully!');
      setFormData({ name: '', latitude: '', longitude: '', radius: 50 });
      setRooms([{ name: '', capacity: '' }]);
      setEditingId(null);
      fetchVenues();
    } else {
      toast.error('Error saving venue');
    }
    setLoading(false);
  };

  const handleEdit = (block) => {
    setEditingId(block.id);
    setFormData({ name: block.name, latitude: block.latitude, longitude: block.longitude, radius: block.radius });
    setRooms(block.rooms.length > 0 ? block.rooms : [{ name: '', capacity: '' }]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this block? This will delete all associated rooms.')) return;
    try {
      const res = await fetch(`/api/venues/${id}`, { method: 'DELETE' });
      if (res.ok) fetchVenues();
      else toast.error('Failed to delete venue');
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', latitude: '', longitude: '', radius: 50 });
    setRooms([{ name: '', capacity: '' }]);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        .vm * { box-sizing: border-box; }

        .vm {
          font-family: 'Sora', sans-serif;
          background: #f5f5f3;
          min-height: 100vh;
          padding: 32px 20px 60px;
          color: #1a1a1a;
        }

        .vm-inner {
          max-width: 1280px;
          margin: 0 auto;
        }

        .vm-heading {
          margin-bottom: 28px;
        }
        .vm-heading h1 {
          font-size: 22px;
          font-weight: 700;
          color: #111;
          letter-spacing: -0.02em;
        }
        .vm-heading p {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
          font-family: 'JetBrains Mono', monospace;
        }

        .vm-layout {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .vm-layout { grid-template-columns: 1fr; }
        }

        .vm-card {
          background: #fff;
          border: 1px solid #e4e4e0;
          border-radius: 10px;
          overflow: hidden;
        }
        .vm-card-head {
          padding: 16px 20px;
          border-bottom: 1px solid #ebebea;
        }
        .vm-card-head h2 {
          font-size: 14px;
          font-weight: 700;
          color: #111;
          letter-spacing: -0.01em;
        }
        .vm-card-body { padding: 20px; }

        .vm-field { margin-bottom: 14px; }
        .vm-field label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #999;
          margin-bottom: 6px;
        }

        .vm-input {
          width: 100%;
          background: #fafafa;
          border: 1px solid #e0e0dc;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 13.5px;
          font-family: 'Sora', sans-serif;
          color: #111;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .vm-input::placeholder { color: #bbb; }
        .vm-input:focus {
          border-color: #111;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }

        .vm-coord-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        .vm-loc-btn {
          width: 100%;
          margin-top: 8px;
          background: transparent;
          border: 1px dashed #d0d0cc;
          border-radius: 6px;
          padding: 9px;
          font-size: 12.5px;
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          color: #999;
          cursor: pointer;
          transition: all 0.15s;
        }
        .vm-loc-btn:hover { border-color: #111; color: #111; }

        .vm-rooms-box {
          border: 1px solid #e4e4e0;
          border-radius: 6px;
          background: #fafafa;
          overflow: hidden;
          margin-bottom: 14px;
        }
        .vm-rooms-head {
          padding: 8px 14px;
          background: #f3f3f0;
          border-bottom: 1px solid #e4e4e0;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #aaa;
        }
        .vm-rooms-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .vm-room-row { display: grid; grid-template-columns: 1fr 90px; gap: 8px; }
        .vm-add-room-btn {
          background: none;
          border: none;
          padding: 7px 14px 10px;
          font-size: 11.5px;
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          color: #aaa;
          cursor: pointer;
          transition: color 0.15s;
          text-align: left;
        }
        .vm-add-room-btn:hover { color: #111; }

        .vm-btn-row { display: flex; gap: 8px; }
        .vm-btn {
          flex: 1;
          padding: 11px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-family: 'Sora', sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .vm-btn-save { background: #111; color: #fff; }
        .vm-btn-save:hover:not(:disabled) { background: #333; }
        .vm-btn-save:disabled { background: #e0e0dc; color: #aaa; cursor: not-allowed; }
        .vm-btn-cancel {
          flex: 0 0 auto;
          padding: 11px 15px;
          background: #f3f3f0;
          color: #888;
          border: 1px solid #e4e4e0;
        }
        .vm-btn-cancel:hover { background: #ebebea; color: #444; }

        /* Table */
        .vm-table-scroll { overflow-x: auto; }
        .vm-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .vm-table thead tr { border-bottom: 1px solid #ebebea; }
        .vm-table th {
          padding: 11px 18px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: #bbb;
          text-align: left;
          background: #fafafa;
          white-space: nowrap;
        }
        .vm-table th:last-child { text-align: right; }
        .vm-table tbody tr { border-bottom: 1px solid #f0f0ee; transition: background 0.1s; }
        .vm-table tbody tr:last-child { border-bottom: none; }
        .vm-table tbody tr:hover { background: #fafafa; }
        .vm-table td { padding: 15px 18px; vertical-align: middle; color: #555; }
        .vm-table td:last-child { text-align: right; }

        .vm-block-name { font-weight: 600; font-size: 14px; color: #111; }
        .vm-coords {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #aaa;
          line-height: 1.8;
        }
        .vm-radius-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #ccc;
          margin-top: 2px;
        }

        .vm-room-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .vm-room-tag {
          background: #f3f3f0;
          border: 1px solid #e4e4e0;
          color: #666;
          border-radius: 4px;
          padding: 3px 9px;
          font-size: 11px;
          font-weight: 500;
        }

        .vm-btn-edit {
          background: none;
          border: 1px solid #dbeafe;
          border-radius: 5px;
          padding: 5px 11px;
          font-size: 12px;
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          color: #3b82f6;
          cursor: pointer;
          transition: all 0.15s;
          margin-left: 6px;
        }
        .vm-btn-edit:hover { background: #eff6ff; border-color: #93c5fd; }

        .vm-btn-delete {
          background: none;
          border: 1px solid #fee2e2;
          border-radius: 5px;
          padding: 5px 11px;
          font-size: 12px;
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          color: #ef4444;
          cursor: pointer;
          transition: all 0.15s;
          margin-left: 6px;
        }
        .vm-btn-delete:hover { background: #fef2f2; border-color: #fca5a5; }

        .vm-state { padding: 44px 20px; text-align: center; font-size: 13px; color: #ccc; }

        @media (max-width: 560px) {
          .vm-table thead { display: none; }
          .vm-table, .vm-table tbody, .vm-table tr, .vm-table td { display: block; width: 100%; }
          .vm-table tr { padding: 16px 18px; border-bottom: 1px solid #f0f0ee; }
          .vm-table td { padding: 3px 0; border: none; }
          .vm-table td:last-child { text-align: left; margin-top: 10px; }
        }
      `}</style>

      <div className="vm">
        <div className="vm-inner">

          <div className="vm-heading">
            <h1>Venue Management</h1>
            <p>superadmin / venues</p>
          </div>

          <div className="vm-layout">

            {/* FORM */}
            <div className="vm-card">
              <div className="vm-card-head">
                <h2>{editingId ? 'Edit Venue' : 'Add New Building / Block'}</h2>
              </div>
              <div className="vm-card-body">
                <form onSubmit={handleSubmit}>

                  <div className="vm-field">
                    <label>Block Name</label>
                    <input
                      type="text" className="vm-input"
                      placeholder="Block Name (e.g., Engineering Block)"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="vm-field">
                    <label>Coordinates</label>
                    <div className="vm-coord-row">
                      <input
                        type="number" step="any" className="vm-input" placeholder="Latitude"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        required
                      />
                      <input
                        type="number" step="any" className="vm-input" placeholder="Longitude"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        required
                      />
                    </div>
                    <button type="button" className="vm-loc-btn" onClick={grabCurrentLocation}>
                      📍 Grab Current Location
                    </button>
                  </div>

                  <div className="vm-field">
                    <label>Geofence Radius (meters)</label>
                    <input
                      type="number" className="vm-input"
                      placeholder="Geofence Radius (meters) - Default: 50"
                      value={formData.radius}
                      onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                    />
                  </div>

                  <div className="vm-rooms-box">
                    <div className="vm-rooms-head">Rooms in this Block</div>
                    <div className="vm-rooms-list">
                      {rooms.map((room, index) => (
                        <div className="vm-room-row" key={index}>
                          <input
                            type="text" className="vm-input" placeholder="Room Name"
                            value={room.name}
                            onChange={(e) => updateRoom(index, 'name', e.target.value)}
                            required={index === 0 && !editingId}
                            style={{ fontSize: '13px', padding: '8px 11px' }}
                          />
                          <input
                            type="number" className="vm-input" placeholder="Capacity"
                            value={room.capacity || ''}
                            onChange={(e) => updateRoom(index, 'capacity', e.target.value)}
                            style={{ fontSize: '13px', padding: '8px 11px' }}
                          />
                        </div>
                      ))}
                    </div>
                    <button type="button" className="vm-add-room-btn" onClick={addRoomField}>
                      + Add another room
                    </button>
                  </div>

                  <div className="vm-btn-row">
                    {editingId && (
                      <button type="button" className="vm-btn vm-btn-cancel" onClick={cancelEdit}>
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="vm-btn vm-btn-save" disabled={loading}>
                      {loading ? 'Saving...' : editingId ? 'Update Venue' : 'Save Venue'}
                    </button>
                  </div>

                </form>
              </div>
            </div>

            {/* TABLE */}
            <div className="vm-card">
              <div className="vm-card-head">
                <h2>Existing Venues</h2>
              </div>

              {fetching ? (
                <div className="vm-state">Loading venues...</div>
              ) : venues.length === 0 ? (
                <div className="vm-state">No venues added yet.</div>
              ) : (
                <div className="vm-table-scroll">
                  <table className="vm-table">
                    <thead>
                      <tr>
                        <th>Block Name</th>
                        <th>Coordinates / Radius</th>
                        <th>Rooms</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venues.map((block) => (
                        <tr key={block.id}>
                          <td><div className="vm-block-name">{block.name}</div></td>
                          <td>
                            <div className="vm-coords">
                              <div>Lat: {block.latitude}</div>
                              <div>Lng: {block.longitude}</div>
                            </div>
                            <div className="vm-radius-label">Radius: {block.radius}m</div>
                          </td>
                          <td>
                            <div className="vm-room-tags">
                              {block.rooms?.map((r) => (
                                <span key={r.id} className="vm-room-tag">{r.name}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <button className="vm-btn-edit" onClick={() => handleEdit(block)}>Edit</button>
                            <button className="vm-btn-delete" onClick={() => handleDelete(block.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}