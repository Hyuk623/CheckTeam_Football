import React, { useEffect, useMemo, useState } from 'react';
import { appendSheetData, getSheetData } from '../services/GoogleSheetsService';
import { formatDate } from '../utils/formatDate';

const MEMBER_RANGE = 'Members!A:E';
const ATTENDANCE_RANGE = 'Attendance!A:F';

const AttendancePage = ({ accessToken }) => {
  const [members, setMembers] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const today = useMemo(() => formatDate(new Date()), []);

  const loadAttendance = async () => {
    setIsLoading(true);
    setError('');
    try {
      const memberRows = await getSheetData({ range: MEMBER_RANGE, accessToken });
      const [, ...memberData] = memberRows;
      const parsedMembers = memberData.map((row) => ({
        name: row[0] || '',
        position: row[1] || '',
        status: row[3] || 'active',
        sport: row[4] || 'football',
      }));

      const attendance = await getSheetData({ range: ATTENDANCE_RANGE, accessToken });
      const [, ...attendanceData] = attendance;

      setMembers(parsedMembers.filter((member) => member.status === 'active'));
      setAttendanceRows(
        attendanceData.map((row) => ({
          date: row[0],
          name: row[1],
          time: row[2],
          present: row[3] === 'TRUE' || row[3] === 'true',
          sport: row[4] || 'football',
          notes: row[5] || '',
        })),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const handleCheckIn = async (member) => {
    setError('');
    try {
      await appendSheetData({
        range: ATTENDANCE_RANGE,
        values: [today, member.name, new Date().toLocaleTimeString(), 'TRUE', member.sport, ''],
        accessToken,
      });
      await loadAttendance();
    } catch (err) {
      setError(err.message);
    }
  };

  const memberHistory = (name) =>
    attendanceRows
      .filter((row) => row.name === name)
      .slice(-5)
      .reverse();

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-800">Attendance Check-In</h2>
        <p className="text-sm text-slate-500">Session Date: {today}</p>
      </header>

      {error && (
        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Today&apos;s Attendance</h3>
          <p className="text-xs text-slate-500">Tap to check players in.</p>
          <div className="mt-4 space-y-3">
            {isLoading && <p className="text-xs text-slate-400">Loading...</p>}
            {members.map((member) => {
              const isPresent = attendanceRows.some(
                (row) => row.name === member.name && row.date === today,
              );

              return (
                <button
                  key={member.name}
                  type="button"
                  onClick={() => handleCheckIn(member)}
                  disabled={isPresent}
                  className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left text-sm font-medium transition ${
                    isPresent
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-700 hover:border-emerald-300'
                  }`}
                >
                  <span>{member.name}</span>
                  <span className="text-xs">
                    {isPresent ? 'Checked in' : 'Check in'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Attendance History</h3>
          <p className="text-xs text-slate-500">Recent attendance entries for each player.</p>
          <div className="mt-4 space-y-4">
            {members.map((member) => (
              <div key={`${member.name}-history`}>
                <p className="text-xs font-semibold text-slate-600">{member.name}</p>
                <div className="mt-2 overflow-hidden rounded border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-2 py-1 text-left">Date</th>
                        <th className="px-2 py-1 text-left">Time</th>
                        <th className="px-2 py-1 text-left">Present</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {memberHistory(member.name).map((row, index) => (
                        <tr key={`${member.name}-${index}`}>
                          <td className="px-2 py-1">{row.date}</td>
                          <td className="px-2 py-1">{row.time}</td>
                          <td className="px-2 py-1">{row.present ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                      {memberHistory(member.name).length === 0 && (
                        <tr>
                          <td className="px-2 py-2 text-slate-400" colSpan={3}>
                            No history yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
