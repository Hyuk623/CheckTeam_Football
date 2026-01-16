import React, { useEffect, useMemo, useState } from 'react';
import { appendSheetData, getSheetData } from '../services/GoogleSheetsService';
import { formatDate } from '../utils/formatDate';

const MEMBER_RANGE = 'Members!A:E';
const FORMATION_RANGE = 'Formations!A:D';

const formations = {
  '4-4-2': ['GK', 'LB', 'CB1', 'CB2', 'RB', 'LM', 'CM1', 'CM2', 'RM', 'ST1', 'ST2'],
  '4-3-3': ['GK', 'LB', 'CB1', 'CB2', 'RB', 'CM1', 'CM2', 'CM3', 'LW', 'ST', 'RW'],
  '3-5-2': ['GK', 'CB1', 'CB2', 'CB3', 'LM', 'CM1', 'CM2', 'CM3', 'RM', 'ST1', 'ST2'],
};

const positionStyleMap = {
  GK: { top: '85%', left: '50%' },
  LB: { top: '70%', left: '20%' },
  CB1: { top: '70%', left: '40%' },
  CB2: { top: '70%', left: '60%' },
  CB3: { top: '70%', left: '80%' },
  RB: { top: '70%', left: '80%' },
  LM: { top: '50%', left: '20%' },
  CM1: { top: '50%', left: '40%' },
  CM2: { top: '50%', left: '60%' },
  CM3: { top: '50%', left: '80%' },
  RM: { top: '50%', left: '80%' },
  LW: { top: '30%', left: '20%' },
  ST1: { top: '30%', left: '40%' },
  ST2: { top: '30%', left: '60%' },
  ST: { top: '30%', left: '50%' },
  RW: { top: '30%', left: '80%' },
};

const FormationPage = ({ accessToken }) => {
  const [members, setMembers] = useState([]);
  const [formation, setFormation] = useState('4-4-2');
  const [assignedPlayers, setAssignedPlayers] = useState({});
  const [error, setError] = useState('');

  const today = useMemo(() => formatDate(new Date()), []);

  const loadMembers = async () => {
    try {
      const rows = await getSheetData({ range: MEMBER_RANGE, accessToken });
      const [, ...dataRows] = rows;
      setMembers(
        dataRows
          .map((row) => ({
            name: row[0] || '',
            status: row[3] || 'active',
          }))
          .filter((member) => member.status === 'active'),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const positions = formations[formation];

  useEffect(() => {
    const nextAssignments = positions.reduce((acc, position) => {
      acc[position] = assignedPlayers[position] || '';
      return acc;
    }, {});
    setAssignedPlayers(nextAssignments);
  }, [formation]);

  const handleAssign = (position, playerName) => {
    setAssignedPlayers((prev) => ({
      ...prev,
      [position]: playerName,
    }));
  };

  const handleSave = async () => {
    setError('');
    try {
      await appendSheetData({
        range: FORMATION_RANGE,
        values: [today, formation, JSON.stringify(assignedPlayers), 'football'],
        accessToken,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-800">Formation Assignment</h2>
        <p className="text-sm text-slate-500">
          Pick a formation and assign players to each slot. Saved to Google Sheets.
        </p>
      </header>

      {error && (
        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="relative h-[540px] w-full overflow-hidden rounded-xl bg-emerald-700">
          <div className="absolute inset-0 bg-[url('/field.png')] bg-cover bg-center opacity-70" />
          <div className="absolute inset-0">
            {positions.map((position) => {
              const style = positionStyleMap[position] || { top: '50%', left: '50%' };
              return (
                <div
                  key={position}
                  className="absolute flex flex-col items-center gap-1 text-center text-xs font-semibold text-white"
                  style={{
                    top: style.top,
                    left: style.left,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span className="rounded-full bg-black/60 px-2 py-1">{position}</span>
                  <span className="rounded bg-white/80 px-2 py-1 text-[11px] text-slate-700">
                    {assignedPlayers[position] || 'Unassigned'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-600">
              Formation
              <select
                value={formation}
                onChange={(event) => setFormation(event.target.value)}
                className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              >
                {Object.keys(formations).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3">
              {positions.map((position) => (
                <label key={position} className="block text-xs font-semibold text-slate-500">
                  {position}
                  <select
                    value={assignedPlayers[position] || ''}
                    onChange={(event) => handleAssign(position, event.target.value)}
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-2 text-sm"
                  >
                    <option value="">Select player</option>
                    {members.map((member) => (
                      <option key={`${position}-${member.name}`} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Save Formation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormationPage;
