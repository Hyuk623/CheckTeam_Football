import React, { useEffect, useState } from 'react';
import { appendSheetData, getSheetData } from '../services/GoogleSheetsService';
import { formatDate } from '../utils/formatDate';

const MEMBER_RANGE = 'Members!A:E';
const EVALUATION_RANGE = 'Evaluations!A:E';

const tagOptions = ['teamwork', 'effort', 'pass accuracy', 'communication', 'leadership'];

const EvaluationPage = ({ accessToken }) => {
  const [members, setMembers] = useState([]);
  const [formState, setFormState] = useState({
    evaluator: '',
    target: '',
    score: 3,
    tags: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleTag = (tag) => {
    setFormState((prev) => {
      const nextTags = prev.tags.includes(tag)
        ? prev.tags.filter((item) => item !== tag)
        : [...prev.tags, tag];
      return {
        ...prev,
        tags: nextTags,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      await appendSheetData({
        range: EVALUATION_RANGE,
        values: [
          formatDate(new Date()),
          formState.evaluator,
          formState.target,
          formState.score,
          formState.tags.join(', '),
        ],
        accessToken,
      });
      setSuccess('Evaluation saved to Google Sheets.');
      setFormState({ evaluator: '', target: '', score: 3, tags: [] });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-800">Peer Evaluation</h2>
        <p className="text-sm text-slate-500">
          Rate teammates after each session. Scores are recorded in the evaluation sheet.
        </p>
      </header>

      {error && (
        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-600">
            Evaluator
            <select
              name="evaluator"
              value={formState.evaluator}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select evaluator</option>
              {members.map((member) => (
                <option key={`evaluator-${member.name}`} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-600">
            Target
            <select
              name="target"
              value={formState.target}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select teammate</option>
              {members.map((member) => (
                <option key={`target-${member.name}`} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-600">
          Score (1-5)
          <input
            type="range"
            min="1"
            max="5"
            name="score"
            value={formState.score}
            onChange={handleChange}
            className="mt-2 w-full"
          />
          <span className="text-xs text-slate-500">{formState.score} stars</span>
        </label>

        <div>
          <p className="text-sm font-medium text-slate-600">Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  formState.tags.includes(tag)
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Save Evaluation
        </button>
      </form>
    </div>
  );
};

export default EvaluationPage;
