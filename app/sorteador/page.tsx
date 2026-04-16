'use client';

import { useState } from 'react';

interface Player {
  firstName: string;
  lastName: string;
  team: string;
  modality: string;
  yearsPlaying: string;
}

interface DrawnTeam {
  name: string;
  players: Player[];
  avgYears: number;
}

type DrawMethod = 'times' | 'aleatorio';
type GroupOrder = 'maiores' | 'menores';

export default function SorteadorPage() {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawMethod, setDrawMethod] = useState<DrawMethod | null>(null);
  const [teamCount, setTeamCount] = useState<string>('');
  const [result, setResult] = useState<DrawnTeam[] | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [groupOrder, setGroupOrder] = useState<GroupOrder | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setPlayers(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/sorteador/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return; }
      setPlayers(data.players);
    } catch {
      setError('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  }

  async function handleDraw() {
    if (!players || !drawMethod || !teamCount) return;
    setDrawing(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/sorteador/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players, method: drawMethod, teamCount: Number(teamCount), groupOrder }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Draw failed'); return; }
      setResult(data.teams);
    } catch {
      setError('Failed to connect to the server');
    } finally {
      setDrawing(false);
    }
  }

  const canDraw = !!players && !!drawMethod && !!teamCount && (drawMethod !== 'times' || !!groupOrder);

  return (
    <main className="min-h-screen p-10 font-mono">
      <h1 className="text-2xl font-bold mb-6">Sorteador</h1>

      {/* Upload */}
      <label className="block mb-4">
        <span className="block mb-2 text-sm font-medium">Upload CSV</span>
        <input
          type="file"
          accept=".csv"
          onChange={handleUpload}
          className="block border border-gray-400 rounded px-3 py-2 cursor-pointer"
        />
      </label>

      {loading && <p className="text-gray-500">Parsing...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Draw method */}
      {players && (
        <div className="mt-8 mb-6">
          <p className="mb-3 text-sm font-medium">Método de sorteio</p>
          <div className="flex gap-3">
            {(['times', 'aleatorio'] as DrawMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => { setDrawMethod(method); setResult(null); }}
                className={`px-6 py-2 rounded border-2 font-medium capitalize transition-colors ${
                  drawMethod === method
                    ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 shadow'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-500'
                }`}
              >
                {method === 'times' ? 'Times' : 'Aleatório'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Group order — only relevant for Times method */}
      {players && drawMethod === 'times' && (
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium">Ordem dos grupos</p>
          <div className="flex gap-3">
            {(['maiores', 'menores'] as GroupOrder[]).map((order) => (
              <button
                key={order}
                onClick={() => { setGroupOrder(order); setResult(null); }}
                className={`px-6 py-2 rounded border-2 font-medium transition-colors ${
                  groupOrder === order
                    ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-300 shadow'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:border-gray-500'
                }`}
              >
                {order === 'maiores' ? 'Maiores primeiro' : 'Menores primeiro'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team count */}
      {players && (
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Quantidade de times</label>
          <input
            type="text"
            inputMode="numeric"
            value={teamCount}
            onChange={(e) => { setTeamCount(e.target.value.replace(/\D/g, '')); setResult(null); }}
            className="border border-gray-400 rounded px-3 py-2 w-24 text-center"
          />
        </div>
      )}

      {/* Sortear button */}
      {players && (
        <button
          onClick={handleDraw}
          disabled={!canDraw || drawing}
          className="mb-10 px-8 py-3 bg-emerald-600 text-white rounded-md font-bold shadow-md ring-2 ring-emerald-300 hover:bg-emerald-700 hover:ring-emerald-400 disabled:bg-gray-300 disabled:text-gray-500 disabled:ring-0 disabled:shadow-none disabled:cursor-not-allowed transition-colors"
        >
          {drawing ? 'Sorteando...' : 'Sortear'}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="mb-10">
          <div id="print-area">
            <h2 className="text-lg font-bold mb-4">Resultado</h2>
            <div className="flex flex-wrap gap-6">
              {result.map((team) => (
                <div key={team.name} className="border border-gray-300 rounded p-4 min-w-64">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="font-bold">{team.name}</span>
                    <span className="text-xs text-gray-500">média {team.avgYears} anos</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {team.players.map((p, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span>{p.firstName} {p.lastName}</span>
                        <span className="text-gray-400 text-xs">{p.team} · {p.modality}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="no-print mt-6 px-6 py-2 bg-indigo-600 text-white rounded-md font-medium shadow ring-2 ring-indigo-300 hover:bg-indigo-700 hover:ring-indigo-400 transition-colors"
          >
            Exportar PDF
          </button>
        </div>
      )}

      {/* Players table */}
      {players && (
        <div>
          <p className="mb-3 text-sm text-gray-500">{players.length} jogadores carregados</p>
          <div className="overflow-x-auto">
            <table className="border-collapse text-sm w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">#</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Nome</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Time</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Modalidade</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Anos</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-1">{i + 1}</td>
                    <td className="border border-gray-300 px-3 py-1">{p.firstName} {p.lastName}</td>
                    <td className="border border-gray-300 px-3 py-1">{p.team}</td>
                    <td className="border border-gray-300 px-3 py-1">{p.modality}</td>
                    <td className="border border-gray-300 px-3 py-1">{p.yearsPlaying}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
