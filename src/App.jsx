import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">Habbad Quiz</h1>
      <p className="text-slate-400 mb-8">Plateforme multijoueur en temps réel</p>
      {!session ? (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <p className="mb-4">Connecte-toi pour lancer une partie.</p>
        </div>
      ) : (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <p>Bienvenue ! La partie va commencer.</p>
        </div>
      )}
    </div>
  );
}
