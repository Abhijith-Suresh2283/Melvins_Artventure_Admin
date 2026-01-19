import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Plus, Edit2, Trash2, X, Save, Upload } from "lucide-react";

const BUCKET = "artworks";

function safeFileName(name = "") {
  return name.replace(/[^\w.-]+/g, "_");
}

export default function AdminArtworksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState({
    src: "", // will be filled after upload (public url)
    title: "",
    description: "",
    medium: "",
    year: "",
    size: "",
  });

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      setError(e?.message || "Failed to load artworks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  const openModal = (row = null) => {
    if (row) {
      setEditing(row);
      setFormData({
        src: row.src || "",
        title: row.title || "",
        description: row.description || "",
        medium: row.medium || "",
        year: row.year || "",
        size: row.size || "",
      });
      setImagePreview(row.src || "");
    } else {
      setEditing(null);
      setFormData({
        src: "",
        title: "",
        description: "",
        medium: "",
        year: "",
        size: "",
      });
      setImagePreview("");
    }

    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImageAndGetPublicUrl = async (file) => {
    const ext = file.name.split(".").pop();
    const path = `art_${Date.now()}_${Math.random().toString(16).slice(2)}_${safeFileName(
      file.name
    )}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl; // <-- store this in DB (src)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // 1) If user selected a new file, upload it and set src
      let finalSrc = formData.src;
      if (imageFile) {
        finalSrc = await uploadImageAndGetPublicUrl(imageFile);
      }

      if (!finalSrc) {
        alert("Please upload an artwork image.");
        setLoading(false);
        return;
      }

      const payload = { ...formData, src: finalSrc };

      // 2) Save DB row
      if (editing?.id) {
        const { error } = await supabase
          .from("artworks")
          .update(payload)
          .eq("id", editing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("artworks").insert([payload]);
        if (error) throw error;
      }

      await fetchArtworks();
      closeModal();
    } catch (e) {
      console.error("Save artwork error:", e?.message || e);
      alert(e?.message || "Failed to save artwork");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this artwork? This cannot be undone.");
    if (!ok) return;

    try {
      const { error } = await supabase.from("artworks").delete().eq("id", id);
      if (error) throw error;

      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      alert(e?.message || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Artworks Management</h1>
            <p className="text-gray-600 mt-1">Upload, edit, delete artworks</p>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            <Plus className="w-5 h-5" />
            Add Artwork
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Preview
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Medium
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Year
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Size
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No artworks yet.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={row.src} alt={row.title} className="w-full h-full object-cover" />
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{row.title}</div>
                      <div className="text-xs text-gray-500 max-w-md truncate">
                        {row.description}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-700">{row.medium}</td>
                    <td className="px-6 py-4 text-gray-700">{row.year}</td>
                    <td className="px-6 py-4 text-gray-700">{row.size}</td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(row)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editing ? "Edit Artwork" : "Add Artwork"}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Artwork Image
                </label>

                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-black hover:bg-gray-50 transition">
                  <Upload className="w-5 h-5" />
                  <span className="font-semibold">
                    {imageFile ? imageFile.name : "Click to upload image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePickImage}
                  />
                </label>

                {imagePreview && (
                  <div className="mt-3 w-full h-56 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* If editing and you don't choose new image, old stays */}
                <p className="text-xs text-gray-500 mt-2">
                  Tip: If editing, you can keep the existing image by not uploading a new one.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Medium
                  </label>
                  <input
                    name="medium"
                    value={formData.medium}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                    placeholder="2025"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Size</label>
                <input
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  placeholder="A4 (21.0 cm x 29.7 cm)"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  <Save className="w-5 h-5" />
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
