import React from "react";
import { Link } from "react-router-dom";

export default function AdminHomePage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/admin/classes"
            className="rounded-xl border p-5 hover:shadow transition"
          >
            <h2 className="text-lg font-semibold">Manage Classes</h2>
            <p className="text-sm opacity-70 mt-1">Add / edit / delete classes</p>
          </Link>

          {/* placeholders for later */}
            <Link
            to="/admin/contact"
            className="rounded-xl border p-5 hover:shadow transition"
          >
            <h2 className="text-lg font-semibold">Edit Contact</h2>
            <p className="text-sm mt-1">Edit the contact details in the main website.</p>
          </Link>

          <Link
            to="/admin/testimonials"
            className="rounded-xl border p-5 hover:shadow transition"
            >
            <h2 className="text-lg font-semibold">Manage testimonials</h2>
            <p className="text-sm mt-1">To delete the reviews.</p>
         </Link>

          <Link
            to="/admin/artworks"
            className="rounded-xl border p-5 hover:shadow transition"
            >
            <h2 className="text-lg font-semibold">Manage Artworks</h2>
            <p className="text-sm mt-1">To add / remove tutor artworks.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
