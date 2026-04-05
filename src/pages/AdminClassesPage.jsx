import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Brush, Palette, PenTool, Droplets,
  Plus, Edit2, Trash2, X, Save, FileText,
  Upload, ExternalLink, AlertCircle
} from 'lucide-react';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    icon: 'PenTool',
    title: '',
    description: '',
    duration: '',
    level: 'Beginner',
    syllabus_url: '',
  });
  const [syllabusFile, setSyllabusFile] = useState(null);   // File object selected by user
  const [uploadProgress, setUploadProgress] = useState(0);  // 0–100
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const iconOptions = ['PenTool', 'Palette', 'Brush', 'Droplets'];
  const levelOptions = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  const iconMap = {
    'PenTool': <PenTool className="w-5 h-5" />,
    'Palette': <Palette className="w-5 h-5" />,
    'Brush': <Brush className="w-5 h-5" />,
    'Droplets': <Droplets className="w-5 h-5" />,
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (classItem = null) => {
    setSyllabusFile(null);
    setUploadProgress(0);
    if (classItem) {
      setEditingClass(classItem);
      setFormData({
        icon: classItem.icon,
        title: classItem.title,
        description: classItem.description,
        duration: classItem.duration,
        level: classItem.level,
        syllabus_url: classItem.syllabus_url || '',
      });
    } else {
      setEditingClass(null);
      setFormData({ icon: 'PenTool', title: '', description: '', duration: '', level: 'Beginner', syllabus_url: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setSyllabusFile(null);
    setUploadProgress(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10 MB.');
      return;
    }
    setSyllabusFile(file);
  };

  const clearSyllabus = () => {
    setSyllabusFile(null);
    setFormData(prev => ({ ...prev, syllabus_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Uploads the selected PDF to Supabase Storage bucket "syllabi"
   * and returns the public URL.
   *
   * Make sure you have a public bucket named "syllabi" in Supabase Storage,
   * or change BUCKET_NAME below to match yours.
   */
  const uploadSyllabus = async (file) => {
    const BUCKET_NAME = 'syllabi';
    const safeTitle = formData.title.replace(/\s+/g, '-').toLowerCase() || 'class';
    const fileName = `${safeTitle}-${Date.now()}.pdf`;

    setUploading(true);
    setUploadProgress(10);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, { contentType: 'application/pdf', upsert: false });

    if (error) {
      setUploading(false);
      throw new Error('PDF upload failed: ' + error.message);
    }

    setUploadProgress(80);

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    setUploadProgress(100);
    setUploading(false);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let syllabusUrl = formData.syllabus_url;

      // If user picked a new PDF, upload it first
      if (syllabusFile) {
        syllabusUrl = await uploadSyllabus(syllabusFile);
      }

      const payload = { ...formData, syllabus_url: syllabusUrl || null };

      if (editingClass) {
        const { error } = await supabase.from('classes').update(payload).eq('id', editingClass.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('classes').insert([payload]);
        if (error) throw error;
      }

      await fetchClasses();
      handleCloseModal();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
      await fetchClasses();
    } catch (err) {
      alert('Error deleting class: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="mt-4 text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Classes Management</h1>
              <p className="text-gray-600 mt-1">Manage your art classes and syllabi</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Class</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {/* Classes Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Icon</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Syllabus</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No classes found. Add your first class to get started.
                  </td>
                </tr>
              ) : (
                classes.map((classItem) => (
                  <tr key={classItem.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                        {iconMap[classItem.icon]}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{classItem.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600 max-w-xs truncate">{classItem.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-600">{classItem.duration}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                        {classItem.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {classItem.syllabus_url ? (
                        <a
                          href={classItem.syllabus_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-black border border-gray-200 hover:border-black rounded-lg px-3 py-1.5 transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          View PDF
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          No syllabus
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenModal(classItem)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(classItem.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
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

      {/* ── ADD / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Icon</label>
                <div className="grid grid-cols-4 gap-3">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`p-4 border-2 rounded-lg flex items-center justify-center transition-all ${
                        formData.icon === icon ? 'border-black bg-gray-100' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {iconMap[icon]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Pencil Drawing Beginner"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Describe the class..."
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., 8 weeks"
                />
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* ── Syllabus PDF ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Syllabus PDF
                </label>

                {/* Current PDF indicator (edit mode) */}
                {formData.syllabus_url && !syllabusFile && (
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
                      <FileText className="w-4 h-4 flex-shrink-0 text-gray-500" />
                      <span className="truncate">Current syllabus attached</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <a
                        href={formData.syllabus_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-gray-600 hover:text-black flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View
                      </a>
                      <button
                        type="button"
                        onClick={clearSyllabus}
                        className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* File selected indicator */}
                {syllabusFile && (
                  <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                    <div className="flex items-center gap-2 text-sm text-green-800 min-w-0">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate font-medium">{syllabusFile.name}</span>
                      <span className="text-xs text-green-600 flex-shrink-0">
                        ({(syllabusFile.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearSyllabus}
                      className="text-green-700 hover:text-green-900 flex-shrink-0 ml-3"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload progress bar */}
                {uploading && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Uploading PDF…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Drop zone / file picker */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-black rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
                >
                  <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {syllabusFile ? 'Replace PDF' : 'Upload Syllabus PDF'}
                  </p>
                  <p className="text-xs text-gray-400">PDF only · max 10 MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{uploading ? 'Uploading…' : 'Saving…'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{editingClass ? 'Update Class' : 'Create Class'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}