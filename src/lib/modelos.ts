export type Modelo = { id: string; titulo: string; subtitulo: string; arquivo: string; }; 
export const modelos: Modelo[] = [
  { id: "advertencias", titulo: "Segurança — Advertências", subtitulo: "Nome, matrícula e descrição da advertência", arquivo: "Modelo_Seguranca_Advertencias_2027.xlsx" },
  { id: "acidentes", titulo: "Segurança — Acidentes", subtitulo: "Nome, matrícula e descrição do acidente", arquivo: "Modelo_Seguranca_Acidentes_2027.xlsx" },
  { id: "produtividade", titulo: "Produtividade", subtitulo: "Notas de 0 a 100", arquivo: "Modelo_Produtividade_2027.xlsx" },
  { id: "dirigibilidade", titulo: "Dirigibilidade", subtitulo: "Notas e fonte: Gobrax, Max Track ou IDT", arquivo: "Modelo_Dirigibilidade_2027.xlsx" },
  { id: "jornada", titulo: "Jornada", subtitulo: "Notas de 0 a 100", arquivo: "Modelo_Jornada_2027.xlsx" },
  { id: "treinamentos", titulo: "Treinamentos", subtitulo: "Notas de 0 a 100", arquivo: "Modelo_Treinamentos_2027.xlsx" },
];
