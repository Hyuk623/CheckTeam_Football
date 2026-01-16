import React, { useEffect, useMemo, useState } from 'react';
import { getSheetData } from '../services/GoogleSheetsService';
import { formatDate } from '../utils/formatDate';

const MEMBER_RANGE = 'Members!A:E';
const ATTENDANCE_RANGE = 'Attendance!A:F';
const EVALUATION_RANGE = 'Evaluations!A:E';

const Dashboard = ({ accessToken, currentMember }) => {
  const [members, setMembers] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [evaluationRows, setEvaluationRows] = useState([]);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setError('');
    try {
      const memberRows = await getSheetData({ range: MEMBER_RANGE, accessToken });
      const attendance = await getSheetData({ range: ATTENDANCE_RANGE, accessToken });
      const evaluations = await getSheetData({ range: EVALUATION_RANGE, accessToken });

      const [, ...memberData] = memberRows;
      const [, ...attendanceData] = attendance;
      const [, ...evaluationData] = evaluations;

      setMembers(
        memberData.map((row) => ({
          name: row[0] || '',
          position: row[1] || '',
          status: row[3] || 'active',
          sport: row[4] || 'football',
        })),
      );
      setAttendanceRows(
        attendanceData.map((row) => ({
          date: row[0],
          name: row[1],
          present: row[3] === 'TRUE' || row[3] === 'true',
        })),
      );
      setEvaluationRows(
        evaluationData.map((row) => ({
          date: row[0],
          evaluator: row[1],
          target: row[2],
          score: Number(row[3]) || 0,
          tags: row[4] || '',
        })),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );

  const totalSessions = attendanceRows.reduce((acc, row) => {
    if (!acc.includes(row.date)) {
      acc.push(row.date);
    }
    return acc;
  }, []);

  const attendanceByMember = activeMembers.map((member) => {
    const count = attendanceRows.filter(
      (row) => row.name === member.name && row.present,
    ).length;
    return {
      ...member,
      count,
    };
  });

  const mostActive = [...attendanceByMember].sort((a, b) => b.count - a.count)[0];
  const leastActive = [...attendanceByMember].sort((a, b) => a.count - b.count)[0];

  const attendanceRate = totalSessions.length
    ? Math.round((attendanceRows.filter((row) => row.present).length / totalSessions.length) * 100)
    : 0;

  const personalAttendance = attendanceRows.filter(
    (row) => row.name === currentMember && row.present,
  );

  const personalEvaluation = evaluationRows.filter((row) => row.target === currentMember);
  const averageScore =
    personalEvaluation.reduce((sum, row) => sum + row.score, 0) /
    (personalEvaluation.length || 1);

  const positionCounts = activeMembers.reduce((acc, member) => {
    acc[member.position] = (acc[member.position] || 0) + 1;
    return acc;
  }, {});

  const popularPositions = Object.entries(positionCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-800">Team Dashboard</h2>
        <p className="text-sm text-slate-500">Summary for {formatDate(new Date())}</p>
      </header>

      {error && (
        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Attendance Rate</p>
          <p className="mt-2 text-2xl font-semibold text-slate-800">{attendanceRate}%</p>
          <p className="text-xs text-slate-400">Sessions tracked: {totalSessions.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Most Active Player</p>
          <p className="mt-2 text-lg font-semibold text-slate-800">
            {mostActive ? mostActive.name : 'N/A'}
          </p>
          <p className="text-xs text-slate-400">
            {mostActive ? `${mostActive.count} sessions` : 'No data'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Least Active Player</p>
          <p className="mt-2 text-lg font-semibold text-slate-800">
            {leastActive ? leastActive.name : 'N/A'}
          </p>
          <p className="text-xs text-slate-400">
            {leastActive ? `${leastActive.count} sessions` : 'No data'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Popular Positions</h3>
          <div className="mt-3 space-y-2">
            {popularPositions.map(([position, count]) => (
              <div key={position} className="flex items-center justify-between text-sm text-slate-600">
                <span>{position || 'Unassigned'}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                  {count}
                </span>
              </div>
            ))}
            {popularPositions.length === 0 && (
              <p className="text-xs text-slate-400">No position data available.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Member View</h3>
          <p className="text-xs text-slate-500">Showing: {currentMember || 'Select a member'}</p>
          <div className="mt-4 space-y-3">
            <div className="rounded border border-slate-200 px-3 py-2">
              <p className="text-xs text-slate-500">Attendance Sessions</p>
              <p className="text-lg font-semibold text-slate-700">{personalAttendance.length}</p>
            </div>
            <div className="rounded border border-slate-200 px-3 py-2">
              <p className="text-xs text-slate-500">Average Evaluation Score</p>
              <p className="text-lg font-semibold text-slate-700">
                {personalEvaluation.length ? averageScore.toFixed(1) : 'No scores'}
              </p>
              {personalEvaluation.length > 0 && (
                <p className="text-xs text-slate-400">
                  Based on {personalEvaluation.length} ratings
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
