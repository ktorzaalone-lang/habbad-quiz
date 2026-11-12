import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const { data, error } = await supabase.from('questions').select('*');
        if (error) throw error;
        setQuestions(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-10 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-wider">HABBAD <span className="text-purple-500">QUIZ</span></h1>
        <span className="text-sm bg-purple-950 text-purple-300 px-3 py-1 rounded-full border border-purple-800">
          {loading ? « Chargement... » : `${questions.length} Qs chargées depuis Supabase`}
        </span>
      </header>

      <main className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-200 p-4 rounded-lg mb-6">
            Erreur de connexion : {error}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl text-center">
          <h2 className="text-3xl font-extrabold mb-4">Relever le défi Habbad</h2>
          <p className="text-slate-400 mb-6">Teste tes connaissances avec les données de ta base Supabase.</p>
          
          {loading ? (
            <p className="text-slate-500 animate-pulse">Récupération des questions...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
                <span className="text-xs uppercase tracking-widest text-purple-400 font-semibold">Statut</span>
                <p className="text-lg font-medium mt-1">Connexion Supabase active</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl">
                <span className="text-xs uppercase tracking-widest text-purple-400 font-semibold">Questions</span>
                <p className="text-lg font-medium mt-1">{questions.length} enregistrements trouvés</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
