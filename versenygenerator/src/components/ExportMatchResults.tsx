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
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },

  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: 'bold',
  },

  matchHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    width: '30%',
    textAlign: 'center',
  },

  score: {
    fontSize: 30,
    fontWeight: 'bold',
    width: '40%',
    textAlign: 'center',
  },

  infoBlock: {
    marginBottom: 20,
    lineHeight: 1.4,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
  },

  scorersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  scorersBox: {
    width: '48%',
    border: '1pt solid #555',
    padding: 8,
    borderRadius: 4,
  },

  scorerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },

  noData: {
    fontStyle: 'italic',
    color: '#777',
  },
});

function getGoalScorers(plays: any[], teamId: number | null | undefined) {
  if (!teamId) return [];

  const stats: Record<number, { name: string; goals: number }> = {};

  plays.forEach((p) => {
    if (!p.player) return;
    if (p.player.team_team_id !== teamId) return;

    const goals = p.goals ?? 0;
    if (!goals) return;

    const id = p.player.player_id;
    if (!stats[id]) {
      stats[id] = {
        name: p.player.player_name,
        goals: 0,
      };
    }
    stats[id].goals += goals;
  });

  return Object.values(stats);
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

  const result = `${match.home_team_score ?? '-'} : ${
    match.away_team_score ?? '-'
  }`;
  const date = match.match_date
    ? new Date(match.match_date).toLocaleString()
    : '-';
  const referee = match.referee?.referee_name || 'Nincs játékvezeto';

  const plays = (match.plays || []).filter((p: any) => !!p.player);

  const homeScorers = getGoalScorers(plays, homeId);
  const awayScorers = getGoalScorers(plays, awayId);

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

        <Text style={styles.sectionTitle}>Pontszerzok</Text>

        <View style={styles.scorersContainer}>
          <View style={styles.scorersBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{home}</Text>
            {homeScorers.length === 0 ? (
              <Text style={styles.noData}>Nincs pontszerzo</Text>
            ) : (
              homeScorers.map((s) => (
                <View style={styles.scorerLine} key={s.name}>
                  <Text>{s.name}</Text>
                  <Text>{s.goals} pont</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.scorersBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{away}</Text>
            {awayScorers.length === 0 ? (
              <Text style={styles.noData}>Nincs pontszerzo</Text>
            ) : (
              awayScorers.map((s) => (
                <View style={styles.scorerLine} key={s.name}>
                  <Text>{s.name}</Text>
                  <Text>{s.goals} pont</Text>
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
