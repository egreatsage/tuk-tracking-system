// src/app/(dashboard)/superadmin/venues/page.js
'use client';
import { useState, useEffect } from 'react';

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

  // Fetch venues on load
  const fetchVenues = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/venues');
      if (res.ok) {
        const data = await res.json();
        setVenues(data);
      }
    } catch (error) {
      console.error("Failed to fetch venues", error);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const grabCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((pos) => {
      setFormData(prev => ({
        ...prev,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      }));
    });
  };

  const addRoomField = () => setRooms([...rooms, { name: '', capacity: '' }]);

  const updateRoom = (index, field, value) => {
    const newRooms = [...rooms];
    newRooms[index][field] = value;
    setRooms(newRooms);
  };

  // Handle Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const validRooms = rooms.filter(r => r.name.trim() !== '');
    const url = editingId ? `/api/venues/${editingId}` : '/api/venues';
    const method = editingId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, rooms: validRooms })
    });

    if (res.ok) {
      alert(editingId ? "Venue updated!" : "Block and Rooms added successfully!");
      setFormData({ name: '', latitude: '', longitude: '', radius: 50 });
      setRooms([{ name: '', capacity: '' }]);
      setEditingId(null);
      fetchVenues(); // Refresh the table
    } else {
      alert("Error saving venue");
    }
    setLoading(false);
  };

  // Populate form for editing
  const handleEdit = (block) => {
    setEditingId(block.id);
    setFormData({
      name: block.name,
      latitude: block.latitude,
      longitude: block.longitude,
      radius: block.radius,
    });
    // If you want to edit rooms, populate them. Otherwise, leave as is.
    setRooms(block.rooms.length > 0 ? block.rooms : [{ name: '', capacity: '' }]);
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this block? This will delete all associated rooms.")) return;
    
    try {
      const res = await fetch(`/api/venues/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVenues();
      } else {
        alert("Failed to delete venue");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', latitude: '', longitude: '', radius: 50 });
    setRooms([{ name: '', capacity: '' }]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      
      {/* LEFT COLUMN: FORM */}
      <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
        <h1 className="text-xl font-bold mb-6">
          {editingId ? "Edit Venue" : "Add New Building/Block"}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <input 
              type="text" placeholder="Block Name (e.g., Engineering Block)" 
              className="w-full p-2 border rounded"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required
            />
            <div className="flex gap-2">
              <input 
                type="number" step="any" placeholder="Latitude" 
                className="w-1/2 p-2 border rounded"
                value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} required
              />
              <input 
                type="number" step="any" placeholder="Longitude" 
                className="w-1/2 p-2 border rounded"
                value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} required
              />
            </div>
            <button type="button" onClick={grabCurrentLocation} className="w-full bg-blue-50 text-blue-600 p-2 rounded border border-blue-200 hover:bg-blue-100 transition">
              📍 Grab Current Location
            </button>
            <input 
              type="number" placeholder="Geofence Radius (meters) - Default: 50" 
              className="w-full p-2 border rounded"
              value={formData.radius} onChange={e => setFormData({...formData, radius: e.target.value})}
            />
          </div>

          <div className="p-4 border rounded-md space-y-3 bg-gray-50">
            <h2 className="font-semibold text-sm text-gray-700">Rooms in this Block</h2>
            {rooms.map((room, index) => (
              <div key={index} className="flex gap-2">
                <input 
                  type="text" placeholder="Room Name" 
                  className="w-2/3 p-2 border rounded text-sm"
                  value={room.name} onChange={e => updateRoom(index, 'name', e.target.value)}
                  required={index === 0 && !editingId} 
                />
                <input 
                  type="number" placeholder="Capacity" 
                  className="w-1/3 p-2 border rounded text-sm"
                  value={room.capacity || ''} onChange={e => updateRoom(index, 'capacity', e.target.value)}
                />
              </div>
            ))}
            <button type="button" onClick={addRoomField} className="text-sm text-blue-600 font-medium">
              + Add another room
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            {editingId && (
              <button type="button" onClick={cancelEdit} className="w-1/3 bg-gray-200 text-gray-800 p-3 rounded-md font-bold hover:bg-gray-300">
                Cancel
              </button>
            )}
            <button type="submit" disabled={loading} className={`${editingId ? 'w-2/3' : 'w-full'} bg-green-600 hover:bg-green-700 text-white p-3 rounded-md font-bold transition`}>
              {loading ? "Saving..." : editingId ? "Update Venue" : "Save Venue"}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: DATA TABLE */}
      <div className="w-full lg:w-2/3 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6">Existing Venues</h2>
        
        {fetching ? (
          <p className="text-gray-500">Loading venues...</p>
        ) : venues.length === 0 ? (
          <p className="text-gray-500">No venues added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="p-3 text-sm font-semibold text-gray-700">Block Name</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Coordinates / Radius</th>
                  <th className="p-3 text-sm font-semibold text-gray-700">Rooms</th>
                  <th className="p-3 text-sm font-semibold text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((block) => (
                  <tr key={block.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-3 font-medium text-gray-800">{block.name}</td>
                    <td className="p-3 text-sm text-gray-600">
                      <div>Lat: {block.latitude}</div>
                      <div>Lng: {block.longitude}</div>
                      <div className="text-xs text-gray-400 mt-1">Radius: {block.radius}m</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {block.rooms?.map(r => (
                          <span key={r.id} className="bg-gray-200 px-2 py-1 rounded-md text-xs">
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button 
                        onClick={() => handleEdit(block)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(block.id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}