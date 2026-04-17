'use client';

import { useState } from 'react';
import Image from 'next/image';

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

  function handleDownloadExample() {
    const headers = ['Guest first name', 'Guest last name', 'Equipe Atual', 'Modalidade', 'Joga a quantos anos?'];
    const rows = [
      ['Rafael', 'Silva', 'Equipe 1', 'Sniper (550fps/2.81J)', '11'],
      ['Maycon', 'Carlete', 'Equipe 2', 'Assault (400fps/1.52J)', '3'],
      ['Vinicius', 'Lopes', 'Equipe 3', 'Support (400fps/1.52J)', '5'],
      ['Lael', 'Rios', 'Equipe 4', 'DMR (450fps/1.92J)', '2'],
      ['Marcos Daniel', 'de Aguiar', 'Equipe 5', 'Assault (400fps/1.52J)', '7'],
    ];
    const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(';')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exemplo-jogadores.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

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
    <main className="min-h-screen p-10 font-mono flex flex-col items-center text-center">
      <div className="w-full max-w-[1600px] flex flex-col items-center">
      <Image
        src="/airsoft-logo.png"
        alt="Airsoftes"
        width={512}
        height={160}
        priority
        className="mb-4 h-auto w-full max-w-md"
      />

      <div className="mb-8 flex flex-col items-center gap-2 text-[#11214a]">
        <Image
          src="/rsr.png"
          alt="Rafael"
          width={144}
          height={144}
          className="rounded-full border-4 border-[#e85d75] shadow-md object-cover w-36 h-36"
        />
        <span className="text-sm font-medium">Idealizado por Rafael</span>
      </div>

      {/* Upload */}
      <div className="mb-4">
        <span className="block text-xl font-medium mb-2">Importe sua Planilha</span>
        <div className="flex flex-col items-center gap-2">
          <label className="inline-block bg-[#e85d75] text-white border-2 border-[#c64760] rounded-md px-6 py-3 cursor-pointer font-bold shadow-md ring-2 ring-[#11214a]/30 hover:bg-[#c64760] transition-colors text-center">
            Importar Planilha
            <input
              type="file"
              accept=".csv"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          <span className="text-sm">
            (
            <button
              type="button"
              onClick={handleDownloadExample}
              className="text-[#e85d75] underline hover:text-[#c64760] transition-colors font-medium cursor-pointer"
            >
              baixe a planilha modelo clicando aqui
            </button>
            )
          </span>
        </div>
      </div>

      {loading && <p className="text-gray-500">Parsing...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Draw method */}
      {players && (
        <div className="mt-8 mb-6">
          <p className="mb-3 text-xl font-medium">Método de sorteio</p>
          <div className="flex gap-3">
            {(['times', 'aleatorio'] as DrawMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => { setDrawMethod(method); setResult(null); }}
                className={`px-6 py-2 rounded border-2 font-medium capitalize transition-colors ${
                  drawMethod === method
                    ? 'bg-[#e85d75] text-white border-[#c64760] ring-2 ring-[#11214a]/30 shadow'
                    : 'bg-white text-[#11214a] border-[#e85d75]/50 hover:bg-[#f5b8c4]/30 hover:border-[#e85d75]'
                }`}
              >
                {method === 'times' ? 'Equipes Juntas' : 'Aleatório'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Group order — only relevant for Times method */}
      {players && drawMethod === 'times' && (
        <div className="mb-6">
          <p className="mb-3 text-xl font-medium">Ordem dos grupos</p>
          <div className="flex gap-3">
            {(['maiores', 'menores'] as GroupOrder[]).map((order) => (
              <button
                key={order}
                onClick={() => { setGroupOrder(order); setResult(null); }}
                className={`px-6 py-2 rounded border-2 font-medium transition-colors ${
                  groupOrder === order
                    ? 'bg-[#e85d75] text-white border-[#c64760] ring-2 ring-[#11214a]/30 shadow'
                    : 'bg-white text-[#11214a] border-[#e85d75]/50 hover:bg-[#f5b8c4]/30 hover:border-[#e85d75]'
                }`}
              >
                {order === 'maiores' ? 'Equipes Maiores Primeiro' : 'Equipes Menores Primeiro'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team count */}
      {players && (
        <div className="mb-6">
          <label className="block mb-2 text-xl font-medium">Quantidade de times</label>
          <input
            type="text"
            inputMode="numeric"
            value={teamCount}
            onChange={(e) => { setTeamCount(e.target.value.replace(/\D/g, '')); setResult(null); }}
            className="bg-white text-[#11214a] border-2 border-[#e85d75]/50 rounded px-3 py-2 w-24 text-center hover:bg-[#f5b8c4]/30 hover:border-[#e85d75] focus:bg-[#f5b8c4]/30 focus:border-[#e85d75] focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* Action buttons */}
      {players && (
        <div className="mb-10 flex gap-3 items-center">
          <button
            onClick={handleDraw}
            disabled={!canDraw || drawing}
            className="px-8 py-3 bg-[#e85d75] text-white border-2 border-[#c64760] rounded-md font-bold shadow-md ring-2 ring-[#11214a]/30 hover:bg-[#c64760] disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-400 disabled:ring-0 disabled:shadow-none disabled:cursor-not-allowed transition-colors"
          >
            {drawing ? 'Sorteando...' : 'Sortear'}
          </button>
          {result && (
            <button
              onClick={() => window.print()}
              className="no-print px-6 py-3 bg-[#e85d75] text-white border-2 border-[#c64760] rounded-md font-medium shadow ring-2 ring-[#f4c430] hover:bg-[#c64760] hover:ring-[#11214a] transition-colors"
            >
              Exportar PDF
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mb-10">
          <div id="print-area">
            <h2 className="text-3xl font-bold mb-4">Resultado</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-16 w-full">
              {result.map((team) => (
                <div key={team.name} className="min-w-0 w-full">
                  <div className="flex items-baseline justify-between mb-2 text-[#11214a]">
                    <span className="font-bold text-lg">{team.name}</span>
                    <span className="text-xs text-gray-500">média {team.avgYears} anos</span>
                  </div>
                  <table className="border-collapse text-sm w-full mx-auto text-[#11214a] shadow-sm">
                    <thead>
                      <tr className="bg-gray-300">
                        <th className="border border-gray-400 px-2 py-2 text-left font-semibold whitespace-nowrap">#</th>
                        <th className="border border-gray-400 px-2 py-2 text-left font-semibold whitespace-nowrap">Nome</th>
                        <th className="border border-gray-400 px-2 py-2 text-left font-semibold whitespace-nowrap">Time</th>
                        <th className="border border-gray-400 px-2 py-2 text-left font-semibold whitespace-nowrap">Modalidade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.players.map((p, i) => (
                        <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-100'} hover:bg-gray-200 transition-colors`}>
                          <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{i + 1}</td>
                          <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{p.firstName} {p.lastName}</td>
                          <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{p.team}</td>
                          <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{p.modality}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Players table */}
      {players && (
        <div className="w-full">
          <p className="mb-3 text-sm text-gray-500">{players.length} jogadores carregados</p>
          <div className="overflow-x-auto flex justify-center">
            <table className="border-collapse text-sm w-auto mx-auto text-gray-500 shadow-sm opacity-80">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">#</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">Nome</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">Time</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">Modalidade</th>
                  <th className="border border-gray-200 px-3 py-2 text-left font-medium">Anos</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={i} className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
                    <td className="border border-gray-200 px-3 py-1">{i + 1}</td>
                    <td className="border border-gray-200 px-3 py-1">{p.firstName} {p.lastName}</td>
                    <td className="border border-gray-200 px-3 py-1">{p.team}</td>
                    <td className="border border-gray-200 px-3 py-1">{p.modality}</td>
                    <td className="border border-gray-200 px-3 py-1">{p.yearsPlaying}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>
    </main>
  );
}
