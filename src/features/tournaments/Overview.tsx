import { useParams } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { useTournaments } from '@/state/TournamentContext';
import { GitBranch, Info, Table, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { Metric } from '@/components/ui/Metric';
import i18n from '@/i18n';

import { Current } from '@/features/tournaments/currentTournament';
import { field, primary } from '@/components/ui/classes';

export function Overview() {
  const tournament = Current();
  const current = tournament.rounds.at(-1);
  return (
    <section className="overview-board">
      <header>
        <p>{i18n.t('app.tournament.state')}</p>
        <h2>{i18n.t('app.tournament.overview')}</h2>
      </header>
      <div className="overview-board__metrics">
        <Metric
          label={i18n.t('app.tournament.activePlayers')}
          value={tournament.players.filter((player) => player.active).length}
          icon={Users}
        />
        <Metric
          label={i18n.t('app.tournament.rounds')}
          value={`${tournament.rounds.length}/${tournament.plannedRounds}`}
          icon={GitBranch}
        />
        <Metric
          label={i18n.t('app.tournament.currentTable')}
          value={current ? i18n.t('app.tournament.roundShort', { number: current.number }) : '—'}
          icon={Table}
        />
      </div>
      <TournamentInformation />
    </section>
  );
}

function TournamentInformation() {
  const tournament = Current();
  const { id } = useParams();
  const { updateTournament } = useTournaments();
  const [information, setInformation] = useState(tournament.information);
  const [saved, setSaved] = useState(false);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateTournament(id!, { information: information.trim() });
    setSaved(true);
    showToast(i18n.t('app.tournament.informationSaved'));
  }
  return (
    <section className="notice-board">
      <header>
        <span>
          <Info size={16} aria-hidden />
        </span>
        <div>
          <h2>{i18n.t('app.tournament.information')}</h2>
          <p>{i18n.t('app.tournament.informationHelp')}</p>
        </div>
      </header>
      <form onSubmit={save}>
        <textarea
          value={information}
          onChange={(event) => {
            setInformation(event.target.value);
            setSaved(false);
          }}
          disabled={tournament.status === 'finalizado'}
          maxLength={2000}
          rows={7}
          className={`${field} resize-y`}
          placeholder={i18n.t('app.tournament.informationPlaceholder')}
        />
        <div className="notice-board__actions">
          <span>{information.length}/2000</span>
          <Button disabled={tournament.status === 'finalizado'} className={primary}>
            {i18n.t('app.tournament.saveInformation')}
          </Button>
        </div>
        {saved && (
          <p className="notice-board__saved">{i18n.t('app.tournament.informationSaved')}</p>
        )}
      </form>
    </section>
  );
}
