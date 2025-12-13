'use client';

import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { FileDown } from 'lucide-react';

type ExportMatchResultsProps = {
  match: any;
};

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
  title: { fontSize: 20, textAlign: 'center', marginBottom: 25, fontWeight: 'bold' },
  matchHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  teamName: { fontSize: 18, fontWeight: 'bold', width: '30%', textAlign: 'center' },
  score: { fontSize: 30, fontWeight: 'bold', width: '40%', textAlign: 'center' },
  infoBlock: { marginBottom: 20, lineHeight: 1.4 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 6, marginTop: 10 },
  scorersContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  scorersBox: { width: '48%', border: '1pt solid #555', padding: 8, borderRadius: 4 },
  scorerLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  noData: { fontStyle: 'italic', color: '#777' },
});

function getUnitByGame(game?: string) {
  const g = (game || '').toLowerCase();
  return g === 'basketball' ? 'pont' : 'gól';
}

function getScoredValueFromPlay(p: any, game?: string) {
  const g = (game || '').toLowerCase();

  if (g === 'basketball') {
    const p2 = Number(p.points_2pt) || 0;      
    const p3 = Number(p.points_3pt) || 0;      
    const ft = Number(p.free_throws) || 0;     
    return p2 * 2 + p3 * 3 + ft;
  }


  return Number(p.goals) || 0;
}

function getScorers(plays: any[], teamId: number | null | undefined, game?: string) {
  if (!teamId) return [];

  const stats: Record<number, { name: string; value: number }> = {};

  plays.forEach((p) => {
    if (!p.player) return;


    if (String(p.player.team_team_id) !== String(teamId)) return;

    const value = getScoredValueFromPlay(p, game);
    if (!value) return;

    const id = p.player.player_id;
    if (!stats[id]) {
      stats[id] = { name: p.player.player_name, value: 0 };
    }
    stats[id].value += value;
  });

  return Object.values(stats).sort((a, b) => b.value - a.value);
}

function MatchPdf({ match }: { match: any }) {
  const stadiumOrVenue =
    match.venue?.venue_name ||
    match.stadium?.stadium_name ||
    'Nincs helyszín';

  const home = match.homeTeam?.team_name || 'Hazai csapat';
  const away = match.awayTeam?.team_name || 'Idegen csapat';
  const homeId = match.homeTeam?.team_id;
  const awayId = match.awayTeam?.team_id;

  const result = `${match.home_team_score ?? '-'} : ${match.away_team_score ?? '-'}`;
  const date = match.match_date ? new Date(match.match_date).toLocaleString() : '-';
  const referee = match.referee?.referee_name || 'Nincs játékvezeto';

  const game = match.tournament?.game; 
  const unit = getUnitByGame(game);

  const plays = (match.plays || []).filter((p: any) => !!p.player);

  const homeScorers = getScorers(plays, homeId, game);
  const awayScorers = getScorers(plays, awayId, game);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Mérkozés eredménye</Text>

        <View style={styles.matchHeaderContainer}>
          <Text style={styles.teamName}>{home}</Text>
          <Text style={styles.score}>{result}</Text>
          <Text style={styles.teamName}>{away}</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text>Helyszín: {stadiumOrVenue}</Text>
          <Text>Idopont: {date}</Text>
          <Text>Játékvezeto: {referee}</Text>
        </View>

        <Text style={styles.sectionTitle}>
          {unit === 'pont' ? 'Pontszerzok' : 'Gólszerzok'}
        </Text>

        <View style={styles.scorersContainer}>
          <View style={styles.scorersBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{home}</Text>
            {homeScorers.length === 0 ? (
              <Text style={styles.noData}>
                Nincs {unit === 'pont' ? 'pontszerzo' : 'gólszerzo'}
              </Text>
            ) : (
              homeScorers.map((s) => (
                <View style={styles.scorerLine} key={s.name}>
                  <Text>{s.name}</Text>
                  <Text>{s.value} {unit}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.scorersBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{away}</Text>
            {awayScorers.length === 0 ? (
              <Text style={styles.noData}>
                Nincs {unit === 'pont' ? 'pontszerzo' : 'gólszerzo'}
              </Text>
            ) : (
              awayScorers.map((s) => (
                <View style={styles.scorerLine} key={s.name}>
                  <Text>{s.name}</Text>
                  <Text>{s.value} {unit}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default function ExportMatchResults({ match }: ExportMatchResultsProps) {
  const home = match.homeTeam?.team_name || 'Hazai';
  const away = match.awayTeam?.team_name || 'Vendég';

  return (
    <PDFDownloadLink
      document={<MatchPdf match={match} />}
      fileName={`match_${home}_vs_${away}.pdf`}
    >
      {({ loading }) => (
        <FileDown
          className="w-5 h-5 inline cursor-pointer ml-2 text-gray-700 hover:text-gray-900"
          title={loading ? 'PDF generálása...' : 'PDF exportálása'}
        />
      )}
    </PDFDownloadLink>
  );
}
