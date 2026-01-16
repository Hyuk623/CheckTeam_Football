import React, { useEffect, useMemo, useState } from 'react';
import { appendSheetData, getSheetData, updateSheetData } from '../services/GoogleSheetsService';

const MEMBER_RANGE = 'Members!A:E';

const emptyForm = {
  name: '',
  position: '',
  contact: '',
  status: 'active',
  sport: 'football',
};

const MemberManagement = ({ accessToken }) => {
  const [members, setMembers] = useState([]);
  const [formState, setFormState] = useState(emptyForm);
  const [editingRow, setEditingRow] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const headers = useMemo(
    () => ['Name', 'Position', 'Contact', 'Status', 'Sport'],
    [],
  );

  const loadMembers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const rows = await getSheetData({ range: MEMBER_RANGE, accessToken });
      const [, ...dataRows] = rows;
      const parsed = dataRows.map((row, index) => ({
        id: index + 2,
        name: row[0] || '',
        position: row[1] || '',
        contact: row[2] || '',
        status: row[3] || 'active',
        sport: row[4] || 'football',
      }));
      setMembers(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormState(emptyForm);
    setEditingRow(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      if (editingRow) {
        await updateSheetData({
          range: `Members!A${editingRow}:E${editingRow}`,
          values: [
            formState.name,
            formState.position,
            formState.contact,
            formState.status,
            formState.sport,
          ],
          accessToken,
        });
      } else {
        await appendSheetData({
          range: MEMBER_RANGE,
          values: [
            formState.name,
            formState.position,
            formState.contact,
            formState.status,
            formState.sport,
          ],
          accessToken,
        });
      }
      resetForm();
      await loadMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (member) => {
    setEditingRow(member.id);
    setFormState({
      name: member.name,
      position: member.position,
      contact: member.contact,
      status: member.status,
      sport: member.sport,
    });
  };

  const handleDeactivate = async (member) => {
    setError('');
    try {
      await updateSheetData({
        range: `Members!A${member.id}:E${member.id}`,
        values: [member.name, member.position, member.contact, 'inactive', member.sport],
        accessToken,
      });
      await loadMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Member Management</h2>
        <p className="text-sm text-slate-500">
          Add new members, update details, or deactivate players. Data is synced to Google Sheets.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-600">
            Name
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Position
            <input
              type="text"
              name="position"
              value={formState.position}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="GK, CB, FW"
              required
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium text-slate-600">
            Contact
            <input
              type="text"
              name="contact"
              value={formState.contact}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="Phone or email"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Status
            <select
              name="status"
              value={formState.status}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-600">
            Sport
            <input
              type="text"
              name="sport"
              value={formState.sport}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="football"
              required
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {editingRow ? 'Save Changes' : 'Add Member'}
          </button>
          {editingRow && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Members</h3>
          {isLoading && <span className="text-xs text-slate-400">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3">
                    {header}
                  </th>
                ))}
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.map((member) => (
                <tr key={`${member.name}-${member.id}`} className="text-slate-600">
                  <td className="px-4 py-3 font-medium text-slate-800">{member.name}</td>
                  <td className="px-4 py-3">{member.position}</td>
                  <td className="px-4 py-3">{member.contact}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        member.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{member.sport}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(member)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      {member.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(member)}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberManagement;
