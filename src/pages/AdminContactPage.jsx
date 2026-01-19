import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Save } from "lucide-react";

export default function AdminContactPage() {
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);
  const [formData, setFormData] = useState({
    headline: "",
    subheadline: "",
    email: "",
    phone: "",
    address: "",
    map_url: "",
  });

  const fetchContact = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contact_info")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setRow(data);

      setFormData({
        headline: data?.headline || "",
        subheadline: data?.subheadline || "",
        email: data?.email || "",
        phone: data?.phone || "",
        address: data?.address || "",
        map_url: data?.map_url || "",
      });
    } catch (e) {
      console.error("AdminContact fetch error:", e?.message || e);
      alert(e?.message || "Failed to load contact info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (row?.id) {
        const { error } = await supabase
          .from("contact_info")
          .update(formData)
          .eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("contact_info")
          .insert([formData]);
        if (error) throw error;
      }

      await fetchContact();
      alert("Contact info saved!");
    } catch (e) {
      console.error("Save contact error:", e?.message || e);
      alert(e?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Contact Page Settings</h1>
          <p className="text-gray-600 mt-1">Edit contact details shown on website</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form
          onSubmit={handleSave}
          className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Headline</label>
            <input
              name="headline"
              value={formData.headline}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subheadline</label>
            <textarea
              name="subheadline"
              value={formData.subheadline}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Map URL (optional)
            </label>
            <input
              name="map_url"
              value={formData.map_url}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
