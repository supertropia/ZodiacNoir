import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { NatalChartResult } from "./astrology";

const GOLD = "#8A6D2F"; // versión más oscura del dorado, para buen contraste en impresión
const INK = "#221F2A";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, color: INK, fontFamily: "Helvetica" },
  header: { marginBottom: 24, borderBottom: `1pt solid ${GOLD}`, paddingBottom: 16 },
  brand: { fontSize: 10, letterSpacing: 3, color: GOLD, marginBottom: 6 },
  title: { fontSize: 22, marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#555555" },
  bigThreeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, marginBottom: 24 },
  bigThreeItem: { width: "31%", borderTop: `1pt solid ${GOLD}`, paddingTop: 8 },
  bigThreeLabel: { fontSize: 9, color: "#777777", textTransform: "uppercase", letterSpacing: 1 },
  bigThreeValue: { fontSize: 16, marginTop: 4 },
  sectionTitle: { fontSize: 13, marginTop: 20, marginBottom: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 1 },
  tableRow: { flexDirection: "row", paddingVertical: 6, borderBottom: "0.5pt solid #DDDDDD" },
  tableHeaderRow: { flexDirection: "row", paddingVertical: 6, borderBottom: `1pt solid ${GOLD}` },
  col1: { width: "30%" },
  col2: { width: "25%" },
  col3: { width: "20%" },
  col4: { width: "25%" },
  cellHeader: { fontSize: 9, textTransform: "uppercase", color: "#777777", letterSpacing: 0.5 },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: "#999999", textAlign: "center" },
});

type PdfInput = {
  name?: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  chart: NatalChartResult;
};

function NatalChartDocument({ name, birthDate, birthTime, birthPlace, chart }: PdfInput) {
  return (
    <Document title="Carta Natal — Zodiac Noir">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>ZODIAC NOIR</Text>
          <Text style={styles.title}>Carta natal{name ? ` de ${name}` : ""}</Text>
          <Text style={styles.subtitle}>
            {birthDate} · {birthTime} hs · {birthPlace}
          </Text>
        </View>

        <View style={styles.bigThreeRow}>
          <View style={styles.bigThreeItem}>
            <Text style={styles.bigThreeLabel}>Sol</Text>
            <Text style={styles.bigThreeValue}>{chart.sun.sign}</Text>
          </View>
          <View style={styles.bigThreeItem}>
            <Text style={styles.bigThreeLabel}>Luna</Text>
            <Text style={styles.bigThreeValue}>{chart.moon.sign}</Text>
          </View>
          <View style={styles.bigThreeItem}>
            <Text style={styles.bigThreeLabel}>Ascendente</Text>
            <Text style={styles.bigThreeValue}>{chart.ascendant.sign}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Posiciones planetarias</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.col1, styles.cellHeader]}>Planeta</Text>
          <Text style={[styles.col2, styles.cellHeader]}>Signo</Text>
          <Text style={[styles.col3, styles.cellHeader]}>Grado</Text>
          <Text style={[styles.col4, styles.cellHeader]}>Casa</Text>
        </View>
        {chart.planets.map((p) => (
          <View key={p.key} style={styles.tableRow}>
            <Text style={styles.col1}>{p.name}</Text>
            <Text style={styles.col2}>{p.sign}</Text>
            <Text style={styles.col3}>{p.degreeInSign}°</Text>
            <Text style={styles.col4}>
              Casa {p.house}
              {p.retrograde ? " (R)" : ""}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Medio Cielo</Text>
        <Text>{chart.midheaven.sign} — {chart.midheaven.degreeInSign}°</Text>

        <Text style={styles.footer}>
          Generado por zodiacnoir.com · Sistema de casas {chart.houseSystem} · Zodíaco tropical ·
          Este documento es una herramienta de autoconocimiento y no reemplaza una consulta profesional.
        </Text>
      </Page>
    </Document>
  );
}

export async function generateNatalChartPdf(input: PdfInput): Promise<Buffer> {
  return renderToBuffer(<NatalChartDocument {...input} />);
}
